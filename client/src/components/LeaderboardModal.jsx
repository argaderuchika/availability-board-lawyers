import React, { useState, useEffect } from 'react';
import { X, Award, ShieldCheck, CheckCircle2, TrendingUp, Star, Users } from 'lucide-react';
import { api } from '../services/api';

const RECOGNITION_TIERS = [
  {
    name: 'Distinguished Counsel',
    tier: 'Tier 1',
    color: '#f59e0b',
    border: 'rgba(245, 158, 11, 0.3)',
    bg: 'rgba(245, 158, 11, 0.08)',
    req: '20+ verified courtroom reports',
    perk: 'Senior Court Monitor distinction • Direct fast-track updates',
  },
  {
    name: 'Senior Reporter',
    tier: 'Tier 2',
    color: '#eab308',
    border: 'rgba(234, 179, 8, 0.3)',
    bg: 'rgba(234, 179, 8, 0.08)',
    req: '10+ verified courtroom reports',
    perk: 'Senior Contributor verification badge',
  },
  {
    name: 'Lead Reporter',
    tier: 'Tier 3',
    color: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.3)',
    bg: 'rgba(56, 189, 248, 0.08)',
    req: '5+ verified courtroom reports',
    perk: 'Lead monitor verification beside daily updates',
  },
  {
    name: 'Verified Contributor',
    tier: 'Tier 4',
    color: '#a855f7',
    border: 'rgba(168, 85, 247, 0.3)',
    bg: 'rgba(168, 85, 247, 0.08)',
    req: '3+ verified courtroom reports',
    perk: 'Verified advocate contributor badge',
  },
  {
    name: 'Active Contributor',
    tier: 'Tier 5',
    color: '#10b981',
    border: 'rgba(16, 185, 129, 0.3)',
    bg: 'rgba(16, 185, 129, 0.08)',
    req: '1+ verified courtroom report',
    perk: 'Chamber reporter verification tag',
  },
];

export default function LeaderboardModal({ isOpen, onClose, currentUser }) {
  if (!isOpen) return null;

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rankings');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await api.getLeaderboard();
        setLeaderboard(data || []);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [isOpen]);

  const currentMember = leaderboard.find((u) => u.id === currentUser?.id) || currentUser;
  const currentContributions = currentMember?.contributionsCount || 0;
  const currentBadge = currentMember?.badge;

  let nextTier = null;
  let neededForNext = 0;
  if (currentContributions < 1) {
    nextTier = RECOGNITION_TIERS[4];
    neededForNext = 1 - currentContributions;
  } else if (currentContributions < 3) {
    nextTier = RECOGNITION_TIERS[3];
    neededForNext = 3 - currentContributions;
  } else if (currentContributions < 5) {
    nextTier = RECOGNITION_TIERS[2];
    neededForNext = 5 - currentContributions;
  } else if (currentContributions < 10) {
    nextTier = RECOGNITION_TIERS[1];
    neededForNext = 10 - currentContributions;
  } else if (currentContributions < 20) {
    nextTier = RECOGNITION_TIERS[0];
    neededForNext = 20 - currentContributions;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="clean-modal-icon">
              <Award size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 className="modal-title">Chamber Contributors & Recognition</h3>
              <p className="modal-subtitle">
                Official recognition rankings for on-ground courtroom sitting verification
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Member Profile Banner */}
        <div className="clean-member-banner">
          <div className="member-banner-left">
            <div className="member-avatar">
              {currentMember?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="member-banner-name">{currentMember?.name}</span>
                <span
                  className="clean-tier-tag"
                  style={{ color: currentBadge?.color || '#38bdf8', borderColor: currentBadge?.color || '#38bdf8' }}
                >
                  <Award size={12} />
                  <span>{currentBadge?.name || 'Chamber Member'}</span>
                </span>
              </div>
              <div className="member-banner-meta">
                {currentContributions} Verified Reports • {currentMember?.points || (currentContributions * 10)} Contribution Points
              </div>
            </div>
          </div>

          <div className="member-banner-right">
            {nextTier ? (
              <div className="next-tier-box">
                <span className="next-tier-sub">NEXT RECOGNITION</span>
                <span className="next-tier-title" style={{ color: nextTier.color }}>
                  {nextTier.name}
                </span>
                <span className="next-tier-need">
                  {neededForNext} more approved {neededForNext === 1 ? 'report' : 'reports'} needed
                </span>
              </div>
            ) : (
              <div className="next-tier-box">
                <span className="next-tier-sub" style={{ color: '#f59e0b' }}>HIGHEST DISTINCTION</span>
                <span className="next-tier-title" style={{ color: '#f59e0b' }}>
                  Distinguished Counsel
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Clean Tab Segment */}
        <div className="clean-tab-row">
          <button
            className={`clean-tab-btn ${activeTab === 'rankings' ? 'active' : ''}`}
            onClick={() => setActiveTab('rankings')}
          >
            <TrendingUp size={14} />
            <span>Chamber Rankings</span>
          </button>
          <button
            className={`clean-tab-btn ${activeTab === 'tiers' ? 'active' : ''}`}
            onClick={() => setActiveTab('tiers')}
          >
            <ShieldCheck size={14} />
            <span>Recognition Tiers</span>
          </button>
        </div>

        {/* Content: Rankings Table */}
        {activeTab === 'rankings' ? (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                Loading rankings...
              </div>
            ) : (
              <div className="clean-table-container">
                <table className="clean-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Rank</th>
                      <th>Advocate / Member</th>
                      <th>Role</th>
                      <th>Recognition Tier</th>
                      <th style={{ textAlign: 'right' }}>Verified Reports</th>
                      <th style={{ textAlign: 'right' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((u, idx) => {
                      const isMe = u.id === currentUser?.id;
                      const tier = u.badge || RECOGNITION_TIERS[4];

                      return (
                        <tr key={u.id} className={isMe ? 'is-current-user' : ''}>
                          <td>
                            <span className="rank-badge">#{idx + 1}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 600, color: '#fff' }}>{u.name}</span>
                              {isMe && <span className="you-tag">YOU</span>}
                            </div>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {u.title || 'Member'}
                            </span>
                          </td>
                          <td>
                            <span className={`clean-role-pill ${u.role}`}>
                              {u.role === 'admin' ? 'Admin' : 'Member'}
                            </span>
                          </td>
                          <td>
                            <span
                              className="clean-tier-tag"
                              style={{ color: tier.color, borderColor: tier.color }}
                            >
                              <Award size={12} />
                              <span>{tier.name}</span>
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#f8fafc' }}>
                            {u.contributionsCount || 0}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#38bdf8' }}>
                            {u.points || (u.contributionsCount * 10) || 0}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Content: Tiers Directory */
          <div className="tier-cards-grid">
            {RECOGNITION_TIERS.map((tier) => {
              const isAchieved = currentContributions >= (tier.name === 'Distinguished Counsel' ? 20 : tier.name === 'Senior Reporter' ? 10 : tier.name === 'Lead Reporter' ? 5 : tier.name === 'Verified Contributor' ? 3 : 1);
              return (
                <div
                  key={tier.name}
                  className={`tier-card ${isAchieved ? 'achieved' : ''}`}
                  style={{ borderLeftColor: tier.color }}
                >
                  <div className="tier-card-header">
                    <div>
                      <h4 className="tier-title" style={{ color: tier.color }}>{tier.name}</h4>
                      <span className="tier-badge-label">{tier.tier}</span>
                    </div>
                    {isAchieved && (
                      <span className="achieved-tag">
                        <CheckCircle2 size={12} />
                        <span>Achieved</span>
                      </span>
                    )}
                  </div>
                  <p className="tier-criteria">
                    <strong>Criterion:</strong> {tier.req}
                  </p>
                  <p className="tier-perk">
                    <strong>Privilege:</strong> {tier.perk}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="modal-footer" style={{ marginTop: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Points and contribution counts update when you publish a sitting report.
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
