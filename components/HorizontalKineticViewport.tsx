'use client';

import React, { useRef, useState } from 'react';
import { ZoomIn, ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface KineticImage {
  id: string;
  url: string;
  filename?: string;
  size_bytes?: number;
}

interface HorizontalKineticViewportProps {
  images: KineticImage[];
}

export const HorizontalKineticViewport: React.FC<HorizontalKineticViewportProps> = ({ images }) => {
  const dockRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<KineticImage | null>(null);

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

  return (
    <div style={{ position: 'relative', width: '100%', margin: '1.5rem 0' }}>
      {/* Scroll controls */}
      {images.length > 3 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button
            onClick={() => scroll('left')}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Horizontal Scrolling Preview Dock */}
      <div className="kinetic-dock" ref={dockRef}>
        {images.map((img, idx) => (
          <div
            key={img.id || idx}
            className="dock-item"
            onClick={() => setSelectedImage(img)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.filename || `Vault Asset ${idx + 1}`} loading="lazy" />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '0.75rem',
                opacity: 0.9,
              }}
            >
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <ZoomIn size={14} style={{ color: 'var(--accent-cyan)' }} />
                {img.filename || `Item ${idx + 1}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox / High-Res Inspection */}
      {selectedImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 7, 12, 0.94)',
            backdropFilter: 'blur(24px)',
            zIndex: 100000,
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
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            <X size={28} />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage.url}
            alt={selectedImage.filename || 'Expanded view'}
            style={{
              maxWidth: '90vw',
              maxHeight: '82vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 0 50px rgba(0,0,0,0.8)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {selectedImage.filename}
          </div>
        </div>
      )}
    </div>
  );
};
