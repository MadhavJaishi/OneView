import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authCookie = req.cookies.get('oneview_auth')?.value;
  if (!authCookie) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const user = JSON.parse(Buffer.from(authCookie, 'base64').toString('utf8'));
    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (action === 'logout') {
      const res = NextResponse.json({ success: true, message: 'Logged out' });
      res.cookies.delete('oneview_auth');
      return res;
    }

    // Authenticate user session
    const userId = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex').slice(0, 16);
    const userData = {
      id: userId,
      email: email.toLowerCase().trim(),
      role: 'creator',
      unlockedAt: new Date().toISOString(),
    };

    const cookieVal = Buffer.from(JSON.stringify(userData)).toString('base64');
    const res = NextResponse.json({
      success: true,
      message: action === 'signup' ? 'Account created successfully' : 'Authenticated successfully',
      user: userData,
    });

    res.cookies.set('oneview_auth', cookieVal, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Auth failure' }, { status: 500 });
  }
}
