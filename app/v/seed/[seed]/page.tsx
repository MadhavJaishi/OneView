'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { AntiLeakShield } from '@/components/AntiLeakShield';
import { HorizontalKineticViewport } from '@/components/HorizontalKineticViewport';
import { StealthProxyViewer } from '@/components/StealthProxyViewer';
import { ShieldCheck, ShieldAlert, Clock, Lock, ArrowLeft } from 'lucide-react';

function SeedViewerContent() {
  const params = useParams();
  const seed = (params?.seed as string) || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryData, setGalleryData] = useState<any>(null);
  const [watermark, setWatermark] = useState<any>(null);
  const hasCalled = useRef(false);

  useEffect(() => {
    if (!seed || hasCalled.current) return;
    hasCalled.current = true;

    const validateToken = async () => {
      try {
        const res = await fetch('/api/validate-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: seed }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'Access to this vault is restricted or expired');
          setLoading(false);
          return;
        }

        setGalleryData(data.gallery);
        setWatermark(data.watermarkData);
      } catch (err: any) {
        setError(err.message || 'Verification failed');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [seed]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
        }}
      >
        <div className="kinetic-glow" style={{ borderRadius: '50%', padding: '1rem', marginBottom: '1.5rem' }}>
          <ShieldCheck size={48} style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Verifying Cryptographic Seed...
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Authenticating 32-character seed hash and device binding.
        </p>
      </div>
    );
  }

  if (error || !galleryData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 51, 68, 0.1)',
            padding: '1.25rem',
            borderRadius: '50%',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 51, 68, 0.3)',
          }}
        >
          <ShieldAlert size={52} style={{ color: 'var(--accent-danger)' }} />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Access Denied / Vault Expired
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '480px', lineHeight: 1.6, marginBottom: '2rem' }}>
          {error || 'The requested cryptographic seed is invalid or has expired.'}
        </p>
        <a
          href="/"
          className="btn-primary"
          style={{ textDecoration: 'none', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
        >
          <ArrowLeft size={16} /> Return to Dashboard
        </a>
      </div>
    );
  }

  return (
    <AntiLeakShield
      sessionId={watermark?.sessionId}
      clientHash={watermark?.clientHash}
      timeTag={watermark?.timeTag}
    >
      <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.5rem',
            background: 'rgba(18, 21, 31, 0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                background: 'rgba(121, 40, 202, 0.2)',
                color: '#c084fc',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                letterSpacing: '1px',
              }}
            >
              SEED VAULT LOCKED
            </span>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{galleryData.title}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} style={{ color: 'var(--accent-cyan)' }} /> 32-Char Direct Seed
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={14} style={{ color: 'var(--accent-cyan)' }} /> Session Shield Active
            </span>
          </div>
        </div>

        {galleryData.isProxy && galleryData.proxyPath ? (
          <StealthProxyViewer proxyPath={galleryData.proxyPath} title={galleryData.title} />
        ) : (
          <div>
            <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Horizontal Kinetic Viewport • {galleryData.images?.length || 0} Assets
            </div>
            <HorizontalKineticViewport images={galleryData.images} />
          </div>
        )}
      </div>
    </AntiLeakShield>
  );
}

export default function SeedProtectedViewer() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }} />}>
      <SeedViewerContent />
    </Suspense>
  );
}
