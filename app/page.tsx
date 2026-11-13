'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Layers,
  Upload,
  Globe,
  Lock,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Sliders,
  CheckCircle2,
  FolderLock,
  LogOut,
  X,
  FileCheck,
  Zap,
  Droplet,
  Link2Off,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { GalleryEntryItem } from '@/lib/triple-state';
import { useToast } from '@/components/ToastProvider';
import { AuthModal } from '@/components/AuthModal';
import { QrModal } from '@/components/QrModal';
import { CommandPalette } from '@/components/CommandPalette';
import { QrCode, Command as CommandIcon } from 'lucide-react';

interface StagedFile {
  file: File;
  previewUrl: string;
}

export default function Dashboard() {
  const { toast, confirmModal } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState<'media' | 'proxy'>('media');
  const [title, setTitle] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [hours, setHours] = useState(24);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkText, setWatermarkText] = useState('RESTRICTED VIEW');
  const [singleUse, setSingleUse] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLinks, setCreatedLinks] = useState<{
    galleryId: string;
    shortUrl: string;
    seedUrl: string;
    expiresAt: string;
    shortCode: string;
    isRevoked?: boolean;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Authentication & History Vault State
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<GalleryEntryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // QR Code & Command Palette State
  const [qrModalData, setQrModalData] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: '',
  });
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Auth check
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
    // Auto preload history list for command palette if authenticated
    fetch('/api/gallery')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.galleries) {
          const mapped: GalleryEntryItem[] = d.galleries.map((g: any) => ({
            id: g.id,
            title: g.title,
            type: g.type,
            short_code: g.share_link?.short_code || '',
            secure_seed: g.share_link?.secure_seed || '',
            expires_at: g.share_link?.expires_at || '',
            single_use: g.share_link?.single_use || false,
            images_count: g.images?.length || 0,
            created_at: g.created_at,
          }));
          setHistoryList(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // System Buffer Clipboard Capture (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== 'media') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const newFiles: StagedFile[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const previewUrl = URL.createObjectURL(blob);
            newFiles.push({ file: blob, previewUrl });
          }
        }
      }

      if (newFiles.length > 0) {
        setStagedFiles(prev => [...prev, ...newFiles]);
        toast.info(`Pasted ${newFiles.length} image(s) from clipboard.`, 'Asset Captured');
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab, toast]);

  // Load History Vault from database
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/gallery?history=true');
      const data = await res.json();
      if (!res.ok && data.restricted) {
        setShowHistoryModal(false);
        setShowAuthModal(true);
        toast.warning('History Vault requires authentication. Please log in.', 'Restricted Area');
        return;
      }

      if (data.success && data.galleries) {
        const mapped: GalleryEntryItem[] = data.galleries.map((g: any) => ({
          id: g.id,
          title: g.title,
          type: g.type,
          short_code: g.share_link?.short_code || '',
          secure_seed: g.share_link?.secure_seed || '',
          expires_at: g.share_link?.expires_at || '',
          single_use: g.share_link?.single_use || false,
          images_count: g.images?.length || 0,
          created_at: g.created_at,
        }));
        setHistoryList(mapped);
      }
    } catch (err: any) {
      toast.error('Failed to load history vault from database', 'Error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenHistory = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowHistoryModal(true);
    fetchHistory();
  };

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout', email: 'none', password: 'none' }),
    });
    setUser(null);
    setShowHistoryModal(false);
    toast.info('Signed out of Vault account.');
  };

  // Smart Drag & Drop Aggregation + Inter-Domain Drag Snatching
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (activeTab !== 'media') return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      const staged = droppedFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setStagedFiles(prev => [...prev, ...staged]);
      return;
    }

    const html = e.dataTransfer.getData('text/html');
    const uri = e.dataTransfer.getData('text/uri-list');

    if (html || uri) {
      let candidateUrl = uri;
      if (!candidateUrl && html) {
        const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (match && match[1]) {
          candidateUrl = match[1];
        }
      }

      if (candidateUrl && candidateUrl.startsWith('http')) {
        try {
          const res = await fetch(candidateUrl);
          const blob = await res.blob();
          const file = new File([blob], `snatched-${Date.now()}.png`, { type: blob.type || 'image/png' });
          setStagedFiles(prev => [...prev, { file, previewUrl: URL.createObjectURL(file) }]);
        } catch {
          console.warn('Inter-domain snatch fetch blocked by CORS');
        }
      }
    }
  };

  // Handle Vault Creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'media' && stagedFiles.length === 0) {
      toast.warning('Please select at least one visual asset to share.');
      return;
    }
    if (activeTab === 'proxy' && !proxyUrl.trim()) {
      toast.warning('Please enter a target URL for the masked proxy relay.');
      return;
    }

    if (!user && hours > 24) {
      toast.warning('Unregistered sessions are restricted to a 24-hour retention cap. Log in for 7 days.', 'Limited Time Policy');
      setHours(24);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', activeTab);
      formData.append('title', title || (activeTab === 'proxy' ? 'Masked Web Session' : 'Protected Asset Collection'));
      formData.append('hours', hours.toString());
      formData.append('singleUse', singleUse.toString());
      formData.append('watermarkEnabled', watermarkEnabled.toString());
      formData.append('watermarkText', watermarkText);

      if (activeTab === 'proxy') {
        formData.append('proxyTargetUrl', proxyUrl.trim());
      } else {
        stagedFiles.forEach(sf => {
          formData.append('files', sf.file);
        });
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Creation failed');
      }

      const linkData = {
        galleryId: data.gallery.id,
        shortUrl: `${window.location.origin}${data.shareLink.short_url}`,
        seedUrl: `${window.location.origin}${data.shareLink.seed_url}`,
        expiresAt: data.shareLink.expires_at,
        shortCode: data.shareLink.short_code,
        isRevoked: false,
      };

      setCreatedLinks(linkData);
      toast.success('Secure link generated and stored in database.', 'Vault Ready');

      // Refresh history list if unlocked
      fetchHistory();

      // Reset staged input
      setStagedFiles([]);
      setProxyUrl('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to seal vault', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revoke link (invalidates link immediately without deleting history record)
  const handleRevoke = (galleryId: string) => {
    confirmModal({
      title: 'Revoke Secure Link',
      message: 'Are you sure you want to revoke this link? Anyone with the URL will immediately receive an Access Revoked error, but its record will remain archived in your History Vault.',
      confirmText: 'Revoke Now',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/gallery', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ galleryId, action: 'revoke' }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error || 'Failed to revoke link', 'Error');
          } else {
            if (createdLinks && createdLinks.galleryId === galleryId) {
              setCreatedLinks(prev => prev ? { ...prev, isRevoked: true } : null);
            }
            fetchHistory();
            toast.info('Access token revoked. Link is now disabled.', 'Link Revoked');
          }
        } catch (err: any) {
          toast.error(err.message || 'Network error during revocation', 'Error');
        }
      },
    });
  };

  // Permanent Delete (wiping all database records with zero trace)
  const handleDelete = (galleryId: string) => {
    confirmModal({
      title: 'Permanently Erase Vault',
      message: 'This will completely erase all files, tokens, and history of this vault from the database forever. This action is irreversible.',
      confirmText: 'Permanently Erase',
      cancelText: 'Keep Vault',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/gallery', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ galleryId, action: 'delete' }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error || 'Failed to delete in database', 'Server Error');
          } else {
            if (createdLinks && createdLinks.galleryId === galleryId) {
              setCreatedLinks(null);
            }
            fetchHistory();
            toast.info('Vault and all history permanently erased.', 'Deleted');
          }
        } catch (err: any) {
          toast.error(err.message || 'Network error during deletion', 'Revocation Failed');
        }
      },
    });
  };

  // Reinstate / Restore expired or revoked link
  const handleRestore = (galleryId: string) => {
    confirmModal({
      title: 'Reactivate Secure Link',
      message: 'Restore this vault and reactivate its access link? This will renew the expiration clock for an additional 24 hours and reset single-use counters.',
      confirmText: 'Reactivate Link',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/gallery', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ galleryId, extensionHours: 24 }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error || 'Failed to restore link', 'Error');
          } else {
            if (createdLinks && createdLinks.galleryId === galleryId) {
              setCreatedLinks(prev => prev ? {
                ...prev,
                isRevoked: false,
                expiresAt: data.shareLink.expires_at,
              } : null);
            }
            fetchHistory();
            toast.success('Link successfully reactivated for 24 hours.', 'Vault Restored');
          }
        } catch (err: any) {
          toast.error(err.message || 'Network error during restoration', 'Error');
        }
      },
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Share link copied to clipboard.', 'Copied');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <header className="app-header">
        <div className="brand-badge">
          <div className="brand-icon-box">
            <Shield size={20} />
          </div>
          <div>
            <div className="brand-name">One<span>View</span> Studio</div>
            <div className="brand-tagline">Privacy-Preserving Asset Distribution & Web Relay</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            className="vault-trigger-btn"
            onClick={() => setShowCommandPalette(true)}
            title="Open Command Palette (Cmd + K)"
          >
            <CommandIcon size={14} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>⌘K</span>
          </button>

          <button
            type="button"
            className={`vault-trigger-btn ${user ? 'unlocked' : ''}`}
            onClick={handleOpenHistory}
          >
            <FolderLock size={15} />
            {user ? `History Vault (${user.email.split('@')[0]})` : 'History Vault'}
          </button>
        </div>
      </header>

      {/* Main Studio Two-Column Grid */}
      <div className="studio-grid">
        {/* Left Column: Asset Selection & Payload */}
        <section className="studio-card">
          <div className="mode-pill-bar">
            <button
              type="button"
              className={`mode-pill-tab ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => setActiveTab('media')}
            >
              <FileCheck size={16} /> Visual Assets
            </button>
            <button
              type="button"
              className={`mode-pill-tab ${activeTab === 'proxy' ? 'active' : ''}`}
              onClick={() => setActiveTab('proxy')}
            >
              <Globe size={16} /> Masked Web Tunnel
            </button>
          </div>

          {activeTab === 'media' && (
            <div>
              <div
                className={`upload-canvas ${isDragging ? 'active-drag' : ''}`}
                onDrop={handleDrop}
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={e => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  multiple
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files) {
                      const files = Array.from(e.target.files).map(file => ({
                        file,
                        previewUrl: URL.createObjectURL(file),
                      }));
                      setStagedFiles(prev => [...prev, ...files]);
                    }
                  }}
                />
                <div className="upload-icon-avatar">
                  <Upload size={20} />
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
                  Click to browse or drop media files
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Supports drag snatching from other tabs and Ctrl+V / Cmd+V paste
                </div>
              </div>

              {/* Horizontal Kinetic Viewport Preview */}
              {stagedFiles.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Staged items ({stagedFiles.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setStagedFiles([])}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Remove All
                    </button>
                  </div>
                  <div className="preview-carousel">
                    {stagedFiles.map((sf, index) => (
                      <div key={index} className="preview-thumbnail-card">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={sf.previewUrl} alt={sf.file.name} />
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setStagedFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: 'rgba(0,0,0,0.7)',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '4px',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'proxy' && (
            <div>
              <div className="form-group">
                <label className="form-label">Destination Web URL</label>
                <input
                  type="url"
                  className="text-input"
                  placeholder="https://private-dashboard.company.internal"
                  value={proxyUrl}
                  onChange={e => setProxyUrl(e.target.value)}
                  required
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Shielded proxy tunnel: Target hostname is fully hidden from client inspection and proxied through isolated stream rewriting.
              </p>
            </div>
          )}
        </section>

        {/* Right Column: Security Policy & LifeCycle Config */}
        <section className="studio-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Share Title / Reference</label>
              <input
                type="text"
                className="text-input"
                placeholder="e.g., Q4 Design Specs"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Expiration Lifespan</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {hours === 168 ? '7 Days' : `${hours} Hours`}
                </span>
              </div>
              <div className="duration-grid">
                {[
                  { val: 1, label: '1h' },
                  { val: 6, label: '6h' },
                  { val: 12, label: '12h' },
                  { val: 24, label: '24h' },
                  { val: 168, label: '7d', needsLogin: true },
                ].map(opt => {
                  const isGated = !user && opt.needsLogin;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        if (isGated) {
                          setShowAuthModal(true);
                          toast.warning('7-day retention requires Vault authentication.', 'Session Limit');
                          return;
                        }
                        setHours(opt.val);
                      }}
                      className={`duration-chip ${hours === opt.val ? 'selected' : ''} ${isGated ? 'gated' : ''}`}
                      title={isGated ? 'Requires login' : ''}
                    >
                      {opt.label} {isGated ? '🔒' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shield Policies */}
            <div style={{ margin: '1.5rem 0' }}>
              <div className="setting-toggle-row">
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                    Single-Use Burn Link
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Self-destructs immediately after first access
                  </div>
                </div>
                <button
                  type="button"
                  className={`switch-control ${singleUse ? 'checked' : ''}`}
                  onClick={() => setSingleUse(!singleUse)}
                >
                  <div className="switch-knob" />
                </button>
              </div>

              <div className="setting-toggle-row">
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                    Dynamic Watermark Grid
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Renders dynamic session-bound overlay
                  </div>
                </div>
                <button
                  type="button"
                  className={`switch-control ${watermarkEnabled ? 'checked' : ''}`}
                  onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                >
                  <div className="switch-knob" />
                </button>
              </div>
            </div>

            {watermarkEnabled && (
              <div className="form-group">
                <label className="form-label">Watermark Stamp</label>
                <input
                  type="text"
                  className="text-input"
                  value={watermarkText}
                  onChange={e => setWatermarkText(e.target.value)}
                />
              </div>
            )}

            <button type="submit" className="action-submit-button" disabled={isSubmitting}>
              <Zap size={16} />
              {isSubmitting ? 'Sealing Vault in Database...' : 'Generate Protected Link'}
            </button>
          </form>
        </section>
      </div>

      {/* Generated Token Result Card */}
      {createdLinks && (
        <div
          className="studio-card"
          style={{
            marginTop: '2rem',
            border: createdLinks.isRevoked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)',
            background: 'rgba(15, 22, 36, 0.95)',
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
                  className="vault-trigger-btn"
                  onClick={() => handleRestore(createdLinks.galleryId)}
                  style={{
                    color: '#34d399',
                    borderColor: 'rgba(52, 211, 153, 0.3)',
                    background: 'rgba(52, 211, 153, 0.08)',
                    fontSize: '0.78rem',
                  }}
                  title="Reactivate link for another 24 hours"
                >
                  <RotateCcw size={14} /> Reactivate
                </button>
              ) : (
                <button
                  type="button"
                  className="vault-trigger-btn"
                  onClick={() => handleRevoke(createdLinks.galleryId)}
                  style={{
                    color: '#f87171',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    fontSize: '0.78rem',
                  }}
                  title="Immediately disable this link"
                >
                  <Ban size={14} /> Revoke Link
                </button>
              )}
              <button
                type="button"
                className="vault-trigger-btn"
                onClick={() => handleDelete(createdLinks.galleryId)}
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
                onClick={() => setQrModalData({ isOpen: true, url: createdLinks.shortUrl, title: title || 'Confidential Share' })}
                title="Display QR Code"
              >
                <QrCode size={16} />
              </button>
              <button
                type="button"
                className="vault-trigger-btn"
                onClick={() => copyToClipboard(createdLinks.shortUrl, 'short')}
              >
                {copiedKey === 'short' ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <a href={createdLinks.shortUrl} target="_blank" rel="noreferrer" className="vault-trigger-btn">
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Security Feature Badges Bottom Row */}
      <div className="feature-badge-row">
        <div className="feature-pill-badge">
          <Lock size={13} />
          <span>One-time access</span>
        </div>
        <div className="feature-pill-badge">
          <Droplet size={13} />
          <span>Watermarked</span>
        </div>
        <div className="feature-pill-badge">
          <Clock size={13} />
          <span>Auto-expires</span>
        </div>
        <div className="feature-pill-badge">
          <Link2Off size={13} />
          <span>No direct URLs</span>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={authenticatedUser => {
          setUser(authenticatedUser);
          setShowHistoryModal(true);
          fetchHistory();
        }}
      />

      {/* History Vault Drawer / Modal */}
      {showHistoryModal && (
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
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0f1624',
              border: '1px solid #1e2b42',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #1e2b42',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FolderLock size={18} style={{ color: '#60a5fa' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                  History Vault
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <LogOut size={14} /> Log out
                </button>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Querying database records...
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No active share links stored in database.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {historyList.map(item => {
                    const isExpired = new Date() > new Date(item.expires_at);
                    const isRevoked = Boolean(item.revoked);

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '10px',
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-bright)' }}>
                              {item.title}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                background: item.type === 'proxy' ? 'rgba(121, 40, 202, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                                color: item.type === 'proxy' ? '#c084fc' : '#93c5fd',
                                fontWeight: 600,
                              }}
                            >
                              {item.type.toUpperCase()}
                            </span>
                            {isRevoked ? (
                              <span style={{ fontSize: '0.7rem', color: 'var(--accent-danger)', fontWeight: 600 }}>
                                REVOKED
                              </span>
                            ) : isExpired ? (
                              <span style={{ fontSize: '0.7rem', color: 'var(--accent-danger)', fontWeight: 600 }}>
                                EXPIRED
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            ID: <code style={{ color: 'var(--text-body)' }}>{item.short_code}</code> • Expiration: {new Date(item.expires_at).toLocaleString()}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* QR Code Icon: Only visible if active and NOT expired or revoked */}
                          {!isExpired && !isRevoked && (
                            <button
                              type="button"
                              className="vault-trigger-btn"
                              style={{ padding: '0.4rem 0.6rem' }}
                              onClick={() => setQrModalData({
                                isOpen: true,
                                url: `${window.location.origin}/v/${item.short_code}`,
                                title: item.title,
                              })}
                              title="QR Code"
                            >
                              <QrCode size={14} />
                            </button>
                          )}

                          {!isRevoked && !isExpired && (
                            <a
                              href={`/v/${item.short_code}`}
                              target="_blank"
                              rel="noreferrer"
                              className="vault-trigger-btn"
                              style={{ padding: '0.4rem 0.8rem', textDecoration: 'none' }}
                            >
                              Open
                            </a>
                          )}

                          {/* Reinstate / Reactivate Option: Visible if Expired or Revoked */}
                          {(isExpired || isRevoked) && (
                            <button
                              type="button"
                              onClick={() => handleRestore(item.id)}
                              className="vault-trigger-btn"
                              style={{
                                color: '#34d399',
                                borderColor: 'rgba(52, 211, 153, 0.3)',
                                background: 'rgba(52, 211, 153, 0.08)',
                                padding: '0.4rem 0.75rem',
                                fontSize: '0.78rem',
                              }}
                              title="Restore and reactivate this link for 24 hours"
                            >
                              <RotateCcw size={14} /> Reactivate
                            </button>
                          )}

                          {/* Revoke Option: Only if not already expired and not already revoked */}
                          {!isExpired && !isRevoked && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(item.id)}
                              className="vault-trigger-btn"
                              style={{
                                color: '#f87171',
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                padding: '0.4rem 0.75rem',
                                fontSize: '0.78rem',
                              }}
                              title="Immediately disable this link (stays in history as revoked)"
                            >
                              <Ban size={14} /> Revoke
                            </button>
                          )}

                          {/* Delete Option: Permanently erase with no history */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              padding: '0.45rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
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
      )}
      {/* QR Code Sharing Modal */}
      <QrModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData({ isOpen: false, url: '', title: '' })}
        url={qrModalData.url}
        title={qrModalData.title}
      />

      {/* Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        galleries={historyList}
        onSelectGallery={g => {
          window.open(`/v/${g.short_code}`, '_blank');
        }}
        onDeleteGallery={handleDelete}
        onShowQr={(url, title) => {
          setQrModalData({ isOpen: true, url, title });
        }}
        onCreateNew={mode => {
          setActiveTab(mode);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenHistory={handleOpenHistory}
      />
    </div>
  );
}
