'use client';

// Triple-State Visibility Strategy Engine
// 1. Ownership Tracking (Cookies handled server-side / HTTP headers)
// 2. Local Index Caching (localStorage sync for immediate UI responsiveness)
// 3. Inertial Suppression Ledger (Client blocklist preventing resurrected deleted records)

const STORAGE_KEY_GALLERY_CACHE = 'oneview_local_galleries_cache';
const STORAGE_KEY_SUPPRESSION_LEDGER = 'oneview_suppression_ledger';

export interface CachedGalleryEntry {
  id: string;
  title: string;
  type: 'media' | 'proxy';
  short_code: string;
  secure_seed: string;
  expires_at: string;
  single_use: boolean;
  images_count: number;
  created_at: string;
}

export const TripleStateEngine = {
  // Get all suppressed (locally blocklisted) gallery IDs
  getSuppressionLedger(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_SUPPRESSION_LEDGER);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Add an item to the suppression ledger (immediate physical suppression)
  suppressId(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getSuppressionLedger();
      if (!current.includes(id)) {
        current.push(id);
        localStorage.setItem(STORAGE_KEY_SUPPRESSION_LEDGER, JSON.stringify(current));
      }
      // Also purge immediately from local cache
      const cached = this.getCachedGalleries();
      const filtered = cached.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY_GALLERY_CACHE, JSON.stringify(filtered));
    } catch (err) {
      console.error('Failed to suppress ID in ledger', err);
    }
  },

  // Retrieve cached galleries filtered through suppression ledger
  getCachedGalleries(): CachedGalleryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_GALLERY_CACHE);
      if (!data) return [];
      const list: CachedGalleryEntry[] = JSON.parse(data);
      const suppressed = new Set(this.getSuppressionLedger());
      return list.filter(item => !suppressed.has(item.id));
    } catch {
      return [];
    }
  },

  // Update cached galleries, honoring suppression ledger
  setCachedGalleries(galleries: CachedGalleryEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
      const suppressed = new Set(this.getSuppressionLedger());
      const clean = galleries.filter(item => !suppressed.has(item.id));
      localStorage.setItem(STORAGE_KEY_GALLERY_CACHE, JSON.stringify(clean));
    } catch (err) {
      console.error('Failed to cache galleries', err);
    }
  },

  // Merge newly created gallery into local cache
  appendCache(entry: CachedGalleryEntry): void {
    if (typeof window === 'undefined') return;
    const current = this.getCachedGalleries();
    const updated = [entry, ...current.filter(i => i.id !== entry.id)];
    this.setCachedGalleries(updated);
  }
};
