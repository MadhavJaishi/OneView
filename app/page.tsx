'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  Globe,
  Lock,
  Clock,
  Shield,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sliders,
  FileImage,
} from 'lucide-react';
import { TripleStateEngine, CachedGalleryEntry } from '@/lib/triple-state';

interface StagedFile {
  file: File;
  previewUrl: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'media' | 'proxy'>('media');
  const [title, setTitle] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [hours, setHours] = useState(24);
  const [singleUse, setSingleUse] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLinks, setCreatedLinks] = useState<{
    shortUrl: string;
    seedUrl: string;
    expiresAt: string;
    shortCode: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [cachedList, setCachedList] = useState<CachedGalleryEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load cached galleries and sync with server
  const refreshGalleries = async () => {
    // 1. First get local index cache filtered through suppression ledger
    const local = TripleStateEngine.getCachedGalleries();
    setCachedList(local);

    // 2. Fetch server-side ownership tracking cookie list
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      if (data.success && data.galleries) {
        // Map server response to CachedGalleryEntry
        const mapped: CachedGalleryEntry[] = data.galleries.map((g: any) => ({
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
        TripleStateEngine.setCachedGalleries(mapped);
        setCachedList(TripleStateEngine.getCachedGalleries());
      }
    } catch (err) {
      console.warn('Could not sync with server gallery api', err);
    }
  };

  useEffect(() => {
    refreshGalleries();
  }, []);

  // System Buffer Clipboard Injection (Ctrl+V / Cmd+V)
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
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab]);

  // Smart Drag & Drop Aggregation + Inter-Domain Drag Snatching
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (activeTab !== 'media') return;

    // Direct files dropped
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      const staged = droppedFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setStagedFiles(prev => [...prev, ...staged]);
      return;
    }

    // Inter-domain drag snatching: handle dragged images from other tabs/webpages
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
          // If cross-origin prevented direct fetch
          console.warn('Inter-domain snatch fetch blocked by CORS for URL', candidateUrl);
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Form Submission & Token Generation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'media' && stagedFiles.length === 0) {
      alert('Please add at least one image to share');
      return;
    }
    if (activeTab === 'proxy' && !proxyUrl.trim()) {
      alert('Please enter a target URL for the proxy tunnel');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', activeTab);
      formData.append('title', title || (activeTab === 'proxy' ? 'Live Web Proxy' : 'Confidential Gallery'));
      formData.append('hours', hours.toString());
      formData.append('singleUse', singleUse.toString());

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
        throw new Error(data.error || 'Upload failed');
      }

      const linkData = {
        shortUrl: `${window.location.origin}${data.shareLink.short_url}`,
        seedUrl: `${window.location.origin}${data.shareLink.seed_url}`,
        expiresAt: data.shareLink.expires_at,
        shortCode: data.shareLink.short_code,
      };

      setCreatedLinks(linkData);

      // Append to Triple-State Local Cache
      TripleStateEngine.appendCache({
        id: data.gallery.id,
        title: data.gallery.title,
        type: data.gallery.type,
        short_code: data.shareLink.short_code,
        secure_seed: data.shareLink.secure_seed,
        expires_at: data.shareLink.expires_at,
        single_use: data.shareLink.single_use,
        images_count: data.gallery.images_count,
        created_at: data.gallery.created_at,
      });

      setCachedList(TripleStateEngine.getCachedGalleries());

      // Reset staged input
      setStagedFiles([]);
      setTitle('');
      setProxyUrl('');
    } catch (err: any) {
      alert(`Error creating share link: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Secure Revoke & Deletion
  const handleDelete = async (galleryId: string) => {
    if (!confirm('Permanently revoke and delete this vault? This cannot be undone.')) return;

    // 1. Immediately apply to client suppression ledger (Inertial Suppression)
    TripleStateEngine.suppressId(galleryId);
    setCachedList(TripleStateEngine.getCachedGalleries());

    // 2. Transmit physical cascade deletion to server
    try {
      const res = await fetch('/api/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ galleryId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Delete error on server:', data.error);
      }
    } catch (err) {
      console.error('Failed to notify server of deletion:', err);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
            }}
          >
            <Shield size={22} color="#050811" />
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px' }}>
            One<span style={{ color: 'var(--accent-cyan)' }}>View</span>
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto' }}>
          Next-Generation, Privacy-Preserving Asset Distribution & Stealth Live Web Proxy Architecture.
        </p>
      </header>

      {/* Main Creation Card */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem' }}>
        {/* Mode Selector */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1rem',
            marginBottom: '1.75rem',
          }}
        >
          <button
            onClick={() => setActiveTab('media')}
            style={{
              background: activeTab === 'media' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
              color: activeTab === 'media' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              border: activeTab === 'media' ? '1px solid var(--border-active)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 1.25rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <FileImage size={18} /> Visual Media Collection
          </button>
          <button
            onClick={() => setActiveTab('proxy')}
            style={{
              background: activeTab === 'proxy' ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
              color: activeTab === 'proxy' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              border: activeTab === 'proxy' ? '1px solid var(--border-active)' : '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 1.25rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <Globe size={18} /> Stealth Live Web Proxy
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Vault Title */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Vault Identifier / Title
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={activeTab === 'media' ? 'e.g. Confidential Q4 Wireframes' : 'e.g. Staging Dashboard Proxy'}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Mode Tab 1: Visual Media Ingestion */}
          {activeTab === 'media' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? '2px dashed var(--accent-cyan)' : '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  background: isDragging ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
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
                <UploadCloud size={44} style={{ color: 'var(--accent-cyan)', marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Smart Drag-and-Drop Aggregation
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Drop files directly, snatch images from other tabs, or paste directly with <strong>Ctrl+V / Cmd+V</strong>
                </p>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    color: 'var(--text-dim)',
                  }}
                >
                  Supports massive arrays of PNG, JPEG, WEBP, GIF
                </span>
              </div>

              {/* Staged Horizontal Kinetic Viewport */}
              {stagedFiles.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Staged Assets ({stagedFiles.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setStagedFiles([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-danger)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="kinetic-dock">
                    {stagedFiles.map((sf, index) => (
                      <div key={index} className="dock-item">
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
                            background: 'rgba(0,0,0,0.65)',
                            border: 'none',
                            color: '#ff3344',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
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

          {/* Mode Tab 2: Stealth Live Web Proxy */}
          {activeTab === 'proxy' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Upstream Target Address (Shielded Destination)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="https://internal-metrics.company.local or https://example.com"
                value={proxyUrl}
                onChange={e => setProxyUrl(e.target.value)}
                required
              />
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                🛡️ The raw host address is completely masked. Viewers interact with the live destination through an
                isolated backchannel tunnel.
              </p>
            </div>
          )}

          {/* Security & Lifecycle Controls */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              padding: '1.25rem',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.75rem',
            }}
          >
            {/* Clock Depletion Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={15} style={{ color: 'var(--accent-cyan)' }} />
                  Custom Time Depletion
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {hours} {hours === 1 ? 'Hour' : 'Hours'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="168"
                value={hours}
                onChange={e => setHours(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Range: 1 hour up to 168 hours (7 days)
              </span>
            </div>

            {/* Single-Usage Locking */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={singleUse}
                  onChange={e => setSingleUse(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Lock size={14} style={{ color: 'var(--accent-cyan)' }} />
                    Single-Usage Device Locking
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Binds link to first opened session. Rejects secondary browsers.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}
          >
            {isSubmitting ? (
              'Securing Assets & Minting Cryptographic Tokens...'
            ) : (
              <>
                <Shield size={18} /> Generate Secure Tokenized Vault
              </>
            )}
          </button>
        </form>

        {/* Newly Minted Share Link Modal / Card */}
        {createdLinks && (
          <div
            style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'rgba(0, 240, 255, 0.05)',
              border: '1px solid var(--accent-cyan)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-cyan)' }}>
              <ShieldAlert size={20} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Vault Sealed & Tokenized</h3>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Human-Readable 6-Character Redirection Link
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  readOnly
                  className="input-field"
                  value={createdLinks.shortUrl}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => copyToClipboard(createdLinks.shortUrl, 'short')}
                >
                  {copiedKey === 'short' ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <a
                  href={createdLinks.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                32-Character Cryptographic Direct Seed Link
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  readOnly
                  className="input-field"
                  value={createdLinks.seedUrl}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => copyToClipboard(createdLinks.seedUrl, 'seed')}
                >
                  {copiedKey === 'seed' ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <a
                  href={createdLinks.seedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Triple-State Active Vaults History */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} style={{ color: 'var(--accent-cyan)' }} /> Active Shared Vaults
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Triple-State Persistence Engine Active
          </span>
        </div>

        {cachedList.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No vaults created yet. Mint your first tokenized share above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cachedList.map(item => {
              const isExpired = new Date() > new Date(item.expires_at);
              return (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{item.title}</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: item.type === 'proxy' ? 'rgba(121, 40, 202, 0.2)' : 'rgba(0, 240, 255, 0.1)',
                          color: item.type === 'proxy' ? '#c084fc' : 'var(--accent-cyan)',
                          fontWeight: 600,
                        }}
                      >
                        {item.type.toUpperCase()}
                      </span>
                      {item.single_use && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(255, 0, 122, 0.15)',
                            color: '#ff77aa',
                            fontWeight: 600,
                          }}
                        >
                          1-DEVICE LOCK
                        </span>
                      )}
                      {isExpired && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(255, 51, 68, 0.2)',
                            color: 'var(--accent-danger)',
                            fontWeight: 600,
                          }}
                        >
                          EXPIRED
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Code: <code style={{ color: 'var(--text-main)' }}>{item.short_code}</code></span>
                      <span>Expires: {new Date(item.expires_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <a
                      href={`/v/${item.short_code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', textDecoration: 'none' }}
                    >
                      Open <ExternalLink size={14} />
                    </a>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleDelete(item.id)}
                      title="Permanently Delete & Revoke"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
