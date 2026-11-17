'use client';

import React, { useState } from 'react';
import { Globe, Lock, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';

interface StealthProxyViewerProps {
  targetUrl?: string;
  proxyPath?: string;
  title: string;
}

export const StealthProxyViewer: React.FC<StealthProxyViewerProps> = ({ targetUrl, proxyPath, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [key, setKey] = useState(0);

  // Directly load the target website in an iframe
  const activeUrl = targetUrl || proxyPath || '';

  const handleReload = () => {
    setIsLoading(true);
    setLoadError(false);
    setKey(k => k + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', width: '100%' }}>
      {/* Stealth Address & Security Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-active)',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.4px',
            }}
          >
            <ShieldCheck size={14} /> MASKED TUNNEL ACTIVE
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            {title}
          </span>
        </div>

        {/* Masked Address Display: Completely hides the real upstream URL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xs)',
            padding: '0.35rem 0.85rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            maxWidth: '440px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title="Protected Tunnel: Target host is fully masked and identity-shielded"
        >
          <Lock size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            https://relay.oneview.internal/tunnel/masked-session-shielded
          </span>
        </div>

        {/* Action Controls: Refresh only, no raw URL leaks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleReload}
            className="vault-trigger-btn"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            title="Reload Forwarding Stream"
          >
            <RefreshCw size={14} /> Reload
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: '#ffffff',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          borderTop: 'none',
        }}
      >
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--bg-app)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              color: 'var(--text-muted)',
            }}
          >
            <Globe
              size={36}
              style={{
                color: 'var(--accent-primary)',
                marginBottom: '1rem',
                animation: 'spin 2s linear infinite',
              }}
            />
            <p style={{ fontSize: '0.9rem', color: 'var(--text-bright)' }}>
              Loading website in secure tunnel...
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Host: Masked Private Relay
            </p>
          </div>
        )}

        {loadError ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--bg-app)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <AlertTriangle size={42} style={{ color: 'var(--accent-danger)', marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-bright)' }}>
              Relay Stream Blocked
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '440px', fontSize: '0.85rem' }}>
              The target website rejected being embedded in a frame (X-Frame-Options or frame-ancestors policy). Please verify the target website permits iframe embedding.
            </p>
          </div>
        ) : (
          <iframe
            key={key}
            src={activeUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#fff',
              display: 'block',
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          />
        )}
      </div>
    </div>
  );
};
