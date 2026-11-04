import React, { useState, useEffect } from 'react';
import { X, UserPlus, Shield, User, Mail, Plus } from 'lucide-react';
import { api } from '../services/api';

export default function TeamManageModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    title: 'Associate Advocate',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await api.getTeamUsers();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [isOpen]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.createTeamUser(formData);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'member',
        title: 'Associate Advocate',
      });
      setShowAddForm(false);
      await fetchMembers();
    } catch (err) {
      setError(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Chamber Team Members</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Manage access for advocates, clerks, and interns
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {!showAddForm ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {members.length} Authorized Members
              </span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddForm(true)}
              >
                <Plus size={14} />
                <span>Add Member</span>
              </button>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Loading team...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {members.map((m) => (
                  <div
                    key={m._id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {m.email} • {m.title || 'Member'}
                      </div>
                    </div>
                    <span className={`user-role-badge ${m.role}`}>
                      {m.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleAddMember}>
            {error && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Adv. Rohit Verma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Chamber Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. rohit@legalchambers.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="member">Member (Can view & update statuses)</option>
                <option value="admin">Admin (Can manage judges & team)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Chamber Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Senior Associate, Legal Intern, Clerk"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Back to Team
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <UserPlus size={16} />
                <span>{submitting ? 'Creating...' : 'Save Member'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
