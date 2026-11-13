import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashCookie } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

// GET: Populates dashboard histories for owner or fetches specific gallery
export async function GET(req: NextRequest) {
  try {
    const creatorCookie = req.cookies.get('oneview_creator')?.value;
    if (!creatorCookie) {
      return NextResponse.json({ success: true, galleries: [] });
    }

    const cookieHash = hashCookie(creatorCookie);
    const url = new URL(req.url);
    const galleryId = url.searchParams.get('id');

    if (galleryId) {
      const g = await db.getGallery(galleryId);
      if (!g || g.creator_cookie_hash !== cookieHash) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }
      const images = await db.getGalleryImages(g.id);
      return NextResponse.json({ success: true, gallery: { ...g, images } });
    }

    // List all owner galleries
    const galleries = await db.getGalleriesByCreator(cookieHash);
    return NextResponse.json({ success: true, galleries });
  } catch (err: any) {
    console.error('Gallery GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Initiates cascade removal with Admin Escalation and Secure Revoke safeguards
export async function DELETE(req: NextRequest) {
  try {
    const creatorCookie = req.cookies.get('oneview_creator')?.value;
    if (!creatorCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing owner authorization' }, { status: 401 });
    }

    const cookieHash = hashCookie(creatorCookie);
    const body = await req.json();
    const { galleryId } = body;

    if (!galleryId) {
      return NextResponse.json({ success: false, error: 'Gallery ID required' }, { status: 400 });
    }

    const success = await db.deleteGallery(galleryId, cookieHash);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Gallery not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Vault permanently purged and links revoked' });
  } catch (err: any) {
    console.error('Gallery DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
