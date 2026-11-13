import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSessionId } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    // 1. Resolve share link by token (matches either short_code or secure_seed)
    const shareLink = await db.getShareLinkByToken(token);
    if (!shareLink) {
      return NextResponse.json({ success: false, error: 'Link does not exist or has expired' }, { status: 404 });
    }

    // 2. Check if revoked
    if (shareLink.revoked) {
      return NextResponse.json({ success: false, error: 'This access token has been revoked by the owner' }, { status: 410 });
    }

    // 3. Dynamic Clock Alignment Check
    const now = new Date();
    const expiresAt = new Date(shareLink.expires_at);
    if (now > expiresAt) {
      return NextResponse.json({ success: false, error: 'Security token expired' }, { status: 410 });
    }

    // 4. Session Shielding & Single-Usage Locking
    let sessionId = req.cookies.get('oneview_session')?.value;
    let setSessionCookie = false;

    if (!sessionId) {
      sessionId = generateSessionId();
      setSessionCookie = true;
    }

    if (shareLink.single_use) {
      if (shareLink.locked_session_id && shareLink.locked_session_id !== sessionId) {
        return NextResponse.json({
          success: false,
          error: 'Single-Usage Access Violation: This link is bound to another device/session and cannot be accessed again.'
        }, { status: 403 });
      }

      // Lock to this session on first arrival
      if (!shareLink.locked_session_id) {
        await db.updateShareLink(shareLink.id, {
          locked_session_id: sessionId,
          view_count: shareLink.view_count + 1
        });
      }
    } else {
      // Increment view count
      await db.updateShareLink(shareLink.id, {
        view_count: shareLink.view_count + 1
      });
    }

    // 5. Retrieve Gallery details and images
    const gallery = await db.getGallery(shareLink.gallery_id);
    if (!gallery || gallery.is_deleted) {
      return NextResponse.json({ success: false, error: 'Gallery not found or deleted' }, { status: 404 });
    }

    const images = gallery.type === 'media' ? await db.getGalleryImages(gallery.id) : [];

    // Client watermark identifier components (IP hash, timestamp, session ID)
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const watermarkData = {
      sessionId: sessionId.slice(-8).toUpperCase(),
      clientHash: Buffer.from(clientIp).toString('base64').slice(0, 6).toUpperCase(),
      timeTag: new Date().toLocaleTimeString('en-US', { hour12: false }),
    };

    const response = NextResponse.json({
      success: true,
      gallery: {
        id: gallery.id,
        title: gallery.title,
        type: gallery.type,
        images: images.map(img => ({
          id: img.id,
          url: img.blob_url,
          filename: img.filename,
          size_bytes: img.size_bytes,
          mime_type: img.mime_type
        })),
        isProxy: gallery.type === 'proxy',
        // Raw target host is NOT returned to client if proxy mode!
        proxyPath: gallery.type === 'proxy' ? `/api/proxy-site?token=${token}` : null,
      },
      expires_at: shareLink.expires_at,
      single_use: shareLink.single_use,
      watermarkData,
    });

    if (setSessionCookie) {
      response.cookies.set('oneview_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return response;
  } catch (err: any) {
    console.error('Validation error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Validation error' }, { status: 500 });
  }
}
