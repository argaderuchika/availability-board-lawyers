import express from 'express';
import { ChangeRequest } from '../models/ChangeRequest.js';
import { Official } from '../models/Official.js';
import { Status, STATUS_STATES } from '../models/Status.js';
import { User } from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getTodayDateString } from '../utils/dateHelper.js';
import { getBadgeDetails } from '../utils/badgeHelper.js';

const router = express.Router();

// GET /api/requests/pending
// Fetch all pending change requests
router.get('/pending', authenticate, async (req, res) => {
  try {
    const today = getTodayDateString();
    const requests = await ChangeRequest.find({
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .populate('official', 'name designation court benchOrRoom')
      .populate('requestedBy', 'name role title contributionsCount points');

    const formatted = requests.map((r) => {
      const u = r.requestedBy;
      return {
        ...r.toObject(),
        requestedBy: u
          ? {
              ...u.toObject(),
              badge: getBadgeDetails(u.contributionsCount || 0, u.points || 0),
            }
          : null,
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending requests', error: error.message });
  }
});

// GET /api/requests/my
// Fetch user's own submitted requests
router.get('/my', authenticate, async (req, res) => {
  try {
    const requests = await ChangeRequest.find({ requestedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('official', 'name designation court benchOrRoom')
      .populate('reviewedBy', 'name role');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch personal requests', error: error.message });
  }
});

// POST /api/requests
// Backward compatible status endpoint: all authenticated users publish directly.
router.post('/', authenticate, async (req, res) => {
  try {
    const { officialId, state, note, leaveEndDate } = req.body;

    if (!officialId || !state) {
      return res.status(400).json({ message: 'Official ID and requested status state are required' });
    }

    if (!STATUS_STATES.includes(state)) {
      return res.status(400).json({ message: `Invalid status state: ${state}` });
    }

    const official = await Official.findById(officialId);
    if (!official) {
      return res.status(404).json({ message: 'Judge/Official not found' });
    }

    const today = getTodayDateString();

    const newStatus = new Status({
      official: official._id,
      state,
      note: note ? note.trim() : '',
      leaveEndDate: state === 'on_leave' && leaveEndDate ? new Date(leaveEndDate) : null,
      dateString: today,
      reportedBy: req.user._id,
    });

    await newStatus.save();
    await newStatus.populate('reportedBy', 'name role title contributionsCount points');
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { contributionsCount: 1, approvedEditsCount: 1, points: 10 },
    });

    await ChangeRequest.updateMany(
      { official: official._id, dateString: today, status: 'pending' },
      {
        status: 'rejected',
        reviewedBy: null,
        reviewedAt: new Date(),
        reviewNote: 'Superseded by a live status update. Status updates no longer require admin approval.',
      }
    );

    res.status(201).json({
      message: 'Status updated and published live',
      isDirect: true,
      status: newStatus,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to publish status', error: error.message });
  }
});

// PUT /api/requests/:id/confirm (Admin only)
// Admin confirms & approves the requested judge change
router.put('/:id/confirm', authenticate, requireAdmin, async (req, res) => {
  try {
    const request = await ChangeRequest.findById(req.params.id)
      .populate('official')
      .populate('requestedBy');

    if (!request) {
      return res.status(404).json({ message: 'Change request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    const today = getTodayDateString();

    // 1. Commit the status update to live Board
    const newStatus = new Status({
      official: request.official._id,
      state: request.requestedState,
      note: request.note,
      leaveEndDate: request.leaveEndDate,
      dateString: today,
      reportedBy: request.requestedBy._id,
    });

    await newStatus.save();

    // 2. Mark request as approved
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // 3. Award contribution points and increment stats for contributor!
    if (request.requestedBy) {
      await User.findByIdAndUpdate(request.requestedBy._id, {
        $inc: {
          contributionsCount: 1,
          approvedEditsCount: 1,
          points: 15, // 15 points for verified approved contribution
        },
      });
    }

    // Award admin points for verifying
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { points: 5 },
    });

    res.json({
      message: `Confirmed! Status for ${request.official.name} is now live.`,
      request,
      status: newStatus,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm request', error: error.message });
  }
});

// PUT /api/requests/:id/reject (Admin only)
// Admin rejects the requested judge change
router.put('/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { reviewNote } = req.body;
    const request = await ChangeRequest.findById(req.params.id).populate('official');

    if (!request) {
      return res.status(404).json({ message: 'Change request not found' });
    }

    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reviewNote = reviewNote ? reviewNote.trim() : 'Declined by Admin';
    await request.save();

    res.json({
      message: `Change request for ${request.official?.name} declined.`,
      request,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject request', error: error.message });
  }
});

// DELETE /api/requests/:id (Creator or Admin can cancel/delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const request = await ChangeRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const isCreator = request.requestedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    await request.deleteOne();
    res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel request', error: error.message });
  }
});

export default router;
