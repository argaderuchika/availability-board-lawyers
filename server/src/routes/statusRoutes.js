import express from 'express';
import { Official } from '../models/Official.js';
import { Status, STATUS_STATES } from '../models/Status.js';
import { ChangeRequest } from '../models/ChangeRequest.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { getTodayDateString } from '../utils/dateHelper.js';
import { getBadgeDetails } from '../utils/badgeHelper.js';

const router = express.Router();

// GET /api/statuses/today
// Returns all active officials merged with their today status and pending edit requests
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = getTodayDateString();
    const officials = await Official.find({ active: true }).sort({ court: 1, benchOrRoom: 1, name: 1 });

    const officialIds = officials.map((o) => o._id);

    // Fetch the most recent status updates for today
    const todayStatuses = await Status.find({
      official: { $in: officialIds },
      dateString: today,
    })
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name role title contributionsCount points');

    // Group latest status by officialId for today
    const latestTodayMap = new Map();
    for (const stat of todayStatuses) {
      const key = stat.official.toString();
      if (!latestTodayMap.has(key)) {
        latestTodayMap.set(key, stat);
      }
    }

    // Close requests created by the retired status approval flow. Status reports
    // now publish directly, so they should not remain in an approval queue.
    await ChangeRequest.updateMany(
      { status: 'pending' },
      {
        status: 'rejected',
        reviewedBy: null,
        reviewedAt: new Date(),
        reviewNote: 'Closed because status updates now publish directly and no longer require admin approval.',
      }
    );

    // Fetch any remaining pending directory requests for today.
    const pendingRequests = await ChangeRequest.find({
      official: { $in: officialIds },
      dateString: today,
      status: 'pending',
    })
      .sort({ createdAt: -1 })
      .populate('requestedBy', 'name role title contributionsCount points');

    const pendingRequestsMap = new Map();
    for (const reqItem of pendingRequests) {
      const key = reqItem.official.toString();
      if (!pendingRequestsMap.has(key)) {
        const u = reqItem.requestedBy;
        pendingRequestsMap.set(key, {
          ...reqItem.toObject(),
          requestedBy: u
            ? {
                ...u.toObject(),
                badge: getBadgeDetails(u.contributionsCount || 0, u.points || 0),
              }
            : null,
        });
      }
    }

    // For any official not updated today, check if they have an active multi-day "on_leave" from previous days
    const notUpdatedTodayIds = officialIds.filter((id) => !latestTodayMap.has(id.toString()));
    const ongoingLeavesMap = new Map();

    if (notUpdatedTodayIds.length > 0) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const pastLeaveStatuses = await Status.find({
        official: { $in: notUpdatedTodayIds },
        state: 'on_leave',
        leaveEndDate: { $gte: todayDate },
      })
        .sort({ createdAt: -1 })
        .populate('reportedBy', 'name role title contributionsCount points');

      for (const stat of pastLeaveStatuses) {
        const key = stat.official.toString();
        if (!ongoingLeavesMap.has(key)) {
          ongoingLeavesMap.set(key, stat);
        }
      }
    }

    // Build the merged response
    const boardItems = officials.map((official) => {
      const key = official._id.toString();
      const todayStatus = latestTodayMap.get(key);
      const ongoingLeave = ongoingLeavesMap.get(key);
      const pendingRequest = pendingRequestsMap.get(key) || null;

      if (todayStatus) {
        const reporter = todayStatus.reportedBy;
        return {
          official,
          pendingRequest,
          currentStatus: {
            id: todayStatus._id,
            state: todayStatus.state,
            note: todayStatus.note,
            leaveEndDate: todayStatus.leaveEndDate,
            reportedBy: reporter
              ? {
                  ...reporter.toObject(),
                  badge: getBadgeDetails(reporter.contributionsCount || 0, reporter.points || 0),
                }
              : null,
            updatedAt: todayStatus.createdAt,
            dateString: todayStatus.dateString,
            isUpdatedToday: true,
            isOngoingLeave: false,
          },
        };
      }

      if (ongoingLeave) {
        const reporter = ongoingLeave.reportedBy;
        return {
          official,
          pendingRequest,
          currentStatus: {
            id: ongoingLeave._id,
            state: 'on_leave',
            note: ongoingLeave.note || 'Multi-day approved leave',
            leaveEndDate: ongoingLeave.leaveEndDate,
            reportedBy: reporter
              ? {
                  ...reporter.toObject(),
                  badge: getBadgeDetails(reporter.contributionsCount || 0, reporter.points || 0),
                }
              : null,
            updatedAt: ongoingLeave.createdAt,
            dateString: ongoingLeave.dateString,
            isUpdatedToday: false,
            isOngoingLeave: true,
            warning: 'Carryover leave from previous update',
          },
        };
      }

      // Default: Not confirmed for today
      return {
        official,
        pendingRequest,
        currentStatus: {
          id: null,
          state: 'not_confirmed',
          note: '',
          leaveEndDate: null,
          reportedBy: null,
          updatedAt: null,
          dateString: today,
          isUpdatedToday: false,
          isOngoingLeave: false,
          warning: 'Not confirmed today (reset at midnight)',
        },
      };
    });

    res.json({
      todayDate: today,
      count: boardItems.length,
      items: boardItems,
      pendingRequestsCount: pendingRequests.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch today board', error: error.message });
  }
});

// POST /api/statuses/update
// Set a live status for an official. Any authenticated user can report status.
router.post('/update', authenticate, async (req, res) => {
  try {
    const { officialId, state, note, leaveEndDate } = req.body;

    if (!officialId || !state) {
      return res.status(400).json({ message: 'Official ID and state are required' });
    }

    if (!STATUS_STATES.includes(state)) {
      return res.status(400).json({ message: `Invalid state. Allowed: ${STATUS_STATES.join(', ')}` });
    }

    const official = await Official.findById(officialId);
    if (!official) {
      return res.status(404).json({ message: 'Official not found' });
    }

    const today = getTodayDateString();

    // Save the reporter on every status so the board and audit log identify who updated it.
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

    // Award contribution credit to the person who reported the status.
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { contributionsCount: 1, approvedEditsCount: 1, points: 10 },
    });

    // Close legacy status requests so an already-published status is not still shown
    // as awaiting approval.
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
      isPending: false,
      status: {
        id: newStatus._id,
        state: newStatus.state,
        note: newStatus.note,
        leaveEndDate: newStatus.leaveEndDate,
        reportedBy: newStatus.reportedBy,
        updatedAt: newStatus.createdAt,
        dateString: newStatus.dateString,
        isUpdatedToday: true,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
});

// GET /api/statuses/history/:officialId
// Returns last 15 updates for audit history
router.get('/history/:officialId', authenticate, async (req, res) => {
  try {
    const { officialId } = req.params;
    const history = await Status.find({ official: officialId })
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('reportedBy', 'name role title');

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch status history', error: error.message });
  }
});

export default router;
