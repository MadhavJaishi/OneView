'use client';

import React from 'react';
import { Zap } from 'lucide-react';

interface SecurityPolicySectionProps {
  title: string;
  setTitle: (t: string) => void;
  hours: number;
  setHours: (h: number) => void;
  singleUse: boolean;
  setSingleUse: (s: boolean) => void;
  watermarkEnabled: boolean;
  setWatermarkEnabled: (w: boolean) => void;
  watermarkText: string;
  setWatermarkText: (t: string) => void;
  isSubmitting: boolean;
  user: any;
  onRequireAuth: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SecurityPolicySection: React.FC<SecurityPolicySectionProps> = ({
  title,
  setTitle,
  hours,
  setHours,
  singleUse,
  setSingleUse,
  watermarkEnabled,
  setWatermarkEnabled,
  watermarkText,
  setWatermarkText,
  isSubmitting,
  user,
  onRequireAuth,
  onSubmit,
}) => {
  return (
    <section className="studio-card">
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label">Share Title / Reference</label>
          <input
            type="text"
            className="text-input"
            placeholder="e.g., Q4 Design Specs"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <label className="form-label" style={{ margin: 0 }}>
              Expiration Lifespan
            </label>
            <span className="selected-expiration-text">
              {hours === 168 ? '7 Days' : `${hours} Hours`}
            </span>
          </div>
          <div className="duration-grid">
            {[
              { val: 1, label: '1h' },
              { val: 6, label: '6h' },
              { val: 12, label: '12h' },
              { val: 24, label: '24h' },
              { val: 168, label: '7d', needsLogin: true },
            ].map(opt => {
              const isGated = !user && opt.needsLogin;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    if (isGated) {
                      onRequireAuth();
                      return;
                    }
                    setHours(opt.val);
                  }}
                  className={`duration-chip ${hours === opt.val ? 'selected' : ''} ${isGated ? 'gated' : ''}`}
                  title={isGated ? 'Requires login' : ''}
                >
                  {opt.label} {isGated ? '🔒' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Shield Policies */}
        <div style={{ margin: '1.5rem 0' }}>
          <div className="setting-toggle-row">
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                Single-Use Burn Link
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Self-destructs immediately after first access
              </div>
            </div>
            <button
              type="button"
              className={`switch-control ${singleUse ? 'checked' : ''}`}
              onClick={() => setSingleUse(!singleUse)}
            >
              <div className="switch-knob" />
            </button>
          </div>

          <div className="setting-toggle-row">
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                Dynamic Watermark Grid
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Renders dynamic session-bound overlay
              </div>
            </div>
            <button
              type="button"
              className={`switch-control ${watermarkEnabled ? 'checked' : ''}`}
              onClick={() => setWatermarkEnabled(!watermarkEnabled)}
            >
              <div className="switch-knob" />
            </button>
          </div>
        </div>

        {watermarkEnabled && (
          <div className="form-group">
            <label className="form-label">Watermark Stamp</label>
            <input
              type="text"
              className="text-input"
              value={watermarkText}
              onChange={e => setWatermarkText(e.target.value)}
            />
          </div>
        )}

        <button type="submit" className="action-submit-button" disabled={isSubmitting}>
          <Zap size={16} />
          {isSubmitting ? 'Sealing Vault in Database...' : 'Generate Protected Link'}
        </button>
      </form>
    </section>
  );
};
