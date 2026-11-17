import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storage } from '@/lib/storage';
import { generateSecureSeed, generateShortCode, generateCreatorCookie, hashCookie } from '@/lib/crypto';
import { bakeServerWatermark } from '@/lib/watermark';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const type = (formData.get('type') as 'media' | 'proxy') || 'media';
    const title = (formData.get('title') as string) || (type === 'proxy' ? 'Stealth Web Proxy' : 'Confidential Vault');
    const rawProxyUrl = (formData.get('proxyTargetUrl') as string) || '';
    let proxyTargetUrl = rawProxyUrl.trim();
    if (proxyTargetUrl && !proxyTargetUrl.startsWith('http://') && !proxyTargetUrl.startsWith('https://')) {
      proxyTargetUrl = 'https://' + proxyTargetUrl;
    }
    const watermarkText = (formData.get('watermarkText') as string) || 'CONFIDENTIAL';
    const watermarkEnabled = formData.get('watermarkEnabled') !== 'false';
    const rawHours = parseInt((formData.get('hours') as string) || '24', 10);
    const singleUse = formData.get('singleUse') === 'true';

    // Check if user is logged in via oneview_auth cookie
    const authCookie = req.cookies.get('oneview_auth')?.value;
    const isAuthenticated = Boolean(authCookie);

    // Guest restrictions: Max 24 hours (cannot use 7 days), restricted to single-use
    let hours = rawHours;
    if (!isAuthenticated) {
      if (hours > 24) {
        hours = 24; // Force maximum 24h cap for unauthenticated guests
      }
    }

    // Cookie management for Ownership Tracking
    let creatorCookie = req.cookies.get('oneview_creator')?.value;
    let setCookieHeader = false;
    if (!creatorCookie) {
      creatorCookie = generateCreatorCookie();
      setCookieHeader = true;
    }
    const cookieHash = hashCookie(creatorCookie);

    // Expiration timestamp
    const boundedHours = Math.max(1, Math.min(168, isNaN(hours) ? 24 : hours));
    const expiresAt = new Date(Date.now() + boundedHours * 60 * 60 * 1000).toISOString();

    // 1. Create Gallery record
    const gallery = await db.createGallery({
      creator_cookie_hash: cookieHash,
      title,
      type,
      proxy_target_url: type === 'proxy' ? proxyTargetUrl : null,
      watermark_text: watermarkText,
    } as any);

    // 2. Ingest Media files if media type
    const storedImages = [];
    if (type === 'media') {
      const files = formData.getAll('files') as File[];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file || typeof file === 'string') continue;
        const arrayBuffer = await file.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);
        let mimeType = file.type || 'image/png';

        // Server-Side Watermark Baking:
        // Bake the watermark directly into the image pixel data before storing.
        // The unwatermarked image never touches the database or client.
        if (watermarkEnabled) {
          const baked = await bakeServerWatermark(buffer, watermarkText || 'RESTRICTED VIEW', mimeType);
          buffer = Buffer.from(baked.buffer);
          mimeType = baked.mimeType;
        }

        const blobUrl = await storage.put(file.name || `image-${i}.png`, buffer, mimeType);

        const imageRecord = await db.addGalleryImage(gallery.id, {
          blob_url: blobUrl,
          filename: file.name || `image-${i}`,
          mime_type: mimeType,
          size_bytes: buffer.length,
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
      },
      watermark: {
        text: watermarkText,
        enabled: watermarkEnabled,
      }
    });

    if (setCookieHeader) {
      response.cookies.set('oneview_creator', creatorCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error during upload:', error);
    return NextResponse.json({ success: false, error: error.message || 'Upload processing failed' }, { status: 500 });
  }
}
