'use client';

import React, { useState, useEffect } from 'react';
import { GalleryEntryItem } from '@/lib/triple-state';
import { useToast } from '@/components/ToastProvider';
import { AuthModal } from '@/components/AuthModal';
import { QrModal } from '@/components/QrModal';
import { StudioHeader, AppTheme } from '@/components/StudioHeader';
import { AssetPayloadSection, StagedFile } from '@/components/AssetPayloadSection';
import { SecurityPolicySection } from '@/components/SecurityPolicySection';
import { GeneratedLinkModal, GeneratedLinkModalData } from '@/components/GeneratedLinkModal';
import { SecurityBadgesFooter } from '@/components/SecurityBadgesFooter';
import { HistoryVaultModal } from '@/components/HistoryVaultModal';
import { GearsLoader } from '@/components/GearsLoader';

export default function Dashboard() {
  const { toast, confirmModal } = useToast();

  // Startup theme initialization loader (runs once per website session)
  const [isReady, setIsReady] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<AppTheme>('blue');

  // Mode and form states
  const [activeTab, setActiveTab] = useState<'media' | 'proxy'>('media');
  const [title, setTitle] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [hours, setHours] = useState(24);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkText, setWatermarkText] = useState('RESTRICTED VIEW');
  const [singleUse, setSingleUse] = useState(true);

  // Result and progress states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLinks, setCreatedLinks] = useState<GeneratedLinkModalData | null>(null);
  const [showGeneratedModal, setShowGeneratedModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Auth & History states
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState<GalleryEntryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Utility modals
  const [qrModalData, setQrModalData] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: '',
  });

  // Apply theme to document and persist across visits
  useEffect(() => {
    // Check if initial loader has already run during this session
    const savedTheme = localStorage.getItem('oneview_theme') as AppTheme;
    const initialTheme = savedTheme || 'blue';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    const timer = setTimeout(() => {
      setIsReady(true);
      sessionStorage.setItem('oneview_initialized', 'true');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('oneview_theme', newTheme);
  };

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
    // Auto preload history list if authenticated
    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.galleries) {
          setHistoryList(
            data.galleries.map((g: any) => ({
              id: g.id,
              title: g.title,
              type: g.type,
              short_code: g.share_link?.short_code || '',
              secure_seed: g.share_link?.secure_seed || '',
              expires_at: g.share_link?.expires_at || '',
              single_use: g.share_link?.single_use || false,
              images_count: g.images?.length || 0,
              created_at: g.created_at,
              revoked: Boolean(g.share_link?.revoked),
              view_count: g.share_link?.view_count || 0,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Inter-domain paste listener
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (activeTab !== 'media') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const newFiles: StagedFile[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            newFiles.push({
              file: blob,
              previewUrl: URL.createObjectURL(blob),
            });
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

  // Load History Vault from database (with Stale-While-Revalidate caching)
  const fetchHistory = async () => {
    setLoadingHistory(true);
    const start = Date.now();
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
          revoked: Boolean(g.share_link?.revoked),
          view_count: g.share_link?.view_count || 0,
        }));
        setHistoryList(mapped);
      }
    } catch {
      toast.error('Failed to load history vault from database', 'Error');
    } finally {
      // Ensure the blinking syncing state remains smoothly visible for at least 500ms
      const elapsed = Date.now() - start;
      if (elapsed < 500) {
        setTimeout(() => setLoadingHistory(false), 2000 - elapsed);
      } else {
        setLoadingHistory(false);
      }
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

  // Drag & drop handlers
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

  // Form Submission
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

      const linkData: GeneratedLinkModalData = {
        galleryId: data.gallery.id,
        shortUrl: `${window.location.origin}${data.shareLink.short_url}`,
        seedUrl: `${window.location.origin}${data.shareLink.seed_url}`,
        expiresAt: data.shareLink.expires_at,
        shortCode: data.shareLink.short_code,
        isRevoked: false,
        title: title || (activeTab === 'proxy' ? 'Masked Web Session' : 'Protected Asset Collection'),
        type: activeTab,
        hours,
        singleUse,
        watermarkEnabled,
        watermarkText,
        assetCount: activeTab === 'media' ? stagedFiles.length : undefined,
      };

      setCreatedLinks(linkData);
      setShowGeneratedModal(true);
      toast.success('Secure link generated and stored in database.', 'Vault Ready');

      fetchHistory();
      setStagedFiles([]);
      setProxyUrl('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to seal vault', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revoke link
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
              setCreatedLinks(prev => (prev ? { ...prev, isRevoked: true } : null));
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

  // Permanent Delete
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

  // Restore/Reactivate Link
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
              setCreatedLinks(prev =>
                prev
                  ? {
                      ...prev,
                      isRevoked: false,
                      expiresAt: data.shareLink.expires_at,
                    }
                  : null
              );
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

  if (!isReady) {
    return <GearsLoader />;
  }

  return (
    <div className='app-shell'>
      {/* Studio Header & Navigation */}
      <StudioHeader
        user={user}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        onOpenHistory={handleOpenHistory}
      />

      {/* Main Studio Two-Column Grid */}
      <div className='studio-grid'>
        {/* Left Column: Visual Assets or Masked Web Tunnel */}
        <AssetPayloadSection
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stagedFiles={stagedFiles}
          setStagedFiles={setStagedFiles}
          proxyUrl={proxyUrl}
          setProxyUrl={setProxyUrl}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          onDrop={handleDrop}
        />

        {/* Right Column: Security Policy & Lifespan Options */}
        <SecurityPolicySection
          title={title}
          setTitle={setTitle}
          hours={hours}
          setHours={setHours}
          singleUse={singleUse}
          setSingleUse={setSingleUse}
          watermarkEnabled={watermarkEnabled}
          setWatermarkEnabled={setWatermarkEnabled}
          watermarkText={watermarkText}
          setWatermarkText={setWatermarkText}
          isSubmitting={isSubmitting}
          user={user}
          onRequireAuth={() => {
            setShowAuthModal(true);
            toast.warning(
              "7-day retention requires Vault authentication.",
              "Session Limit",
            );
          }}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Security Feature Badges */}
      <SecurityBadgesFooter />

      {/* Vault Sealed & Generated Link Modal */}
      <GeneratedLinkModal
        isOpen={showGeneratedModal}
        onClose={() => setShowGeneratedModal(false)}
        linkData={createdLinks}
        onRevoke={(galleryId) => {
          handleRevoke(galleryId);
          setShowGeneratedModal(false);
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          setShowHistoryModal(true);
          fetchHistory();
        }}
      />

      {/* History Vault Drawer / Modal */}
      <HistoryVaultModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          fetchHistory();
        }}
        user={user}
        onLogout={handleLogout}
        loading={loadingHistory}
        historyList={historyList}
        onOpenQr={(url, itemTitle) => {
          setQrModalData({ isOpen: true, url, title: itemTitle });
          fetchHistory();
        }}
        onOpenLink={(url) => {
          window.open(url, "_blank", "noreferrer");
          // Since opening a single-use link consumes it on the server, re-sync immediately
          setTimeout(() => {
            fetchHistory();
          }, 800);
        }}
        onRestore={(galleryId) => {
          handleRestore(galleryId);
        }}
        onRevoke={(galleryId) => {
          handleRevoke(galleryId);
        }}
        onDelete={(galleryId) => {
          handleDelete(galleryId);
        }}
      />

      {/* Instant QR Share Modal */}
      <QrModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData({ isOpen: false, url: "", title: "" })}
        url={qrModalData.url}
        title={qrModalData.title}
      />
    </div>
  );
}
