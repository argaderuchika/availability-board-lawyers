import React, { useState } from 'react';
import {
  Scale,
  LogOut,
  Share2,
  RefreshCw,
  Award,
  Clock,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

export default function Navbar({
  user,
  onLogout,
  onOpenWhatsApp,
  onRefresh,
  isRefreshing,
  onOpenLeaderboard,
  onOpenRequests,
  pendingRequestsCount = 0,
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const badge = user?.badge;

  return (
    <header className="clean-navbar">
      <div className="navbar-brand">
        <div className="brand-logo-mark">
          <Scale size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="navbar-title">Chambers Availability Board</h1>
            <span className="live-status-tag">
              <span className="live-dot"></span>
              Live updates
            </span>
          </div>
          <div className="navbar-subtitle">
            Delhi High Court & Judicial Forums Schedule
          </div>
        </div>
      </div>

      <div className="navbar-nav-actions">
        {user && (
          <>
            {/* WhatsApp Export */}
            <button
              className="nav-action-btn"
              onClick={onOpenWhatsApp}
              title="Generate clean WhatsApp court sitting list"
            >
              <Share2 size={14} />
              <span className="nav-btn-text">WhatsApp List</span>
            </button>

            {/* Recognition & Leaderboard */}
            <button
              className="nav-action-btn"
              onClick={onOpenLeaderboard}
              title="View contributor rankings & recognition tiers"
            >
              <Award size={14} />
              <span className="nav-btn-text">Rankings</span>
            </button>

            {/* Requests Queue */}
            <button
              className={`nav-action-btn ${user.role === 'admin' && pendingRequestsCount > 0 ? 'highlight-amber' : ''}`}
              onClick={onOpenRequests}
              title={
                user.role === 'admin'
                  ? `${pendingRequestsCount} change requests awaiting admin approval`
                  : 'View your submitted sitting reports'
              }
            >
              {user.role === 'admin' ? (
                <ShieldCheck size={14} />
              ) : (
                <Clock size={14} />
              )}
              <span className="nav-btn-text">
                {user.role === 'admin' ? 'Review Requests' : 'My Submissions'}
              </span>
              {user.role === 'admin' && pendingRequestsCount > 0 && (
                <span className="nav-count-tag">{pendingRequestsCount}</span>
              )}
            </button>

            {/* Refresh */}
            <button
              className="nav-icon-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh availability board"
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
            </button>

            {/* User Account */}
            <div className="nav-user-container">
              <button
                className="nav-user-pill"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                title="Account menu"
              >
                <span className="user-initial">{user.name.charAt(0)}</span>
                <span className="user-display-name">{user.name.split(' ')[0]}</span>
                {badge && (
                  <span className="user-tier-label" title={badge.name}>
                    {badge.name}
                  </span>
                )}
                <span className={`user-role-label ${user.role}`}>
                  {user.role === 'admin' ? 'Admin' : 'Member'}
                </span>
                <ChevronDown size={12} className="chevron-icon" />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="clean-dropdown-menu">
                  <div className="dropdown-user-header">
                    <div className="header-fullname">{user.name}</div>
                    <div className="header-email">{user.email}</div>
                    {badge && (
                      <div className="header-recognition-tag">
                        <Award size={12} />
                        <span>{badge.name} • {user.contributionsCount || 0} reports</span>
                      </div>
                    )}
                  </div>

                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-logout-item"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={13} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
