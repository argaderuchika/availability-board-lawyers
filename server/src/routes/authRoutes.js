import express from 'express';
import { User } from '../models/User.js';
import { authenticate, requireAdmin, signToken } from '../middleware/auth.js';
import { getBadgeDetails } from '../utils/badgeHelper.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    const badge = getBadgeDetails(user.contributionsCount || 0, user.points || 0);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        contributionsCount: user.contributionsCount || 0,
        approvedEditsCount: user.approvedEditsCount || 0,
        points: user.points || 0,
        badge,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  const badge = getBadgeDetails(user?.contributionsCount || 0, user?.points || 0);
  res.json({
    user: {
      ...user?.toObject(),
      badge,
    },
  });
});

// GET /api/auth/leaderboard (All authenticated chamber members)
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const users = await User.find()
      .select('name role title contributionsCount approvedEditsCount points createdAt')
      .sort({ contributionsCount: -1, points: -1, name: 1 });

    const rankedUsers = users.map((u, index) => {
      const badge = getBadgeDetails(u.contributionsCount || 0, u.points || 0);
      return {
        id: u._id,
        name: u.name,
        role: u.role,
        title: u.title,
        contributionsCount: u.contributionsCount || 0,
        approvedEditsCount: u.approvedEditsCount || 0,
        points: u.points || 0,
        badge,
        rank: index + 1,
      };
    });

    res.json(rankedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
  }
});

// GET /api/auth/users (Admin only)
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const usersWithBadges = users.map((u) => ({
      ...u.toObject(),
      badge: getBadgeDetails(u.contributionsCount || 0, u.points || 0),
    }));
    res.json(usersWithBadges);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch team members', error: error.message });
  }
});

// POST /api/auth/users (Admin only)
router.post('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, title } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'member',
      title: title || 'Chamber Member',
    });

    await newUser.save();
    res.status(201).json({
      message: 'Member added successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        title: newUser.title,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

export default router;
