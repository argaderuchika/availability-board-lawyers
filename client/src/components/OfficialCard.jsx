import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  CalendarOff,
  HelpCircle,
  AlertCircle,
  History,
  Edit3,
  MessageSquare,
  Building,
  Check,
  X,
  Award,
} from 'lucide-react';

export const STATUS_CONFIG = {
  available: {
    label: 'Available',
    icon: CheckCircle2,
    badgeClass: 'available',
    dotColor: '#10b981',
  },
  not_sitting: {
    label: 'Not Sitting',
    icon: XCircle,
    badgeClass: 'not_sitting',
    dotColor: '#ef4444',
  },
  on_leave: {
    label: 'On Leave',
    icon: CalendarOff,
    badgeClass: 'on_leave',
    dotColor: '#a855f7',
  },
  running_late: {
    label: 'Running Late',
    icon: Clock,
    badgeClass: 'running_late',
    dotColor: '#f59e0b',
  },
  not_confirmed: {
    label: 'Not Confirmed',
    icon: HelpCircle,
    badgeClass: 'not_confirmed',
    dotColor: '#64748b',
  },
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = new Date() - new Date(dateStr);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

export default function OfficialCard({
  item,
  onQuickUpdate,
  onOpenDetails,
  onOpenHistory,
  onEditOfficial,
  onConfirmRequest,
  onRejectRequest,
  isAdmin,
}) {
  const { official, currentStatus, pendingRequest } = item;
  const statusKey = currentStatus?.state || 'not_confirmed';
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.not_confirmed;
  const StatusIcon = config.icon;

  const isToday = currentStatus?.isUpdatedToday;
  const reporter = currentStatus?.reportedBy;
  const reporterName = reporter?.name;
  const reporterBadge = reporter?.badge;
  const updatedAt = currentStatus?.updatedAt;
  const timeAgo = formatTimeAgo(updatedAt);

  // Proposed pending request details
  const proposedConfig = pendingRequest
    ? STATUS_CONFIG[pendingRequest.requestedState] || STATUS_CONFIG.not_confirmed
    : null;
  const requestReporter = pendingRequest?.requestedBy;

  return (
    <article className={`judge-card ${config.badgeClass} ${pendingRequest ? 'has-pending' : ''}`}>
      {/* Card Header: Judge Info & Live Status Badge */}
      <div className="judge-card-header">
        <div className="judge-info-primary">
          <div className="judge-title-row">
            <h3 className="judge-name">{official.name}</h3>
            {isAdmin && (
              <button
                className="edit-judge-btn"
                onClick={() => onEditOfficial(official)}
                title="Edit judge information (Admin only)"
                aria-label="Edit judge"
              >
                <Edit3 size={14} />
              </button>
            )}
          </div>

          <div className="judge-meta-line">
            <span className="judge-designation">{official.designation}</span>
            <span className="meta-sep">•</span>
            <span className="judge-court">{official.court}</span>
            <span className="meta-sep">•</span>
            <span className="judge-room">{official.benchOrRoom}</span>
          </div>
        </div>

        {/* Prominent High-Contrast Status Badge */}
        <div className={`judge-status-badge ${config.badgeClass}`}>
          <span className="status-indicator-dot"></span>
          <StatusIcon size={15} />
          <span>{config.label}</span>
        </div>
      </div>

      {/* Directory Notes */}
      {official.notes && (
        <div className="judge-chamber-note">
          <span className="note-label">Matters / Roster:</span> {official.notes}
        </div>
      )}

      {/* Daily Sitting Remark / Leave End Date */}
      {currentStatus?.note && (
        <div className="judge-remark-banner">
          <MessageSquare size={15} className="remark-icon" />
          <div className="remark-text">
            <strong>Remark:</strong> {currentStatus.note}
            {currentStatus?.leaveEndDate && (
              <span className="leave-date-pill">
                (On leave till {new Date(currentStatus.leaveEndDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Pending Change Request Banner (Awaiting Admin Confirmation) */}
      {pendingRequest && (
        <div className="judge-pending-banner">
          <div className="pending-banner-main">
            <div className="pending-status-row">
              <Clock size={15} className="pending-icon" />
              <span className="pending-label">Pending Admin Approval:</span>
              <span className={`pending-proposed-chip ${proposedConfig?.badgeClass}`}>
                {proposedConfig?.label}
              </span>
            </div>

            <div className="pending-details-row">
              Reported by <strong>{requestReporter?.name || 'Member'}</strong>
              {requestReporter?.badge && (
                <span className="contributor-tag">
                  {requestReporter.badge.name}
                </span>
              )}
              {pendingRequest.note && (
                <span className="pending-user-note">
                  "{pendingRequest.note}"
                </span>
              )}
            </div>
          </div>

          {/* Admin Confirmation Actions */}
          {isAdmin ? (
            <div className="pending-admin-actions">
              <button
                className="btn-action-decline"
                onClick={() => onRejectRequest(pendingRequest._id)}
                title="Decline change request"
              >
                <X size={13} />
                <span>Decline</span>
              </button>
              <button
                className="btn-action-approve"
                onClick={() => onConfirmRequest(pendingRequest._id)}
                title="Approve and publish to live board"
              >
                <Check size={13} />
                <span>Approve & Publish</span>
              </button>
            </div>
          ) : (
            <div className="pending-awaiting-label">
              Awaiting confirmation by Managing Counsel
            </div>
          )}
        </div>
      )}

      {/* Action Segment: Clean, Legible Status Selector */}
      <div className="judge-action-strip">
        <div className="action-strip-label">
          Set availability
        </div>

        <div className="status-button-row">
          <button
            className={`status-btn btn-avail ${statusKey === 'available' ? 'active' : ''}`}
            onClick={() => onQuickUpdate(official._id, 'available')}
          >
            <CheckCircle2 size={13} />
            <span>Available</span>
          </button>

          <button
            className={`status-btn btn-not-sitting ${statusKey === 'not_sitting' ? 'active' : ''}`}
            onClick={() => onQuickUpdate(official._id, 'not_sitting')}
          >
            <XCircle size={13} />
            <span>Not Sitting</span>
          </button>

          <button
            className={`status-btn btn-late ${statusKey === 'running_late' ? 'active' : ''}`}
            onClick={() => onQuickUpdate(official._id, 'running_late')}
          >
            <Clock size={13} />
            <span>Running Late</span>
          </button>

          <button
            className={`status-btn btn-leave ${statusKey === 'on_leave' ? 'active' : ''}`}
            onClick={() => onOpenDetails(official, 'on_leave')}
          >
            <CalendarOff size={13} />
            <span>On Leave</span>
          </button>

          <button
            className="status-btn btn-remark"
            onClick={() => onOpenDetails(official, statusKey)}
            title="Add detailed sitting remark or notes"
          >
            <MessageSquare size={13} />
            <span>Add Remark</span>
          </button>
        </div>
      </div>

      {/* Card Footer: Timestamp, Contributor, Audit History */}
      <div className="judge-card-footer">
        <div className="footer-status-text">
          {isToday && reporterName ? (
            <div className="audit-reporter-line">
              <span>Updated {timeAgo} by <strong>{reporterName}</strong></span>
              {reporterBadge && (
                <span className="contributor-rank-tag">
                  <Award size={12} />
                  <span>{reporterBadge.name}</span>
                </span>
              )}
            </div>
          ) : (
            <div className="audit-unconfirmed-line">
              <AlertCircle size={13} />
              <span>Not verified today (morning reset)</span>
            </div>
          )}
        </div>

        <button
          className="history-link-btn"
          onClick={() => onOpenHistory(official)}
          title="View audit trail of changes for this judge"
        >
          <History size={13} />
          <span>Audit Log</span>
        </button>
      </div>
    </article>
  );
}
