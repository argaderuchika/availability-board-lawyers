import React, { useState, useEffect } from 'react';
import { X, History, Clock, User, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { STATUS_CONFIG } from './OfficialCard';

export default function HistoryModal({ isOpen, onClose, official }) {
  if (!isOpen || !official) return null;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await api.getStatusHistory(official._id);
        setHistory(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [official]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Status Audit History</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {official.name}
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 8px auto' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading audit logs...</p>
          </div>
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
            No status updates logged yet for this official.
          </p>
        ) : (
          <div style={{ marginTop: '10px' }}>
            {history.map((record) => {
              const cfg = STATUS_CONFIG[record.state] || STATUS_CONFIG.not_confirmed;
              const Icon = cfg.icon;
              return (
                <div key={record._id} className="history-item">
                  <div className="history-time">
                    {new Date(record.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                  <div className="history-details" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`status-pill ${cfg.badgeClass}`} style={{ padding: '3px 8px', fontSize: '0.74rem' }}>
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      by <strong>{record.reportedBy?.name || 'Chamber Member'}</strong>
                    </span>
                  </div>
                  {record.note && (
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px', fontStyle: 'italic' }}>
                      "{record.note}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
