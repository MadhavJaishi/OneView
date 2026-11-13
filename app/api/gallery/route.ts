import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashCookie } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

// GET: Populates dashboard histories for owner or fetches specific gallery
export async function GET(req: NextRequest) {
  try {
    const authCookie = req.cookies.get('oneview_auth')?.value;
    const isAuthenticated = Boolean(authCookie);

    // If unauthenticated guest, access to History Vault is restricted
    const url = new URL(req.url);
    const requiresVault = url.searchParams.get('history') === 'true';

    if (requiresVault && !isAuthenticated) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: History Vault requires Creator Access authentication.',
        restricted: true,
      }, { status: 401 });
    }

    const creatorCookie = req.cookies.get('oneview_creator')?.value;
    if (!creatorCookie) {
      return NextResponse.json({ success: true, galleries: [], isAuthenticated });
    }

    const cookieHash = hashCookie(creatorCookie);
    const galleryId = url.searchParams.get('id');

    if (galleryId) {
      const g = await db.getGallery(galleryId);
      if (!g || g.creator_cookie_hash !== cookieHash) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }
      const images = await db.getGalleryImages(g.id);
      return NextResponse.json({ success: true, gallery: { ...g, images } });
    }

    // List all owner galleries from database
    const galleries = await db.getGalleriesByCreator(cookieHash);
    return NextResponse.json({ success: true, galleries, isAuthenticated });
  } catch (err: any) {
    console.error('Gallery GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH: Restores or reinstates an expired / revoked link with renewed lifespan
export async function PATCH(req: NextRequest) {
  try {
    const creatorCookie = req.cookies.get('oneview_creator')?.value;
    if (!creatorCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const cookieHash = hashCookie(creatorCookie);
    const body = await req.json();
    const { galleryId, extensionHours } = body;

    if (!galleryId) {
      return NextResponse.json({ success: false, error: 'Gallery ID required' }, { status: 400 });
    }

    const hours = Math.max(1, Math.min(168, extensionHours || 24));
    const updatedLink = await db.restoreGallery(galleryId, cookieHash, hours);

    if (!updatedLink) {
      return NextResponse.json({ success: false, error: 'Gallery link could not be restored' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Vault link successfully reactivated for ${hours} hours.`,
      shareLink: updatedLink,
    });
  } catch (err: any) {
    console.error('Gallery PATCH restore error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const creatorCookie = req.cookies.get('oneview_creator')?.value;
    if (!creatorCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing owner authorization' }, { status: 401 });
    }

    const cookieHash = hashCookie(creatorCookie);
    const body = await req.json();
    const { galleryId, action } = body;

    if (!galleryId) {
      return NextResponse.json({ success: false, error: 'Gallery ID required' }, { status: 400 });
    }

    if (action === 'revoke') {
      const success = await db.revokeGallery(galleryId, cookieHash);
      if (!success) {
        return NextResponse.json({ success: false, error: 'Gallery not found or unauthorized' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Vault link revoked immediately' });
    }

    // Default action: Permanent Delete (wiping all history of that item)
    const success = await db.deleteGallery(galleryId, cookieHash);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Gallery not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Vault permanently purged from database' });
  } catch (err: any) {
    console.error('Gallery DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
