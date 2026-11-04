import React, { useState, useEffect } from 'react';
import { X, Save, Archive, Building2, User, MapPin, FileText, ListPlus, Plus, Sparkles, Check } from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_BULK_TEMPLATE = `Hon'ble Justice Rekha Palli | High Court of Delhi | Court Room 14 | Judge | Commercial disputes
Hon'ble Justice Amit Sharma | High Court of Delhi | Court Room 38 | Judge | Criminal appeals
Sh. Rakesh Kumar | Tis Hazari Courts | Court Room 122 | Special Judge CBI | Morning remand hearings
Ms. Shilpi Jain | Patiala House Courts | Court Room 18 | Metropolitan Magistrate | Traffic & bail mentions`;

export default function OfficialManageModal({ isOpen, onClose, official, onSave, onArchive, onBulkAdded }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'bulk'
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    court: '',
    benchOrRoom: '',
    notes: '',
  });
  const [bulkText, setBulkText] = useState(SAMPLE_BULK_TEMPLATE);
  const [parsedList, setParsedList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (official) {
      setFormData({
        name: official.name || '',
        designation: official.designation || '',
        court: official.court || '',
        benchOrRoom: official.benchOrRoom || '',
        notes: official.notes || '',
      });
      setActiveTab('single');
    } else {
      setFormData({
        name: '',
        designation: 'Judge',
        court: 'High Court of Delhi',
        benchOrRoom: '',
        notes: '',
      });
    }
  }, [official]);

  // Parse bulk text into preview
  useEffect(() => {
    if (activeTab === 'bulk') {
      const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
      const parsed = lines.map((line) => {
        const parts = line.split('|').map((p) => p.trim());
        return {
          name: parts[0] || '',
          court: parts[1] || 'High Court of Delhi',
          benchOrRoom: parts[2] || 'Court Room',
          designation: parts[3] || 'Judge',
          notes: parts[4] || '',
        };
      }).filter((item) => item.name);
      setParsedList(parsed);
    }
  }, [bulkText, activeTab]);

  const handleSubmitSingle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSave(official?._id, formData);
    setSubmitting(false);
    onClose();
  };

  const handleBulkSubmit = async () => {
    if (parsedList.length === 0) {
      alert('Please enter at least one judge name to add.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.bulkCreateOfficials(parsedList);
      alert(res.message || `Added ${parsedList.length} judges successfully`);
      if (onBulkAdded) onBulkAdded();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to bulk add judges');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!official) return;
    if (window.confirm(`Archive ${official.name}? They will be hidden from the active board.`)) {
      setSubmitting(true);
      await onArchive(official._id);
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="modal-title">
                {official ? 'Edit Judge Details' : 'Add Judges to Directory'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Admin Directory Management • Controlled sitting directory
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switch only for creating new */}
        {!official && (
          <div className="tabs-header" style={{ marginBottom: '16px' }}>
            <button
              className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => setActiveTab('single')}
            >
              <Plus size={15} />
              <span>Single Judge</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
              onClick={() => setActiveTab('bulk')}
            >
              <ListPlus size={15} />
              <span>Bulk Add List ({parsedList.length})</span>
            </button>
          </div>
        )}

        {/* Single Judge Form */}
        {activeTab === 'single' ? (
          <form onSubmit={handleSubmitSingle}>
            <div className="form-group">
              <label className="form-label">Full Name & Salutation</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Hon'ble Justice Prathiba M. Singh"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Designation</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Judge, Chief Justice, CMM, Registrar General"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Court / Forum</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., High Court of Delhi, Supreme Court, Saket Courts"
                  value={formData.court}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bench or Room Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Court Room 12, Division Bench II, Admin Block Room 204"
                value={formData.benchOrRoom}
                onChange={(e) => setFormData({ ...formData, benchOrRoom: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Chamber Notes / Matters Handled (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="e.g., Handles IP, Arbitration matters. Mentions taken at 10:30 AM."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '22px' }}>
              {official ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                  onClick={handleArchive}
                  disabled={submitting}
                >
                  <Archive size={16} />
                  <span>Archive</span>
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <Save size={16} />
                  <span>{submitting ? 'Saving...' : official ? 'Update Judge' : 'Add Judge'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Bulk Add Form */
          <div>
            <div style={{ background: 'var(--bg-card-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-md)', marginBottom: '14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong>Batch Format:</strong> Enter one judge per line, separated by vertical bars (<code>|</code>):
              <div style={{ color: '#38bdf8', marginTop: '4px', fontFamily: 'monospace' }}>
                Judge Name | Court Name | Court Room | Designation | Optional Notes
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Paste / Edit Judges List</label>
              <textarea
                className="form-textarea"
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Paste list of judges here..."
                style={{ fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'pre' }}
              />
            </div>

            {/* Parsed Preview Table */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff' }}>
                  Preview: {parsedList.length} Judges Ready to Add
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Admin confirmation adds all to directory instantly
                </span>
              </div>

              <div className="leaderboard-table-wrap" style={{ maxHeight: '180px' }}>
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Judge Name</th>
                      <th>Court</th>
                      <th>Room</th>
                      <th>Designation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedList.map((j, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{j.name}</td>
                        <td>{j.court}</td>
                        <td>{j.benchOrRoom}</td>
                        <td>{j.designation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleBulkSubmit}
                disabled={submitting || parsedList.length === 0}
                style={{ background: '#38bdf8', borderColor: '#0284c7', color: '#0f172a' }}
              >
                <Sparkles size={16} />
                <span>{submitting ? 'Adding...' : `Add All ${parsedList.length} Judges`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
