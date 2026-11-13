import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const subpath = url.searchParams.get('path') || '';

    if (!token) {
      return new NextResponse('Missing access token', { status: 400 });
    }

    // 1. Validate token
    const shareLink = await db.getShareLinkByToken(token);
    if (!shareLink || shareLink.revoked) {
      return new NextResponse('Tunnel revoked or invalid', { status: 403 });
    }

    const now = new Date();
    if (now > new Date(shareLink.expires_at)) {
      return new NextResponse('Tunnel expired', { status: 410 });
    }

    // 2. Fetch gallery proxy target
    const gallery = await db.getGallery(shareLink.gallery_id);
    if (!gallery || gallery.is_deleted || gallery.type !== 'proxy' || !gallery.proxy_target_url) {
      return new NextResponse('Proxy configuration invalid or target not found', { status: 404 });
    }

    // Calculate upstream URL
    let targetBase = gallery.proxy_target_url.trim();
    if (!targetBase.startsWith('http://') && !targetBase.startsWith('https://')) {
      targetBase = 'https://' + targetBase;
    }

    let upstreamUrl: URL;
    try {
      upstreamUrl = new URL(subpath, targetBase);
    } catch {
      upstreamUrl = new URL(targetBase);
    }

    // Fetch upstream resource securely from server-side backchannel
    const upstreamRes = await fetch(upstreamUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OneViewProxy/1.0',
        'Accept': req.headers.get('accept') || '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    const contentType = upstreamRes.headers.get('content-type') || 'text/html';
    const isHtml = contentType.includes('text/html');

    if (!isHtml) {
      // Stream raw asset (CSS, JS, images, fonts)
      const data = await upstreamRes.arrayBuffer();
      return new NextResponse(data, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    // Rewrite HTML to strip frame-busting headers, inject watermarking overlay, and rewrite base href
    let html = await upstreamRes.text();

    // Inject base tag for relative asset loading
    const originHost = upstreamUrl.origin;
    const baseTag = `<base href="${originHost}/" />`;
    
    // Watermark & Anti-tamper script injected into proxy frame
    const antiTamperScript = `
      <script>
        (function() {
          // Disable context menu
          document.addEventListener('contextmenu', function(e) { e.preventDefault(); }, true);
          // Block inspect keys
          document.addEventListener('keydown', function(e) {
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.metaKey && e.altKey && e.key === 'I')) {
              e.preventDefault();
              e.stopPropagation();
            }
          }, true);
        })();
      </script>
    `;

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${baseTag}${antiTamperScript}`);
    } else {
      html = baseTag + antiTamperScript + html;
    }

    return new NextResponse(html, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        // Strip anti-iframe restrictions
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors 'self' *",
      },
    });
  } catch (err: any) {
    console.error('Proxy error:', err);
    return new NextResponse(`Proxy error: ${err.message}`, { status: 502 });
  }
}
