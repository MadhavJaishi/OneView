'use client';

import React from 'react';
import { FolderLock, LogOut, X, QrCode, RotateCcw, Ban, Trash2 } from 'lucide-react';
import { GalleryEntryItem } from '@/lib/triple-state';

interface HistoryVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
  loading: boolean;
  historyList: GalleryEntryItem[];
  onOpenQr: (url: string, title: string) => void;
  onOpenLink: (url: string) => void;
  onRestore: (galleryId: string) => void;
  onRevoke: (galleryId: string) => void;
  onDelete: (galleryId: string) => void;
}

export const HistoryVaultModal: React.FC<HistoryVaultModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  loading,
  historyList,
  onOpenQr,
  onOpenLink,
  onRestore,
  onRevoke,
  onDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 9, 16, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 999998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="studio-card"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FolderLock size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>History Vault</h3>
            <span className="vault-meta-tag">
              PostgreSQL Stored
            </span>
            {loading && (
              <span className="vault-syncing-badge">
                <span className="syncing-dot" />
                <span>Syncing...</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={onLogout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <LogOut size={14} /> Log out
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {loading && historyList.length === 0 ? (
            /* Modern Multi-row Skeleton Loader */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[1, 2, 3].map(n => (
                <div key={n} className="history-skeleton-card">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                      <div className="skeleton-shimmer" style={{ width: '180px', height: '18px' }} />
                      <div className="skeleton-shimmer" style={{ width: '50px', height: '16px' }} />
                      <div className="skeleton-shimmer" style={{ width: '65px', height: '16px' }} />
                    </div>
                    <div className="skeleton-shimmer" style={{ width: '260px', height: '14px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
                    <div className="skeleton-shimmer" style={{ width: '60px', height: '32px', borderRadius: '6px' }} />
                    <div className="skeleton-shimmer" style={{ width: '70px', height: '32px', borderRadius: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : historyList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No active share links stored in database.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {historyList.map(item => {
                const isExpired = new Date() > new Date(item.expires_at);
                const isConsumed = item.single_use && ((item.view_count || 0) >= 1 || item.revoked);
                const isRevoked = Boolean(item.revoked);
                const isInactive = isRevoked || isExpired || isConsumed;

                return (
                  <div key={item.id} className="history-vault-item">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-bright)' }}>
                          {item.title}
                        </span>
                        <span
                          className={`vault-type-badge ${item.type === 'proxy' ? 'badge-proxy' : 'badge-media'}`}
                        >
                          {item.type.toUpperCase()}
                        </span>
                        {isConsumed ? (
                          <span className="vault-status-danger">
                            CONSUMED
                          </span>
                        ) : isRevoked ? (
                          <span className="vault-status-danger">
                            REVOKED
                          </span>
                        ) : isExpired ? (
                          <span className="vault-status-danger">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="vault-status-active">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        ID: <code style={{ color: 'var(--text-body)' }}>{item.short_code}</code> • Expiration: {new Date(item.expires_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {/* QR Code Icon: Only visible if active and NOT inactive/consumed */}
                      {!isInactive && (
                        <button
                          type="button"
                          className="vault-trigger-btn"
                          style={{ padding: '0.4rem 0.6rem' }}
                          onClick={() =>
                            onOpenQr(
                              `${typeof window !== 'undefined' ? window.location.origin : ''}/v/${item.short_code}`,
                              item.title
                            )
                          }
                          title="QR Code"
                        >
                          <QrCode size={14} />
                        </button>
                      )}

                      {!isInactive && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenLink(
                              `${typeof window !== 'undefined' ? window.location.origin : ''}/v/${item.short_code}`
                            )
                          }
                          className="vault-trigger-btn"
                          style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}
                        >
                          Open
                        </button>
                      )}

                      {/* Reinstate / Reactivate Option */}
                      {isInactive && (
                        <button
                          type="button"
                          onClick={() => onRestore(item.id)}
                          className="vault-action-btn vault-reactivate-btn"
                          title="Restore and reactivate this link for 24 hours"
                        >
                          <RotateCcw size={14} /> Reactivate
                        </button>
                      )}

                      {/* Revoke Option */}
                      {!isInactive && (
                        <button
                          type="button"
                          onClick={() => onRevoke(item.id)}
                          className="vault-action-btn vault-revoke-btn"
                          title="Immediately disable this link (stays in history as revoked)"
                        >
                          <Ban size={14} /> Revoke
                        </button>
                      )}

                      {/* Delete Option */}
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="vault-delete-btn"
                        title="Permanently erase vault and wipe all history"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
