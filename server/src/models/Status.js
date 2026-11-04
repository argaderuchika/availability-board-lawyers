import mongoose from 'mongoose';

export const STATUS_STATES = [
  'available',
  'not_sitting',
  'on_leave',
  'running_late',
  'not_confirmed',
];

const statusSchema = new mongoose.Schema(
  {
    official: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Official',
      required: true,
      index: true,
    },
    state: {
      type: String,
      enum: STATUS_STATES,
      default: 'not_confirmed',
      required: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    leaveEndDate: {
      type: Date,
      default: null,
    },
    dateString: {
      type: String, // e.g. "2026-10-09" (local chamber date)
      required: true,
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find the latest status for an official on a specific day
statusSchema.index({ official: 1, dateString: 1, createdAt: -1 });

export const Status = mongoose.model('Status', statusSchema);
