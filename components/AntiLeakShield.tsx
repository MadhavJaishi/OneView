'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, EyeOff } from 'lucide-react';

interface AntiLeakShieldProps {
  children: React.ReactNode;
  sessionId?: string;
  clientHash?: string;
  timeTag?: string;
  enabled?: boolean;
}

export const AntiLeakShield: React.FC<AntiLeakShieldProps> = ({
  children,
  sessionId = 'SEC-8921',
  clientHash = 'X8A9F',
  timeTag = '12:00:00',
  enabled = true,
}) => {
  const [isBlurred, setIsBlurred] = useState(false);
  const [blurReason, setBlurReason] = useState<string>('');

  // 1. Interactive Event Blockage (Context Menu, Keyboard Shortcuts, Drag Starts)
  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    e.preventDefault();
  }, [enabled]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    // Hard cancellation of F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Cmd+Option+I, Ctrl+U
    const isDevKey =
      e.key === 'F12' ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) ||
      ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) ||
      ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) ||
      ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P'));

    if (isDevKey) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [enabled]);

  const handleDragStart = useCallback((e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
  }, [enabled]);

  // 2. Tab Guard Blurring: View focus break or minimize actions
  useEffect(() => {
    if (!enabled) return;

    const handleWindowBlur = () => {
      setIsBlurred(true);
      setBlurReason('Focus Lost: Window out of focus');
    };

    const handleWindowFocus = () => {
      setIsBlurred(false);
      setBlurReason('');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        setBlurReason('Tab Guard Active: Backgrounding detected');
      } else {
        setIsBlurred(false);
        setBlurReason('');
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragstart', handleDragStart);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragstart', handleDragStart);
    };
  }, [enabled, handleContextMenu, handleKeyDown, handleDragStart]);

  const watermarkString = `ONEVIEW SECURE // SESS:${sessionId} // NODE:${clientHash} // ${timeTag}`;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', userSelect: 'none' }}>
      {/* Dynamic Watermark Grid */}
      {enabled && (
        <div className="anti-leak-watermark" aria-hidden="true">
          {Array.from({ length: 48 }).map((_, idx) => (
            <span key={idx} className="watermark-token">
              {watermarkString}
            </span>
          ))}
        </div>
      )}

      {/* Primary Visual Content (Subject to Blur) */}
      <div className={isBlurred ? 'tab-guard-blur' : ''} style={{ transition: 'filter 0.15s ease' }}>
        {children}
      </div>

      {/* Shield Warning Prompt when viewfocus is broken */}
      {isBlurred && (
        <div className="tab-guard-warning" onClick={() => setIsBlurred(false)}>
          <ShieldAlert size={56} style={{ color: 'var(--accent-cyan)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Protected View Active
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '440px', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {blurReason || 'Context content has been blurred to protect confidential data from unauthorized capture or screen recording.'}
          </p>
          <button className="btn-primary" onClick={() => setIsBlurred(false)}>
            <EyeOff size={16} /> Click to Resume Viewing
          </button>
        </div>
      )}
    </div>
  );
};
