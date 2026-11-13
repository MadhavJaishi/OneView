import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { generateSecureSeed, generateShortCode, generateCreatorCookie, hashCookie } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const type = (formData.get('type') as 'media' | 'proxy') || 'media';
    const title = (formData.get('title') as string) || 'Untitled Vault';
    const proxyTargetUrl = (formData.get('proxyTargetUrl') as string) || '';
    const hours = parseInt((formData.get('hours') as string) || '24', 10);
    const singleUse = formData.get('singleUse') === 'true';

    // Cookie management for Triple-State Ownership Tracking
    let creatorCookie = req.cookies.get('oneview_creator')?.value;
    let setCookieHeader = false;
    if (!creatorCookie) {
      creatorCookie = generateCreatorCookie();
      setCookieHeader = true;
    }
    const cookieHash = hashCookie(creatorCookie);

    // Calculate expiration timestamp
    const boundedHours = Math.max(1, Math.min(168, isNaN(hours) ? 24 : hours));
    const expiresAt = new Date(Date.now() + boundedHours * 60 * 60 * 1000).toISOString();

    // 1. Create Gallery record
    const gallery = await db.createGallery({
      creator_cookie_hash: cookieHash,
      title,
      type,
      proxy_target_url: type === 'proxy' ? proxyTargetUrl : null,
    });

    // 2. Ingest Media files if media type
    const storedImages = [];
    if (type === 'media') {
      const files = formData.getAll('files') as File[];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file || typeof file === 'string') continue;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const blobUrl = await storage.put(file.name || `image-${i}.png`, buffer, file.type || 'image/png');

        const imageRecord = await db.addGalleryImage(gallery.id, {
          blob_url: blobUrl,
          filename: file.name || `image-${i}`,
          mime_type: file.type || 'image/png',
          size_bytes: file.size || buffer.length,
          sort_order: i,
        });
        storedImages.push(imageRecord);
      }
    }

    // 3. Generate Secure Seed & Short Code
    const secureSeed = generateSecureSeed();
    const shortCode = generateShortCode();

    const shareLink = await db.createShareLink({
      gallery_id: gallery.id,
      secure_seed: secureSeed,
      short_code: shortCode,
      expires_at: expiresAt,
      single_use: singleUse,
    });

    const response = NextResponse.json({
      success: true,
      gallery: {
        id: gallery.id,
        title: gallery.title,
        type: gallery.type,
        created_at: gallery.created_at,
        images_count: storedImages.length,
      },
      shareLink: {
        short_code: shareLink.short_code,
        secure_seed: shareLink.secure_seed,
        expires_at: shareLink.expires_at,
        single_use: shareLink.single_use,
        short_url: `/v/${shareLink.short_code}`,
        seed_url: `/v/seed/${shareLink.secure_seed}`,
      }
    });

    // Set ownership cookie if not previously present
    if (setCookieHeader) {
      response.cookies.set('oneview_creator', creatorCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60, // 1 year
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error during upload:', error);
    return NextResponse.json({ success: false, error: error.message || 'Upload processing failed' }, { status: 500 });
  }
}
