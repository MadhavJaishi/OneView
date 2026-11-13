'use client';

import React, { useState } from 'react';
import { Globe, Lock, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';

interface StealthProxyViewerProps {
  proxyPath: string;
  title: string;
}

export const StealthProxyViewer: React.FC<StealthProxyViewerProps> = ({ proxyPath, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [key, setKey] = useState(0);

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
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(0, 240, 255, 0.1)',
              color: 'var(--accent-cyan)',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} /> STEALTH TUNNEL ACTIVE
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {title}
          </span>
        </div>

        {/* Dummy encrypted URI display - NEVER exposes the raw target host */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.3rem 0.8rem',
            fontSize: '0.8rem',
            color: 'var(--text-dim)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <Lock size={12} style={{ color: 'var(--accent-cyan)' }} />
          <span>https://oneview.internal/tunnel/enc_0x{Buffer.from(title || 'vault').toString('hex').slice(0, 8)}...</span>
        </div>

        <button
          onClick={handleReload}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '0.25rem',
          }}
          title="Reload Forwarding Stream"
        >
          <RefreshCw size={16} />
        </button>
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
              background: 'var(--bg-primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              color: 'var(--text-muted)',
            }}
          >
            <Globe size={36} className="kinetic-glow" style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.9rem' }}>Establishing isolated upstream stealth proxy relay...</p>
          </div>
        )}

        {loadError ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--bg-primary)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <AlertTriangle size={42} style={{ color: 'var(--accent-danger)', marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Relay Connection Blocked</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.85rem' }}>
              The upstream server failed to respond or rejected the backchannel connection.
            </p>
          </div>
        ) : (
          <iframe
            key={key}
            src={proxyPath}
            title={title}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#fff',
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
