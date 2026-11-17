'use client';

import React from 'react';
import { CheckCircle2, RotateCcw, Ban, Trash2, QrCode, Copy, Check, ExternalLink } from 'lucide-react';

export interface CreatedLinksData {
  galleryId: string;
  shortUrl: string;
  seedUrl: string;
  expiresAt: string;
  shortCode: string;
  isRevoked?: boolean;
}

interface LastGeneratedCardProps {
  createdLinks: CreatedLinksData;
  title: string;
  copiedKey: string | null;
  onCopy: (url: string, key: string) => void;
  onOpenQr: (url: string, title: string) => void;
  onRestore: (galleryId: string) => void;
  onRevoke: (galleryId: string) => void;
  onDelete: (galleryId: string) => void;
}

export const LastGeneratedCard: React.FC<LastGeneratedCardProps> = ({
  createdLinks,
  title,
  copiedKey,
  onCopy,
  onOpenQr,
  onRestore,
  onRevoke,
  onDelete,
}) => {
  return (
    <div
      className="studio-card"
      style={{
        marginTop: '2rem',
        border: createdLinks.isRevoked
          ? '1px solid rgba(239, 68, 68, 0.4)'
          : '1px solid var(--border-active)',
        background: 'var(--bg-surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: createdLinks.isRevoked ? '#f87171' : '#60a5fa' }}>
          <CheckCircle2 size={20} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
            {createdLinks.isRevoked ? 'Last Generated Link (Revoked)' : 'Last Secured Link Generated'}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {createdLinks.isRevoked ? (
            <button
              type="button"
              className="vault-action-btn vault-reactivate-btn"
              onClick={() => onRestore(createdLinks.galleryId)}
              title="Reactivate link for another 24 hours"
            >
              <RotateCcw size={14} /> Reactivate
            </button>
          ) : (
            <button
              type="button"
              className="vault-action-btn vault-revoke-btn"
              onClick={() => onRevoke(createdLinks.galleryId)}
              title="Immediately disable this link"
            >
              <Ban size={14} /> Revoke Link
            </button>
          )}
          <button
            type="button"
            className="vault-trigger-btn"
            onClick={() => onDelete(createdLinks.galleryId)}
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
            }}
            title="Permanently erase vault and all history"
          >
            <Trash2 size={14} /> Erase
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '640px' }}>
        <label className="form-label">Secure Access Link</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input readOnly className="text-input" value={createdLinks.shortUrl} style={{ fontFamily: 'var(--font-mono)' }} />
          <button
            type="button"
            className="vault-trigger-btn"
            onClick={() => onOpenQr(createdLinks.shortUrl, title || 'Confidential Share')}
            title="Display QR Code"
          >
            <QrCode size={16} />
          </button>
          <button
            type="button"
            className="vault-trigger-btn"
            onClick={() => onCopy(createdLinks.shortUrl, 'short')}
          >
            {copiedKey === 'short' ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <a href={createdLinks.shortUrl} target="_blank" rel="noreferrer" className="vault-trigger-btn">
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};
