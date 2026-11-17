'use client';

import React, { useRef, useEffect } from 'react';

interface SecureCanvasImageProps {
  src: string;
  alt?: string;
  watermarkText?: string;
  sessionId?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoaded?: () => void;
}

/**
 * Renders an image strictly via HTML5 Canvas rasterization.
 * 1. Completely blocks <img> right-click "Save Image As", drag-and-drop extraction, and direct DOM link crawling.
 * 2. Paints a secondary client-side multi-layer watermark overlay directly into the canvas pixels.
 */
export const SecureCanvasImage: React.FC<SecureCanvasImageProps> = ({
  src,
  alt = 'Secure Asset',
  watermarkText = 'RESTRICTED VIEW',
  sessionId = 'SEC-VIEW',
  className = '',
  style = {},
  onLoaded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      canvas.width = img.naturalWidth || img.width || 1200;
      canvas.height = img.naturalHeight || img.height || 800;

      // 1. Draw original server-delivered image onto canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. Draw reinforcing watermark pattern directly into the raster pixels
      ctx.save();
      ctx.font = 'bold 20px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.lineWidth = 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const text = `${watermarkText.toUpperCase()} • ${sessionId}`;
      const stepX = 340;
      const stepY = 180;

      ctx.rotate((-25 * Math.PI) / 180);

      // Fill beyond boundary to accommodate angle
      const diag = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
      for (let x = -diag; x < diag * 1.5; x += stepX) {
        for (let y = -diag; y < diag * 1.5; y += stepY) {
          ctx.strokeText(text, x, y);
          ctx.fillText(text, x, y);
        }
      }

      ctx.restore();

      if (onLoaded) {
        onLoaded();
      }
    };

    img.src = src;
  }, [src, watermarkText, sessionId, onLoaded]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label={alt}
      onContextMenu={e => e.preventDefault()}
      style={{
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%',
        userSelect: 'none',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
};
