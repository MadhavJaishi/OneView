'use client';

import React, { useRef } from 'react';
import { FileCheck, Globe, Upload } from 'lucide-react';

export interface StagedFile {
  file: File;
  previewUrl: string;
}

interface AssetPayloadSectionProps {
  activeTab: 'media' | 'proxy';
  setActiveTab: (tab: 'media' | 'proxy') => void;
  stagedFiles: StagedFile[];
  setStagedFiles: React.Dispatch<React.SetStateAction<StagedFile[]>>;
  proxyUrl: string;
  setProxyUrl: (url: string) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const AssetPayloadSection: React.FC<AssetPayloadSectionProps> = ({
  activeTab,
  setActiveTab,
  stagedFiles,
  setStagedFiles,
  proxyUrl,
  setProxyUrl,
  isDragging,
  setIsDragging,
  onDrop,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="studio-card">
      <div className="mode-pill-bar">
        <button
          type="button"
          className={`mode-pill-tab ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          <FileCheck size={16} /> Visual Assets
        </button>
        <button
          type="button"
          className={`mode-pill-tab ${activeTab === 'proxy' ? 'active' : ''}`}
          onClick={() => setActiveTab('proxy')}
        >
          <Globe size={16} /> Masked Web Tunnel
        </button>
      </div>

      {activeTab === 'media' && (
        <div>
          <div
            className={`upload-canvas ${isDragging ? 'active-drag' : ''}`}
            onDrop={onDrop}
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={e => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              multiple
              accept="image/*"
              onChange={e => {
                if (e.target.files) {
                  const files = Array.from(e.target.files).map(file => ({
                    file,
                    previewUrl: URL.createObjectURL(file),
                  }));
                  setStagedFiles(prev => [...prev, ...files]);
                }
              }}
            />
            <div className="upload-icon-avatar">
              <Upload size={20} />
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '0.35rem' }}>
              Click to browse or drop media files
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Supports drag snatching from other tabs and Ctrl+C / Cmd+V paste
            </div>
          </div>

          {/* Staged Media Carousel */}
          {stagedFiles.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Staged items ({stagedFiles.length})
                </span>
                <button
                  type="button"
                  onClick={() => setStagedFiles([])}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Remove All
                </button>
              </div>
              <div className="preview-carousel">
                {stagedFiles.map((sf, index) => (
                  <div key={index} className="preview-thumbnail-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sf.previewUrl} alt={sf.file.name} />
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setStagedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '4px',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'proxy' && (
        <div>
          <div className="form-group">
            <label className="form-label">Destination Web URL</label>
            <input
              type="url"
              className="text-input"
              placeholder="https://private-dashboard.company.internal"
              value={proxyUrl}
              onChange={e => setProxyUrl(e.target.value)}
              required
            />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Shielded proxy tunnel: Target hostname is fully hidden from client inspection and proxied through isolated stream rewriting.
          </p>
        </div>
      )}
    </section>
  );
};
