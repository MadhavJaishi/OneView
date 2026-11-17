'use client';

import React, { useRef, useState } from 'react';
import { ZoomIn, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { SecureCanvasImage } from '@/components/SecureCanvasImage';

export interface KineticImage {
  id: string;
  url: string;
  filename?: string;
  size_bytes?: number;
}

interface HorizontalKineticViewportProps {
  images: KineticImage[];
  watermarkText?: string;
  sessionId?: string;
}

export const HorizontalKineticViewport: React.FC<HorizontalKineticViewportProps> = ({
  images,
  watermarkText = 'RESTRICTED VIEW',
  sessionId = 'SEC-VIEW',
}) => {
  const dockRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<KineticImage | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    if (dockRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      dockRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!images || images.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        No media assets available in this vault.
      </div>
    );
  }

  const primaryImage = images[activeImageIndex] || images[0];

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* 1. Main Dedicated Fixed-Dimension Image Showcase Stage via Secure Canvas */}
      <div className="viewer-showcase-container">
        <div
          className="viewer-image-stage"
          onClick={() => setSelectedImage(primaryImage)}
          style={{ cursor: 'zoom-in', position: 'relative' }}
          title="Click to view full lightbox"
        >
          {/* Secure HTML5 Canvas Render */}
          <SecureCanvasImage
            src={primaryImage.url}
            alt={primaryImage.filename || 'Vault Asset'}
            watermarkText={watermarkText}
            sessionId={sessionId}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />

          {/* Bottom subtle bar on image stage */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '0.75rem 1.25rem',
              background: 'linear-gradient(to top, rgba(5, 8, 14, 0.85) 0%, transparent 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 25,
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 500 }}>
              {primaryImage.filename || `Asset ${activeImageIndex + 1}`}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(59, 130, 246, 0.15)',
                padding: '0.25rem 0.55rem',
                borderRadius: '4px',
              }}
            >
              <Maximize2 size={13} /> Expand Full Screen
            </span>
          </div>
        </div>
      </div>

      {/* 2. Kinetic Thumbnail Dock (When more than 1 image is in the vault) */}
      {images.length > 1 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Vault Assets ({images.length})
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => scroll('left')}
                className="vault-trigger-btn"
                style={{ padding: '0.35rem 0.6rem' }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scroll('right')}
                className="vault-trigger-btn"
                style={{ padding: '0.35rem 0.6rem' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="kinetic-dock" ref={dockRef}>
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                className={`dock-item ${activeImageIndex === idx ? 'active-dock-item' : ''}`}
                style={{
                  position: 'relative',
                  border: activeImageIndex === idx ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                }}
                onClick={() => setActiveImageIndex(idx)}
              >
                <SecureCanvasImage
                  src={img.url}
                  alt={img.filename || `Asset ${idx + 1}`}
                  watermarkText={watermarkText}
                  sessionId={sessionId}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '0.6rem',
                    zIndex: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-bright)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <ZoomIn size={13} style={{ color: '#60a5fa' }} />
                    {img.filename || `Item ${idx + 1}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Fullscreen Lightbox / Deep Inspection Modal */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 7, 12, 0.96)',
            backdropFilter: 'blur(24px)',
            zIndex: 10000000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              color: 'var(--text-bright)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 30,
            }}
          >
            <X size={22} />
          </button>

          {/* Secure Canvas In Lightbox Container */}
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              maxWidth: '92vw',
              maxHeight: '84vh',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 0 60px rgba(0, 0, 0, 0.9)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <SecureCanvasImage
              src={selectedImage.url}
              alt={selectedImage.filename || 'Expanded view'}
              watermarkText={watermarkText}
              sessionId={sessionId}
              style={{
                maxWidth: '92vw',
                maxHeight: '84vh',
                objectFit: 'contain',
              }}
            />
          </div>

          <div style={{ marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {selectedImage.filename}
          </div>
        </div>
      )}
    </div>
  );
};
