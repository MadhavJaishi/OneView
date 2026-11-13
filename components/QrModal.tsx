'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const QrModal: React.FC<QrModalProps> = ({ isOpen, onClose, url, title }) => {
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !url) return;

    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: {
        dark: '#f8fafc',
        light: '#090d16',
      },
    })
      .then(setQrDataUrl)
      .catch(err => {
        console.error('QR code generation failed:', err);
      });
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard.', 'Copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `oneview-qr-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('QR code downloaded.', 'Saved');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 9, 16, 0.82)',
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
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f1624',
          border: '1px solid #1e2b42',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '380px',
          padding: '2rem',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          textAlign: 'center',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <QrCode size={18} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-bright)' }}>
            Instant QR Share
          </h2>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
          Scan on mobile or display for confidential in-person presentation access.
        </p>

        {/* QR Image Box */}
        <div
          style={{
            background: '#090d16',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid #1e2b42',
            display: 'inline-block',
            marginBottom: '1.25rem',
          }}
        >
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="OneView Access QR Code"
              style={{ width: '220px', height: '220px', display: 'block', borderRadius: '6px' }}
            />
          ) : (
            <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Rendering QR code...
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
          {title || 'Confidential Share'}
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '1.25rem',
          }}
        >
          {url}
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            type="button"
            className="vault-trigger-btn"
            onClick={handleCopyLink}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <button
            type="button"
            className="action-submit-button"
            onClick={handleDownload}
            style={{ flex: 1, margin: 0, justifyContent: 'center' }}
          >
            <Download size={15} /> Save QR
          </button>
        </div>
      </div>
    </div>
  );
};
