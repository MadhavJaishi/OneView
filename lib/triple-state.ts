'use client';

// Pure in-memory UI state helper
// All persistence, ownership tracking, and records are managed strictly in the database/server.
// Zero data is stored in the browser's localStorage or the local codebase.

export interface GalleryEntryItem {
  id: string;
  title: string;
  type: 'media' | 'proxy';
  short_code: string;
  secure_seed: string;
  expires_at: string;
  single_use: boolean;
  images_count: number;
  created_at: string;
  revoked?: boolean;
}
