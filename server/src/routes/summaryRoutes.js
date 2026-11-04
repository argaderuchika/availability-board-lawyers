import express from 'express';
import { Official } from '../models/Official.js';
import { Status } from '../models/Status.js';
import { authenticate } from '../middleware/auth.js';
import { getTodayDateString, formatDisplayDate } from '../utils/dateHelper.js';

const router = express.Router();

const STATE_EMOJI_LABELS = {
  available: { emoji: '🟢', label: 'Available' },
  not_sitting: { emoji: '🔴', label: 'Not sitting today' },
  on_leave: { emoji: '🟣', label: 'On leave' },
  running_late: { emoji: '🟡', label: 'Running late' },
  not_confirmed: { emoji: '⚪', label: 'Not confirmed' },
};

router.get('/whatsapp', authenticate, async (req, res) => {
  try {
    const today = getTodayDateString();
    const officials = await Official.find({ active: true }).sort({ court: 1, benchOrRoom: 1, name: 1 });

    const officialIds = officials.map((o) => o._id);
    const todayStatuses = await Status.find({
      official: { $in: officialIds },
      dateString: today,
    })
      .sort({ createdAt: -1 });

    const statusMap = new Map();
    for (const s of todayStatuses) {
      if (!statusMap.has(s.official.toString())) {
        statusMap.set(s.official.toString(), s);
      }
    }

    // Group by Court
    const courtMap = new Map();
    const counts = {
      available: 0,
      not_sitting: 0,
      on_leave: 0,
      running_late: 0,
      not_confirmed: 0,
    };

    for (const off of officials) {
      const s = statusMap.get(off._id.toString());
      const state = s ? s.state : 'not_confirmed';
      const note = s && s.note && !/^sample demo status$/i.test(s.note.trim()) ? s.note : '';
      counts[state] = (counts[state] || 0) + 1;

      if (!courtMap.has(off.court)) {
        courtMap.set(off.court, []);
      }
      courtMap.get(off.court).push({
        official: off,
        state,
        note,
        isToday: Boolean(s),
      });
    }

    const formattedDate = formatDisplayDate();
    let text = `*CHAMBERS AVAILABILITY BOARD*\n*${formattedDate}*\n`;

    for (const [courtName, items] of courtMap.entries()) {
      text += `\n🏛️ *${courtName.toUpperCase()}*\n`;
      for (const item of items) {
        const meta = STATE_EMOJI_LABELS[item.state] || STATE_EMOJI_LABELS.not_confirmed;
        text += `\n• *${item.official.name}*\n`;
        text += `   ${item.official.benchOrRoom}  |  ${meta.emoji} *${meta.label}*\n`;
        if (item.note) {
          text += `   📝 ${item.note}\n`;
        }
        if (!item.isToday) {
          text += `   ⚠️ *Unconfirmed today*\n`;
        }
      }
    }

    res.json({
      summaryText: text,
      counts,
      dateString: today,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate WhatsApp summary', error: error.message });
  }
});

export default router;
