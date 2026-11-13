'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  PlusCircle,
  FolderLock,
  Trash2,
  ExternalLink,
  QrCode,
  FileImage,
  Globe,
  ArrowRight,
  Command,
  X,
} from 'lucide-react';
import { GalleryEntryItem } from '@/lib/triple-state';
import { useToast } from '@/components/ToastProvider';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  galleries: GalleryEntryItem[];
  onSelectGallery: (g: GalleryEntryItem) => void;
  onDeleteGallery: (id: string) => void;
  onShowQr: (url: string, title: string) => void;
  onCreateNew: (mode: 'media' | 'proxy') => void;
  onOpenHistory: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  galleries,
  onSelectGallery,
  onDeleteGallery,
  onShowQr,
  onCreateNew,
  onOpenHistory,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via synthetic or custom event if handled outside
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Actions list
  const systemActions = [
    {
      id: 'action-media',
      title: 'Create Visual Media Share',
      subtitle: 'Upload confidential images, wireframes, or documents',
      icon: <FileImage size={16} style={{ color: '#3b82f6' }} />,
      run: () => {
        onCreateNew('media');
        onClose();
      },
    },
    {
      id: 'action-proxy',
      title: 'Create Masked Web Relay',
      subtitle: 'Shield an internal destination behind an isolated tunnel',
      icon: <Globe size={16} style={{ color: '#10b981' }} />,
      run: () => {
        onCreateNew('proxy');
        onClose();
      },
    },
    {
      id: 'action-history',
      title: 'Open History Vault',
      subtitle: 'View, filter, or revoke active database shares',
      icon: <FolderLock size={16} style={{ color: '#f59e0b' }} />,
      run: () => {
        onOpenHistory();
        onClose();
      },
    },
  ];

  // Filtered galleries by title or code
  const filteredGalleries = galleries.filter(g =>
    g.title.toLowerCase().includes(query.toLowerCase()) ||
    g.short_code.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = systemActions.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const totalItems = [...filteredActions, ...filteredGalleries];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, totalItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems.length) % Math.max(1, totalItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredActions.length) {
        filteredActions[selectedIndex].run();
      } else {
        const gal = filteredGalleries[selectedIndex - filteredActions.length];
        if (gal) {
          window.open(`/v/${gal.short_code}`, '_blank');
          onClose();
        }
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 9, 16, 0.78)',
        backdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '5rem 1.25rem 2rem 1.25rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f1624',
          border: '1px solid #1e2b42',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '580px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.1rem 1.25rem',
            borderBottom: '1px solid #1e2b42',
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            className="text-input"
            placeholder="Type a command or search active links..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              fontSize: '0.95rem',
              boxShadow: 'none',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              background: 'var(--bg-input)',
              border: '1px solid #1e2b42',
              borderRadius: '6px',
              padding: '0.2rem 0.45rem',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>ESC</span>
          </div>
        </div>

        {/* Results Stream */}
        <div style={{ overflowY: 'auto', padding: '0.75rem' }}>
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', padding: '0.4rem 0.6rem' }}>
                Quick Actions
              </div>
              {filteredActions.map((act, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={act.id}
                    onClick={act.run}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {act.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                          {act.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {act.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && <ArrowRight size={14} style={{ color: 'var(--accent-primary)' }} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Vault Records */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', padding: '0.4rem 0.6rem' }}>
              Active Database Vaults ({filteredGalleries.length})
            </div>
            {filteredGalleries.length === 0 ? (
              <div style={{ padding: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {galleries.length === 0 ? 'No share links stored in database yet.' : 'No matching vault links found.'}
              </div>
            ) : (
              filteredGalleries.map((g, gIdx) => {
                const idx = filteredActions.length + gIdx;
                const isSelected = selectedIndex === idx;
                const fullUrl = `${window.location.origin}/v/${g.short_code}`;

                return (
                  <div
                    key={g.id}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                    }}
                  >
                    <div
                      onClick={() => {
                        window.open(`/v/${g.short_code}`, '_blank');
                        onClose();
                      }}
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                          {g.title}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: g.type === 'proxy' ? 'rgba(121, 40, 202, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                            color: g.type === 'proxy' ? '#c084fc' : '#93c5fd',
                            fontWeight: 600,
                          }}
                        >
                          {g.type.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        /v/{g.short_code} • Expires {new Date(g.expires_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onShowQr(fullUrl, g.title);
                          onClose();
                        }}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid #1e2b42',
                          color: 'var(--text-body)',
                          padding: '0.35rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                        title="Display QR Code"
                      >
                        <QrCode size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteGallery(g.id);
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#f87171',
                          padding: '0.35rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                        title="Permanently Revoke"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer shortcuts helper */}
        <div
          style={{
            padding: '0.6rem 1.25rem',
            borderTop: '1px solid #1e2b42',
            background: 'var(--bg-input)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span>Navigate: ↑ ↓ • Select: ↵</span>
          <span>Quick Open: ⌘K</span>
        </div>
      </div>
    </div>
  );
};
