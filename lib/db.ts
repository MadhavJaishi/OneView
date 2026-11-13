import crypto from 'crypto';

// Types
export interface Gallery {
  id: string;
  created_at: string;
  creator_cookie_hash: string;
  title: string;
  type: 'media' | 'proxy';
  proxy_target_url?: string | null;
  is_deleted: boolean;
}

export interface GalleryImage {
  id: string;
  gallery_id: string;
  blob_url: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  sort_order: number;
  created_at: string;
}

export interface ShareLink {
  id: string;
  gallery_id: string;
  secure_seed: string;
  short_code: string;
  expires_at: string;
  single_use: boolean;
  locked_session_id?: string | null;
  view_count: number;
  revoked: boolean;
  created_at: string;
}

export interface CompleteGallery extends Gallery {
  images: GalleryImage[];
  share_link?: ShareLink;
}

// In-Memory / File Persistent Mock store for local development without credentials
class LocalStore {
  galleries: Map<string, Gallery> = new Map();
  galleryImages: Map<string, GalleryImage[]> = new Map();
  shareLinks: Map<string, ShareLink> = new Map();

  constructor() {
    // Persistent if possible or memory state
  }

  createGallery(data: Omit<Gallery, 'id' | 'created_at' | 'is_deleted'>): Gallery {
    const id = crypto.randomUUID();
    const gallery: Gallery = {
      id,
      created_at: new Date().toISOString(),
      creator_cookie_hash: data.creator_cookie_hash,
      title: data.title || 'Untitled Vault',
      type: data.type,
      proxy_target_url: data.proxy_target_url || null,
      is_deleted: false,
    };
    this.galleries.set(id, gallery);
    this.galleryImages.set(id, []);
    return gallery;
  }

  addImage(gallery_id: string, img: Omit<GalleryImage, 'id' | 'created_at' | 'gallery_id'>): GalleryImage {
    const id = crypto.randomUUID();
    const newImage: GalleryImage = {
      id,
      gallery_id,
      blob_url: img.blob_url,
      filename: img.filename,
      mime_type: img.mime_type,
      size_bytes: img.size_bytes,
      sort_order: img.sort_order || 0,
      created_at: new Date().toISOString(),
    };
    const list = this.galleryImages.get(gallery_id) || [];
    list.push(newImage);
    this.galleryImages.set(gallery_id, list);
    return newImage;
  }

  createShareLink(link: Omit<ShareLink, 'id' | 'created_at' | 'view_count' | 'revoked'>): ShareLink {
    const id = crypto.randomUUID();
    const newLink: ShareLink = {
      id,
      gallery_id: link.gallery_id,
      secure_seed: link.secure_seed,
      short_code: link.short_code,
      expires_at: link.expires_at,
      single_use: link.single_use,
      locked_session_id: link.locked_session_id || null,
      view_count: 0,
      revoked: false,
      created_at: new Date().toISOString(),
    };
    this.shareLinks.set(newLink.short_code, newLink);
    this.shareLinks.set(newLink.secure_seed, newLink);
    return newLink;
  }

  getShareLinkByToken(token: string): ShareLink | null {
    return this.shareLinks.get(token) || null;
  }

  updateShareLink(short_code: string, updates: Partial<ShareLink>): ShareLink | null {
    const existing = this.shareLinks.get(short_code);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.shareLinks.set(existing.short_code, updated);
    this.shareLinks.set(existing.secure_seed, updated);
    return updated;
  }

  getGallery(id: string): Gallery | null {
    const g = this.galleries.get(id);
    if (!g || g.is_deleted) return null;
    return g;
  }

  getGalleryImages(gallery_id: string): GalleryImage[] {
    return (this.galleryImages.get(gallery_id) || []).sort((a, b) => a.sort_order - b.sort_order);
  }

  getGalleriesByCreator(cookieHash: string): CompleteGallery[] {
    const results: CompleteGallery[] = [];
    for (const g of this.galleries.values()) {
      if (g.creator_cookie_hash === cookieHash && !g.is_deleted) {
        // find share link
        let foundLink: ShareLink | undefined;
        for (const l of this.shareLinks.values()) {
          if (l.gallery_id === g.id) {
            foundLink = l;
            break;
          }
        }
        results.push({
          ...g,
          images: this.getGalleryImages(g.id),
          share_link: foundLink,
        });
      }
    }
    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  deleteGallery(id: string): boolean {
    const g = this.galleries.get(id);
    if (!g) return false;
    g.is_deleted = true;
    this.galleries.set(id, g);
    // revoke share links
    for (const [key, link] of this.shareLinks.entries()) {
      if (link.gallery_id === id) {
        link.revoked = true;
      }
    }
    return true;
  }
}

// Global singleton to survive Next.js fast-refresh during dev
declare global {
  var __oneview_store__: LocalStore | undefined;
}

const localStore = global.__oneview_store__ ?? new LocalStore();
if (process.env.NODE_ENV !== 'production') {
  global.__oneview_store__ = localStore;
}

// Helper checking if Supabase credentials are configured and valid
export const hasSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('YOUR_URL') && !key.includes('YOUR_'));
};

export const getSupabaseClient = async () => {
  if (!hasSupabaseConfig()) return null;
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
};

// Unified Data Access Layer
export const db = {
  async createGallery(data: Omit<Gallery, 'id' | 'created_at' | 'is_deleted'>): Promise<Gallery> {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data: row, error } = await supabase
        .from('galleries')
        .insert([{
          creator_cookie_hash: data.creator_cookie_hash,
          title: data.title || 'Untitled Vault',
          type: data.type,
          proxy_target_url: data.proxy_target_url || null,
        }])
        .select()
        .single();
      if (error) {
        console.warn('Supabase insert gallery error, falling back to local memory store:', error.message);
        return localStore.createGallery(data);
      }
      return row;
    }
    return localStore.createGallery(data);
  },

  async addGalleryImage(gallery_id: string, img: Omit<GalleryImage, 'id' | 'created_at' | 'gallery_id'>): Promise<GalleryImage> {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data: row, error } = await supabase
        .from('gallery_images')
        .insert([{
          gallery_id,
          blob_url: img.blob_url,
          filename: img.filename,
          mime_type: img.mime_type,
          size_bytes: img.size_bytes,
          sort_order: img.sort_order || 0,
        }])
        .select()
        .single();
      if (error) {
        console.warn('Supabase insert image error, fallback to local store:', error.message);
        return localStore.addImage(gallery_id, img);
      }
      return row;
    }
    return localStore.addImage(gallery_id, img);
  },

  async createShareLink(link: Omit<ShareLink, 'id' | 'created_at' | 'view_count' | 'revoked'>): Promise<ShareLink> {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data: row, error } = await supabase
        .from('share_links')
        .insert([{
          gallery_id: link.gallery_id,
          secure_seed: link.secure_seed,
          short_code: link.short_code,
          expires_at: link.expires_at,
          single_use: link.single_use,
          locked_session_id: link.locked_session_id || null,
        }])
        .select()
        .single();
      if (error) {
        console.warn('Supabase insert share link error, fallback to local store:', error.message);
        return localStore.createShareLink(link);
      }
      return row;
    }
    return localStore.createShareLink(link);
  },

  async getShareLinkByToken(token: string): Promise<ShareLink | null> {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data: row } = await supabase
        .from('share_links')
        .select('*')
        .or(`short_code.eq.${token},secure_seed.eq.${token}`)
        .maybeSingle();
      if (row) return row;
    }
    return localStore.getShareLinkByToken(token);
  },

  async updateShareLink(id: string, updates: Partial<ShareLink>): Promise<ShareLink | null> {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data: row } = await supabase
        .from('share_links')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (row) return row;
    }
    // Update by ID in local store
    for (const [code, item] of localStore.shareLinks.entries()) {
      if (item.id === id) {
        return localStore.updateShareLink(code, updates);
      }
    }
    return null;
  },

  async getGallery(id: string): Promise<Gallery | null> {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data: row } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .maybeSingle();
      if (row) return row;
    }
    return localStore.getGallery(id);
  },

  async getGalleryImages(gallery_id: string): Promise<GalleryImage[]> {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data: rows } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('gallery_id', gallery_id)
        .order('sort_order', { ascending: true });
      if (rows) return rows;
    }
    return localStore.getGalleryImages(gallery_id);
  },

  async getGalleriesByCreator(cookieHash: string): Promise<CompleteGallery[]> {
    const supabase = await getSupabaseClient();
    if (supabase) {
      const { data: galleries } = await supabase
        .from('galleries')
        .select('*')
        .eq('creator_cookie_hash', cookieHash)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (galleries && galleries.length > 0) {
        const full: CompleteGallery[] = [];
        for (const g of galleries) {
          const imgs = await this.getGalleryImages(g.id);
          const { data: link } = await supabase
            .from('share_links')
            .select('*')
            .eq('gallery_id', g.id)
            .maybeSingle();
          full.push({
            ...g,
            images: imgs,
            share_link: link || undefined,
          });
        }
        return full;
      }
    }
    return localStore.getGalleriesByCreator(cookieHash);
  },

  async deleteGallery(id: string, cookieHash: string): Promise<boolean> {
    const supabase = await getSupabaseClient();
    if (supabase) {
      // Mark deleted or remove
      const { error } = await supabase
        .from('galleries')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('creator_cookie_hash', cookieHash);
      if (!error) {
        await supabase.from('share_links').update({ revoked: true }).eq('gallery_id', id);
        return true;
      }
    }
    const gallery = localStore.getGallery(id);
    if (gallery && gallery.creator_cookie_hash === cookieHash) {
      return localStore.deleteGallery(id);
    }
    return false;
  }
};
