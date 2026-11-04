import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarOff,
  HelpCircle,
  Check,
  AlertCircle,
  User,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api';
import { STATUS_CONFIG } from './OfficialCard';

export default function RequestsModal({
  isOpen,
  onClose,
  currentUser,
  isAdmin,
  onConfirmedOrRejected,
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState(isAdmin ? 'pending' : 'my');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const pending = await api.getPendingRequests();
        setPendingRequests(pending || []);
      }
      const my = await api.getMyRequests();
      setMyRequests(my || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isOpen, isAdmin]);

  const handleConfirm = async (requestId) => {
    setActionInProgress(requestId);
    try {
      await api.confirmRequest(requestId);
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      if (onConfirmedOrRejected) onConfirmedOrRejected('Confirmed and published status live!');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to confirm request');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (requestId) => {
    const reason = window.prompt('Optional decline reason (or leave blank):', 'Verified with court orderly - sitting on time');
    if (reason === null) return; // User cancelled prompt

    setActionInProgress(requestId);
    try {
      await api.rejectRequest(requestId, reason);
      setPendingRequests((prev) => prev.filter((r) => r._id !== requestId));
      if (onConfirmedOrRejected) onConfirmedOrRejected('Request declined.');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to decline request');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancelMyRequest = async (requestId) => {
    if (!window.confirm('Cancel this pending change request?')) return;
    try {
      await api.cancelRequest(requestId);
      setMyRequests((prev) => prev.filter((r) => r._id !== requestId));
      if (onConfirmedOrRejected) onConfirmedOrRejected('Request cancelled.');
    } catch (err) {
      alert(err.message || 'Failed to cancel request');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <AlertCircle size={22} />
            </div>
            <div>
              <h3 className="modal-title">
                {isAdmin ? 'Judge Change Requests' : 'My Edit Requests'}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {isAdmin
                  ? 'Members request edits from courtroom; Admin confirms before publishing live'
                  : 'Track status of your submitted courtroom sitting reports'}
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        {isAdmin && (
          <div className="tabs-header" style={{ marginBottom: '16px' }}>
            <button
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <span>Awaiting Admin Confirmation</span>
              {pendingRequests.length > 0 && (
                <span className="tab-counter-badge">{pendingRequests.length}</span>
              )}
            </button>
            <button
              className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              <span>My Submissions ({myRequests.length})</span>
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Loading requests...
          </div>
        ) : activeTab === 'pending' ? (
          <div>
            {pendingRequests.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px 20px' }}>
                <CheckCircle2 size={36} style={{ color: '#10b981', marginBottom: '8px' }} />
                <h4 style={{ color: '#fff', margin: '0 0 6px' }}>All caught up!</h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                  No pending change requests awaiting Admin confirmation.
                </p>
              </div>
            ) : (
              <div className="requests-list">
                {pendingRequests.map((req) => {
                  const targetConfig = STATUS_CONFIG[req.requestedState] || STATUS_CONFIG.not_confirmed;
                  const TargetIcon = targetConfig.icon;
                  const reporter = req.requestedBy;
                  const badge = reporter?.badge;

                  return (
                    <div key={req._id} className="request-card">
                      <div className="request-card-header">
                        <div>
                          <div className="request-judge-name">{req.official?.name}</div>
                          <div className="official-meta" style={{ marginTop: '2px' }}>
                            <span className="court-tag">
                              <Building2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              {req.official?.court}
                            </span>
                            <span className="room-tag">
                              <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              {req.official?.benchOrRoom}
                            </span>
                          </div>
                        </div>

                        {/* Requested State Pill */}
                        <div className={`status-pill ${targetConfig.badgeClass}`}>
                          <TargetIcon size={14} />
                          <span>Proposed: {targetConfig.label}</span>
                        </div>
                      </div>

                      {/* Request details note */}
                      {req.note && (
                        <div className="request-note-box">
                          <strong>Note from advocate:</strong> "{req.note}"
                        </div>
                      )}

                      {req.leaveEndDate && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          📅 Expected leave till:{' '}
                          {new Date(req.leaveEndDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      )}

                      {/* Request Footer: Reporter + Action Buttons */}
                      <div className="request-card-footer">
                        <div className="request-reporter-info">
                          <div className="mini-avatar">
                            {reporter?.name ? reporter.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff' }}>
                              Requested by {reporter?.name || 'Member'}
                              {badge && (
                                <span
                                  className="badge-pill"
                                  style={{
                                    marginLeft: '6px',
                                    fontSize: '0.7rem',
                                    padding: '1px 6px',
                                    background: badge.bg,
                                    color: badge.color,
                                  }}
                                >
                                  {badge.icon} {badge.name}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              Submitted{' '}
                              {new Date(req.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="request-action-btns">
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                            onClick={() => handleReject(req._id)}
                            disabled={actionInProgress === req._id}
                          >
                            <X size={14} />
                            <span>Decline</span>
                          </button>

                          <button
                            className="btn btn-primary btn-sm"
                            style={{ background: '#10b981', borderColor: '#059669' }}
                            onClick={() => handleConfirm(req._id)}
                            disabled={actionInProgress === req._id}
                          >
                            <Check size={14} />
                            <span>
                              {actionInProgress === req._id ? 'Publishing...' : 'Confirm & Publish Live'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* My Submissions Tab */
          <div>
            {myRequests.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px 20px' }}>
                <Clock size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <h4 style={{ color: '#fff', margin: '0 0 6px' }}>No edit requests yet</h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Tap any status option on a judge's card to request a real-time availability update.
                </p>
              </div>
            ) : (
              <div className="requests-list">
                {myRequests.map((req) => {
                  const targetConfig = STATUS_CONFIG[req.requestedState] || STATUS_CONFIG.not_confirmed;
                  const TargetIcon = targetConfig.icon;

                  let statusBadge = (
                    <span className="request-status-chip pending">
                      <Clock size={12} />
                      <span>Pending Admin Confirmation</span>
                    </span>
                  );
                  if (req.status === 'approved') {
                    statusBadge = (
                      <span className="request-status-chip approved">
                        <CheckCircle2 size={12} />
                        <span>Confirmed & Live (+15 pts awarded)</span>
                      </span>
                    );
                  } else if (req.status === 'rejected') {
                    statusBadge = (
                      <span className="request-status-chip rejected">
                        <XCircle size={12} />
                        <span>Declined by Admin</span>
                      </span>
                    );
                  }

                  return (
                    <div key={req._id} className="request-card">
                      <div className="request-card-header">
                        <div>
                          <div className="request-judge-name">{req.official?.name}</div>
                          <div className="official-meta" style={{ marginTop: '2px' }}>
                            <span>{req.official?.court}</span> •{' '}
                            <span>{req.official?.benchOrRoom}</span>
                          </div>
                        </div>
                        {statusBadge}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Requested Status:
                        </span>
                        <div className={`status-pill ${targetConfig.badgeClass}`} style={{ padding: '2px 8px', fontSize: '0.78rem' }}>
                          <TargetIcon size={12} />
                          <span>{targetConfig.label}</span>
                        </div>
                      </div>

                      {req.note && (
                        <div className="request-note-box">
                          <strong>Note:</strong> "{req.note}"
                        </div>
                      )}

                      {req.reviewNote && (
                        <div style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '4px' }}>
                          <strong>Admin feedback:</strong> {req.reviewNote}
                        </div>
                      )}

                      <div className="request-card-footer" style={{ borderTop: 'none', paddingTop: '4px' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Submitted at{' '}
                          {new Date(req.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {req.status === 'pending' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                            onClick={() => handleCancelMyRequest(req._id)}
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="modal-footer" style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            {isAdmin
              ? 'Managing Counsel holds confirmation authority for official chambers sitting records.'
              : 'When approved by Admin, sitting status is published live and recognition points are credited.'}
          </p>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
