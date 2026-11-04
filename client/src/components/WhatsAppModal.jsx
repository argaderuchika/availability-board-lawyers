import React, { useState, useEffect } from 'react';
import { X, Copy, Check, MessageSquare, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function WhatsAppModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [summaryText, setSummaryText] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.getWhatsAppSummary();
      setSummaryText(res.summaryText);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = summaryText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(summaryText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#25d366',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="modal-title">Share to WhatsApp</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Clean morning summary formatted for chambers chat
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin-anim" style={{ margin: '0 auto 8px auto' }} />
            <p>Compiling chamber summary...</p>
          </div>
        ) : (
          <>
            <div className="whatsapp-preview-box">{summaryText}</div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                className={`btn ${copied ? 'btn-secondary' : 'btn-primary'}`}
                style={{ flex: 1 }}
                onClick={handleCopy}
              >
                {copied ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
              </button>

              <button
                type="button"
                className="btn btn-whatsapp"
                style={{ flex: 1 }}
                onClick={handleOpenWhatsApp}
              >
                <ExternalLink size={16} />
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
