import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Plus,
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarOff,
  HelpCircle,
  AlertCircle,
  Share2,
} from 'lucide-react';
import {
  api,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
  setAuthToken,
  removeAuthToken,
} from './services/api';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import OfficialCard, { STATUS_CONFIG } from './components/OfficialCard';
import StatusModal from './components/StatusModal';
import WhatsAppModal from './components/WhatsAppModal';
import OfficialManageModal from './components/OfficialManageModal';
import HistoryModal from './components/HistoryModal';
import TeamManageModal from './components/TeamManageModal';
import LeaderboardModal from './components/LeaderboardModal';
import RequestsModal from './components/RequestsModal';

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [loginError, setLoginError] = useState('');
  const [boardItems, setBoardItems] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('today');

  // Modal states
  const [statusModal, setStatusModal] = useState({ isOpen: false, official: null, initialStatus: '' });
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [officialModal, setOfficialModal] = useState({ isOpen: false, official: null });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, official: null });
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Auth logout listener
  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
    };
    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('auth-logout', handleLogoutEvent);
  }, []);

  // Fetch Board
  const loadBoardData = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent && boardItems.length === 0) setLoading(true);
    setRefreshing(true);
    try {
      const data = await api.getTodayBoard();
      setBoardItems(data.items || []);
      setPendingRequestsCount(data.pendingRequestsCount || 0);

      // Refresh current user info & badges without infinite loop
      const meRes = await api.getMe().catch(() => null);
      if (meRes?.user) {
        setUser((prev) => {
          if (!prev) return meRes.user;
          if (
            prev.points !== meRes.user.points ||
            prev.contributionsCount !== meRes.user.contributionsCount ||
            prev.role !== meRes.user.role ||
            prev.email !== meRes.user.email
          ) {
            setStoredUser(meRes.user);
            return meRes.user;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to load board:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const userIdentifier = user?.id || user?._id || user?.email;
  useEffect(() => {
    if (userIdentifier) {
      loadBoardData();
    }
  }, [userIdentifier]);

  // Login handler
  const handleLogin = async (email, password) => {
    setLoginError('');
    try {
      const data = await api.login(email, password);
      setAuthToken(data.token);
      setStoredUser(data.user);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}`);
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    removeStoredUser();
    setUser(null);
    setBoardItems([]);
  };

  // Status updates are published immediately for all signed-in users.
  const handleQuickStatusUpdate = async (officialId, newState) => {
    const target = boardItems.find((i) => i.official._id === officialId);
    const judgeName = target?.official?.name || 'Judge';
    try {
      await api.updateStatus({ officialId, state: newState });
      showToast(`Updated live: ${judgeName} is ${newState.replace('_', ' ')}`);
      loadBoardData(true);
    } catch (err) {
      showToast(err.message || 'Failed to update status');
    }
  };

  // Detailed status modal submission
  const handleDetailedStatusUpdate = async ({ officialId, state, note, leaveEndDate }) => {
    const target = boardItems.find((i) => i.official._id === officialId);
    const judgeName = target?.official?.name || 'Judge';

    try {
      await api.updateStatus({ officialId, state, note, leaveEndDate });
      showToast(`Status published live for ${judgeName}`);
      loadBoardData(true);
    } catch (err) {
      showToast(err.message || 'Failed to update status');
    }
  };

  // Admin approves change request
  const handleConfirmRequest = async (requestId) => {
    try {
      await api.confirmRequest(requestId);
      showToast('Confirmed and updated live! Contributor rewarded points.');
      loadBoardData(true);
    } catch (err) {
      showToast(err.message || 'Failed to confirm request');
    }
  };

  // Admin rejects change request
  const handleRejectRequest = async (requestId) => {
    const reason = window.prompt('Decline reason (optional):', 'Verified on-ground — regular sitting');
    if (reason === null) return;
    try {
      await api.rejectRequest(requestId, reason);
      showToast('Change request declined');
      loadBoardData(true);
    } catch (err) {
      showToast(err.message || 'Failed to reject request');
    }
  };

  // Save official details (Admin)
  const handleSaveOfficial = async (id, formData) => {
    try {
      if (id) {
        await api.updateOfficial(id, formData);
        showToast('Official details updated');
      } else {
        await api.createOfficial(formData);
        showToast('New official added to directory');
      }
      loadBoardData(true);
    } catch (err) {
      showToast(err.message || 'Action failed');
    }
  };

  // Archive official (Admin)
  const handleArchiveOfficial = async (id) => {
    try {
      await api.archiveOfficial(id);
      showToast('Official archived from active board');
      loadBoardData(true);
    } catch (err) {
      showToast(err.message || 'Archive failed');
    }
  };

  // Unique Courts for filter dropdown
  const courtsList = useMemo(() => {
    const set = new Set();
    boardItems.forEach((item) => {
      if (item.official?.court) set.add(item.official.court);
    });
    return Array.from(set).sort();
  }, [boardItems]);

  // Status counts for top summary bar
  const statusCounts = useMemo(() => {
    const counts = {
      available: 0,
      not_sitting: 0,
      on_leave: 0,
      running_late: 0,
      not_confirmed: 0,
    };
    boardItems.forEach((item) => {
      const s = item.currentStatus?.state || 'not_confirmed';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [boardItems]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return boardItems.filter((item) => {
      const official = item.official;
      const statusKey = item.currentStatus?.state || 'not_confirmed';

      // Status filter
      if (statusFilter !== 'all' && statusKey !== statusFilter) {
        return false;
      }

      // Court filter
      if (selectedCourt !== 'all' && official.court !== selectedCourt) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = official.name?.toLowerCase().includes(query);
        const matchesCourt = official.court?.toLowerCase().includes(query);
        const matchesRoom = official.benchOrRoom?.toLowerCase().includes(query);
        const matchesDesignation = official.designation?.toLowerCase().includes(query);
        const matchesNote = item.currentStatus?.note?.toLowerCase().includes(query);
        if (!matchesName && !matchesCourt && !matchesRoom && !matchesDesignation && !matchesNote) {
          return false;
        }
      }

      return true;
    });
  }, [boardItems, statusFilter, selectedCourt, searchQuery]);

  // Today formatted string
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  if (!user) {
    return <LoginView onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="app-container">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        onRefresh={() => loadBoardData(false)}
        isRefreshing={refreshing}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenRequests={() => setIsRequestsOpen(true)}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Date & Court Sitting Header */}
      <section className="court-dashboard-ribbon">
        <div className="ribbon-headline-row">
          <div className="ribbon-date-group">
            <h2 className="court-date-title">{todayFormatted}</h2>
            <div className="court-sitting-subtitle">
              Today's availability across courts and judicial forums
            </div>
          </div>

          <div className="ribbon-action-group">
            {user.role === 'admin' ? (
              <>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setOfficialModal({ isOpen: true, official: null })}
                  title="Add judge or bulk import list of judges"
                >
                  <Plus size={14} />
                  <span>Add Judges</span>
                </button>

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsTeamModalOpen(true)}
                  title="Manage chamber advocate access"
                >
                  <Users size={14} />
                  <span>Chamber Team</span>
                </button>
              </>
            ) : (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsRequestsOpen(true)}
                title="View your previous status submissions"
              >
                <Clock size={14} />
                <span>My Submissions</span>
              </button>
            )}
          </div>
        </div>

        {/* Clean Filter Segmented Bar */}
        <div className="clean-filter-strip">
          <button
            className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span>All statuses</span>
            <span className="pill-count">{boardItems.length}</span>
          </button>

          <button
            className={`filter-pill available ${statusFilter === 'available' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'available' ? 'all' : 'available')}
          >
            <span className="dot dot-avail"></span>
            <span>Available</span>
            <span className="pill-count">{statusCounts.available}</span>
          </button>

          <button
            className={`filter-pill not_sitting ${statusFilter === 'not_sitting' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'not_sitting' ? 'all' : 'not_sitting')}
          >
            <span className="dot dot-not-sitting"></span>
            <span>Not Sitting</span>
            <span className="pill-count">{statusCounts.not_sitting}</span>
          </button>

          <button
            className={`filter-pill running_late ${statusFilter === 'running_late' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'running_late' ? 'all' : 'running_late')}
          >
            <span className="dot dot-late"></span>
            <span>Running Late</span>
            <span className="pill-count">{statusCounts.running_late}</span>
          </button>

          <button
            className={`filter-pill on_leave ${statusFilter === 'on_leave' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'on_leave' ? 'all' : 'on_leave')}
          >
            <span className="dot dot-leave"></span>
            <span>On Leave</span>
            <span className="pill-count">{statusCounts.on_leave}</span>
          </button>

          <button
            className={`filter-pill not_confirmed ${statusFilter === 'not_confirmed' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'not_confirmed' ? 'all' : 'not_confirmed')}
          >
            <span className="dot dot-unverified"></span>
            <span>Not confirmed</span>
            <span className="pill-count">{statusCounts.not_confirmed}</span>
          </button>
        </div>
      </section>

      {/* Controls Bar: Search & Court Filter */}
      <div className="controls-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search judge, bench, courtroom, or chamber note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="court-select"
          value={selectedCourt}
          onChange={(e) => setSelectedCourt(e.target.value)}
        >
          <option value="all">All Courts & Forums ({boardItems.length})</option>
          {courtsList.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Officials List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <p>Loading chamber availability schedule...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <AlertCircle className="empty-icon" />
          <h3 style={{ color: '#fff', marginBottom: '6px' }}>No officials match your filter</h3>
          <p style={{ fontSize: '0.85rem' }}>
            Try clearing search keywords or selecting another court or status.
          </p>
          {(searchQuery || selectedCourt !== 'all' || statusFilter !== 'all') && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '14px' }}
              onClick={() => {
                setSearchQuery('');
                setSelectedCourt('all');
                setStatusFilter('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="cards-list">
          {filteredItems.map((item) => (
            <OfficialCard
              key={item.official._id}
              item={item}
              isAdmin={user.role === 'admin'}
              onQuickUpdate={handleQuickStatusUpdate}
              onOpenDetails={(official, statusKey) =>
                setStatusModal({ isOpen: true, official, initialStatus: statusKey })
              }
              onOpenHistory={(official) =>
                setHistoryModal({ isOpen: true, official })
              }
              onEditOfficial={(official) =>
                setOfficialModal({ isOpen: true, official })
              }
              onConfirmRequest={handleConfirmRequest}
              onRejectRequest={handleRejectRequest}
            />
          ))}
        </div>
      )}

      {/* Status Update Modal */}
      <StatusModal
        isOpen={statusModal.isOpen}
        official={statusModal.official}
        initialStatus={statusModal.initialStatus}
        onClose={() => setStatusModal({ isOpen: false, official: null, initialStatus: '' })}
        onSave={handleDetailedStatusUpdate}
      />

      {/* WhatsApp Share Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
      />

      {/* Official Create / Edit Modal (Admin only) */}
      <OfficialManageModal
        isOpen={officialModal.isOpen}
        official={officialModal.official}
        onClose={() => setOfficialModal({ isOpen: false, official: null })}
        onSave={handleSaveOfficial}
        onArchive={handleArchiveOfficial}
        onBulkAdded={() => loadBoardData(true)}
      />

      {/* History Audit Trail Modal */}
      <HistoryModal
        isOpen={historyModal.isOpen}
        official={historyModal.official}
        onClose={() => setHistoryModal({ isOpen: false, official: null })}
      />

      {/* Team Manage Modal */}
      <TeamManageModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />

      {/* Leaderboard & Contributor Badges Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUser={user}
      />

      {/* Requests Modal (Admin review & Member tracking) */}
      <RequestsModal
        isOpen={isRequestsOpen}
        onClose={() => setIsRequestsOpen(false)}
        currentUser={user}
        isAdmin={user.role === 'admin'}
        onConfirmedOrRejected={(msg) => {
          showToast(msg);
          loadBoardData(true);
        }}
      />

      {/* Toast Feedback */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 size={16} style={{ color: 'var(--accent-blue)' }} />
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
