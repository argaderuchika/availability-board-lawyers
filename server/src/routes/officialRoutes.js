import express from 'express';
import { Official } from '../models/Official.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/officials
// Returns all officials. Query ?includeArchived=true (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.query.includeArchived !== 'true') {
      filter.active = true;
    }
    const officials = await Official.find(filter).sort({ court: 1, benchOrRoom: 1, name: 1 });
    res.json(officials);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch officials', error: error.message });
  }
});

// POST /api/officials (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, designation, court, benchOrRoom, notes } = req.body;
    if (!name || !designation || !court || !benchOrRoom) {
      return res.status(400).json({ message: 'Name, designation, court, and bench/room are required' });
    }

    const official = new Official({
      name: name.trim(),
      designation: designation.trim(),
      court: court.trim(),
      benchOrRoom: benchOrRoom.trim(),
      notes: notes ? notes.trim() : '',
      active: true,
    });

    await official.save();
    res.status(201).json(official);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create official', error: error.message });
  }
});

// POST /api/officials/bulk (Admin only) - Add a list of multiple judges
router.post('/bulk', authenticate, requireAdmin, async (req, res) => {
  try {
    const { officials } = req.body;
    if (!Array.isArray(officials) || officials.length === 0) {
      return res.status(400).json({ message: 'An array of officials is required' });
    }

    const validList = [];
    for (const item of officials) {
      if (item.name && item.court) {
        validList.push({
          name: item.name.trim(),
          designation: (item.designation || 'Judge').trim(),
          court: item.court.trim(),
          benchOrRoom: (item.benchOrRoom || 'Court Room').trim(),
          notes: item.notes ? item.notes.trim() : '',
          active: true,
        });
      }
    }

    if (validList.length === 0) {
      return res.status(400).json({ message: 'No valid judge records provided' });
    }

    const inserted = await Official.insertMany(validList);
    res.status(201).json({
      message: `Successfully added ${inserted.length} judges to directory`,
      count: inserted.length,
      officials: inserted,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to bulk add judges', error: error.message });
  }
});

// PUT /api/officials/:id (Admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, designation, court, benchOrRoom, notes, active } = req.body;
    const official = await Official.findById(req.params.id);
    if (!official) {
      return res.status(404).json({ message: 'Official not found' });
    }

    if (name !== undefined) official.name = name.trim();
    if (designation !== undefined) official.designation = designation.trim();
    if (court !== undefined) official.court = court.trim();
    if (benchOrRoom !== undefined) official.benchOrRoom = benchOrRoom.trim();
    if (notes !== undefined) official.notes = notes.trim();
    if (active !== undefined) official.active = Boolean(active);

    await official.save();
    res.json(official);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update official', error: error.message });
  }
});

// DELETE /api/officials/:id (Admin only) - toggles archive
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const official = await Official.findById(req.params.id);
    if (!official) {
      return res.status(404).json({ message: 'Official not found' });
    }

    // Soft delete/archive
    official.active = false;
    await official.save();
    res.json({ message: 'Official archived successfully', official });
  } catch (error) {
    res.status(500).json({ message: 'Failed to archive official', error: error.message });
  }
});

export default router;
