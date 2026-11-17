'use client';

import React, { useState } from 'react';
import { ShieldCheck, X, ArrowRight, Lock, UserCheck, KeyRound } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      toast.success(
        mode === 'login' ? 'Welcome back! Vault unlocked.' : 'Account created successfully.',
        'Authenticated'
      );
      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Authentication error', 'Access Denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 9, 16, 0.78)',
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
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            <KeyRound size={16} />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-bright)' }}>
            {mode === 'login' ? 'Vault Authentication' : 'Create Vault Account'}
          </h2>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.45 }}>
          {mode === 'login'
            ? 'Sign in to access your shared links repository and unlock extended retention.'
            : 'Register your account to preserve long-term share histories.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="text-input"
              placeholder="alex@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="text-input"
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="action-submit-button" disabled={loading} style={{ margin: 0 }}>
            {loading ? 'Verifying...' : mode === 'login' ? 'Unlock Vault' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {mode === 'login' ? (
            <span>
              Don’t have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
