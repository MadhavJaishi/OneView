'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
  confirmModal: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  } | null>(null);

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message, title }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string, title?: string) => addToast('success', msg, title),
    error: (msg: string, title?: string) => addToast('error', msg, title),
    warning: (msg: string, title?: string) => addToast('warning', msg, title),
    info: (msg: string, title?: string) => addToast('info', msg, title),
  };

  const confirmModal = useCallback((options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => {
    setModalState({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm,
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, confirmModal }}>
      {children}

      {/* Floating Toasts Viewport */}
      <div
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '420px',
          width: 'calc(100vw - 3rem)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => {
          const colors = {
            success: {
              border: 'rgba(0, 240, 255, 0.4)',
              bg: 'rgba(11, 24, 38, 0.94)',
              icon: <CheckCircle2 size={18} style={{ color: '#00f0ff' }} />,
            },
            error: {
              border: 'rgba(255, 51, 68, 0.4)',
              bg: 'rgba(38, 12, 16, 0.94)',
              icon: <XCircle size={18} style={{ color: '#ff3344' }} />,
            },
            warning: {
              border: 'rgba(255, 184, 0, 0.4)',
              bg: 'rgba(38, 30, 10, 0.94)',
              icon: <AlertTriangle size={18} style={{ color: '#ffb800' }} />,
            },
            info: {
              border: 'rgba(121, 40, 202, 0.4)',
              bg: 'rgba(24, 14, 38, 0.94)',
              icon: <Info size={18} style={{ color: '#c084fc' }} />,
            },
          }[t.type];

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.9rem 1.1rem',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                color: '#f0f4fc',
                animation: 'slideInToast 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>{colors.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                    {t.title}
                  </div>
                )}
                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  {t.message}
                </div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8b9bb4',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {modalState?.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 7, 12, 0.8)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setModalState(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(18, 21, 31, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={22} style={{ color: '#ff3344' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f0f4fc' }}>
                {modalState.title}
              </h3>
            </div>
            <p style={{ color: '#8b9bb4', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {modalState.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setModalState(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f0f4fc',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {modalState.cancelText}
              </button>
              <button
                onClick={() => {
                  modalState.onConfirm();
                  setModalState(null);
                }}
                className="btn-danger"
                style={{
                  padding: '0.55rem 1.1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
