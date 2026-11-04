import mongoose from 'mongoose';
import { STATUS_STATES } from './Status.js';

const changeRequestSchema = new mongoose.Schema(
  {
    official: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Official',
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestedState: {
      type: String,
      enum: STATUS_STATES,
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
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNote: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

changeRequestSchema.index({ official: 1, dateString: 1, status: 1 });

export const ChangeRequest = mongoose.model('ChangeRequest', changeRequestSchema);
