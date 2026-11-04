import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Clock, CalendarOff, HelpCircle, Save } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', icon: CheckCircle2, color: 'var(--status-available-text)' },
  { value: 'not_sitting', label: 'Not sitting today', icon: XCircle, color: 'var(--status-not-sitting-text)' },
  { value: 'on_leave', label: 'On leave', icon: CalendarOff, color: 'var(--status-on-leave-text)' },
  { value: 'running_late', label: 'Running late', icon: Clock, color: 'var(--status-running-late-text)' },
  { value: 'not_confirmed', label: 'Not confirmed', icon: HelpCircle, color: 'var(--status-unconfirmed-text)' },
];

export default function StatusModal({ isOpen, onClose, official, initialStatus, onSave }) {
  if (!isOpen || !official) return null;

  const [state, setState] = useState(initialStatus || 'not_confirmed');
  const [note, setNote] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setState(initialStatus || 'not_confirmed');
    setNote('');
    setLeaveEndDate('');
  }, [initialStatus, official]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSave({
      officialId: official._id,
      state,
      note,
      leaveEndDate: state === 'on_leave' && leaveEndDate ? leaveEndDate : null,
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              Update Judge Availability
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {official.name} • {official.benchOrRoom}
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Status</label>
            <div className="status-radio-grid">
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = state === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`status-radio-label ${isSelected ? 'selected' : ''}`}
                    style={isSelected ? { color: opt.color, borderColor: opt.color } : {}}
                  >
                    <input
                      type="radio"
                      name="status_choice"
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => setState(opt.value)}
                      style={{ display: 'none' }}
                    />
                    <Icon size={16} />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {state === 'on_leave' && (
            <div className="form-group">
              <label className="form-label">Expected Return / End Date</label>
              <input
                type="date"
                className="form-input"
                value={leaveEndDate}
                onChange={(e) => setLeaveEndDate(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Chamber Note
            </label>
            <textarea
              className="form-textarea"
              placeholder={
                'e.g., "Sitting in Special Bench till 1:30 PM", "Matter listed at item 12"'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              <Save size={16} />
              <span>
                {submitting ? 'Publishing...' : 'Publish Live'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
