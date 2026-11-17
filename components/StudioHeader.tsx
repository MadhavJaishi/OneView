'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Shield, FolderLock, Palette, Sun, Moon, Sparkles } from 'lucide-react';

export type AppTheme = 'blue' | 'light' | 'green' | 'purple';

interface StudioHeaderProps {
  user: any;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onOpenHistory: () => void;
}

const THEME_OPTIONS: { id: AppTheme; label: string; icon: any; color: string }[] = [
  { id: 'blue', label: 'Blue (Default)', icon: Moon, color: '#3b82f6' },
  { id: 'light', label: 'Light', icon: Sun, color: '#f59e0b' },
  { id: 'green', label: 'Emerald Green', icon: Sparkles, color: '#10b981' },
  { id: 'purple', label: 'Neon Purple', icon: Palette, color: '#a855f7' },
];

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  user,
  currentTheme,
  onThemeChange,
  onOpenHistory,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    if (showThemeMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showThemeMenu]);

  const currentOption = THEME_OPTIONS.find(t => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <header className="app-header">
      <div className="brand-badge">
        <div className="brand-icon-box">
          <Shield size={20} />
        </div>
        <div>
          <div className="brand-name">
            One<span style={{ color: 'var(--accent-primary)' }}>View</span> Studio
          </div>
          <div className="brand-tagline">
            Privacy-Preserving Asset Distribution & Web Relay
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {/* Theme Selector Dropdown */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            type="button"
            className="vault-trigger-btn"
            onClick={() => setShowThemeMenu(prev => !prev)}
            title="Switch Visual Theme"
            style={{
              gap: '0.45rem',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: currentOption.color,
                display: 'inline-block',
                boxShadow: `0 0 8px ${currentOption.color}80`,
              }}
            />
            <span style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>
              {currentOption.label.split(' ')[0]}
            </span>
          </button>

          {showThemeMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                padding: '0.4rem',
                minWidth: '160px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
              }}
            >
              {THEME_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = currentTheme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onThemeChange(opt.id);
                      setShowThemeMenu(false);
                    }}
                    style={{
                      background: isSelected ? 'var(--bg-input)' : 'transparent',
                      border: isSelected ? '1px solid var(--border-subtle)' : '1px solid transparent',
                      color: isSelected ? 'var(--text-bright)' : 'var(--text-body)',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-xs)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? 600 : 400,
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: opt.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ flex: 1 }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* History Vault Trigger */}
        <button
          type="button"
          className={`vault-trigger-btn ${user ? 'unlocked' : ''}`}
          onClick={onOpenHistory}
        >
          <FolderLock size={15} />
          {user ? `History Vault (${user.email.split('@')[0]})` : 'History Vault'}
        </button>
      </div>
    </header>
  );
};
