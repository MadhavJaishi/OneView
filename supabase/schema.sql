-- OneView Database Schema
-- Run this in Supabase SQL Editor if connecting to Supabase PostgreSQL

-- 1. Galleries Table
CREATE TABLE IF NOT EXISTS galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    creator_cookie_hash TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Vault',
    type TEXT NOT NULL CHECK (type IN ('media', 'proxy')),
    proxy_target_url TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- 2. Gallery Images Table
CREATE TABLE IF NOT EXISTS gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
    blob_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Share Links Table
CREATE TABLE IF NOT EXISTS share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
    secure_seed VARCHAR(64) UNIQUE NOT NULL,
    short_code VARCHAR(12) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    single_use BOOLEAN NOT NULL DEFAULT false,
    locked_session_id TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for rapid clock alignment and token resolution
CREATE INDEX IF NOT EXISTS idx_share_links_short_code ON share_links(short_code);
CREATE INDEX IF NOT EXISTS idx_share_links_secure_seed ON share_links(secure_seed);
CREATE INDEX IF NOT EXISTS idx_galleries_creator_hash ON galleries(creator_cookie_hash);
CREATE INDEX IF NOT EXISTS idx_gallery_images_gallery_id ON gallery_images(gallery_id);

-- Disable Row Level Security (RLS) for server-side role keys / custom token gateway
ALTER TABLE galleries DISABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE share_links DISABLE ROW LEVEL SECURITY;
