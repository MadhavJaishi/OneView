'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  X,
  Copy,
  Check,
  ExternalLink,
  Download,
  Flame,
  Clock,
  Ban,
  FileCheck,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export interface GeneratedLinkModalData {
  galleryId: string;
  shortUrl: string;
  seedUrl: string;
  expiresAt: string;
  shortCode: string;
  isRevoked?: boolean;
  title?: string;
  type?: 'media' | 'proxy';
  hours?: number;
  singleUse?: boolean;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  assetCount?: number;
}

interface GeneratedLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkData: GeneratedLinkModalData | null;
  onRevoke?: (galleryId: string) => void;
}

export const GeneratedLinkModal: React.FC<GeneratedLinkModalProps> = ({
  isOpen,
  onClose,
  linkData,
  onRevoke,
}) => {
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !linkData?.shortUrl) return;

    QRCode.toDataURL(linkData.shortUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(setQrDataUrl)
      .catch(err => {
        console.error('QR code generation failed:', err);
      });
  }, [isOpen, linkData?.shortUrl]);

  if (!isOpen || !linkData) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(linkData.shortUrl);
    setCopied(true);
    toast.success('Secure link copied to clipboard.', 'Copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `oneview-qr-${linkData.shortCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('QR code downloaded.', 'Saved');
  };

  const expirationDate = new Date(linkData.expiresAt);
  const formattedExpiration = expirationDate.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 9, 16, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        className="studio-card generated-link-modal-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-xs)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-bright)' }}>
                Vault Sealed Successfully
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                End-to-end tokenized link ready for immediate distribution
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-xs)',
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main 2-column showcase: QR code + Quick Actions & Details */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '170px 1fr',
              gap: '1.5rem',
              alignItems: 'center',
            }}
            className="generated-modal-grid"
          >
            {/* QR Code Presentation Box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  padding: '8px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '160px',
                  height: '160px',
                }}
              >
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Vault QR Code"
                    style={{ width: '100%', height: '100%', display: 'block', borderRadius: '4px' }}
                  />
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Generating QR...</div>
                )}
              </div>

              <button
                type="button"
                onClick={handleDownloadQr}
                className="vault-trigger-btn"
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  gap: '0.4rem',
                  width: '160px',
                  justifyContent: 'center',
                }}
              >
                <Download size={13} /> Download QR
              </button>
            </div>

            {/* Link & Policies Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '0.35rem' }}>
                  Secure Access Link
                </label>
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  <input
                    type="text"
                    readOnly
                    value={linkData.shortUrl}
                    className="text-input"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.84rem',
                      padding: '0.6rem 0.8rem',
                      userSelect: 'all',
                    }}
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    className="vault-trigger-btn"
                    onClick={handleCopyLink}
                    style={{ padding: '0.6rem 0.85rem' }}
                    title="Copy Link"
                  >
                    {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  </button>
                  <a
                    href={linkData.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="vault-trigger-btn"
                    style={{ padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center' }}
                    title="Open in new window"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* Policy Pills Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.65rem',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                    Title / Reference
                  </span>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-bright)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                    }}
                  >
                    {linkData.title || 'Protected Asset Collection'}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                    Payload Type
                  </span>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-bright)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    {linkData.type === 'proxy' ? (
                      <>
                        <Globe size={13} color="var(--accent-primary)" /> Masked Proxy
                      </>
                    ) : (
                      <>
                        <FileCheck size={13} color="var(--accent-primary)" /> Visual Assets
                        {linkData.assetCount ? ` (${linkData.assetCount})` : ''}
                      </>
                    )}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                    Expiration Policy
                  </span>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-bright)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Clock size={13} color="#f59e0b" />
                    {formattedExpiration}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                    Burn Policy
                  </span>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: linkData.singleUse ? '#ef4444' : '#10b981',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Flame size={13} />
                    {linkData.singleUse ? 'Self-destruct on view' : 'Multi-use access'}
                  </span>
                </div>
              </div>

              {/* Watermark Notice if enabled */}
              {linkData.watermarkEnabled && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                  }}
                >
                  <Sparkles size={13} color="var(--accent-primary)" />
                  <span>
                    Watermark stamped with:{' '}
                    <code
                      style={{
                        color: 'var(--accent-primary)',
                        background: 'rgba(59, 130, 246, 0.1)',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                      }}
                    >
                      {linkData.watermarkText || 'RESTRICTED VIEW'}
                    </code>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {onRevoke && !linkData.isRevoked ? (
            <button
              type="button"
              className="vault-action-btn vault-revoke-btn"
              onClick={() => onRevoke(linkData.galleryId)}
            >
              <Ban size={14} /> Revoke Link
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            className="action-submit-button"
            style={{ width: 'auto', padding: '0.55rem 1.5rem' }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
