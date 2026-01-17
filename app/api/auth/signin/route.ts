import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const session = await AuthService.signIn(email, password);

    // Get user roles
    const roles = await AuthService.getUserRoles(session.user.id);

    return NextResponse.json({
      session,
      user: {
        ...session.user,
        roles,
      },
      token: session.accessToken, // For backward compatibility
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  } catch (error: any) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: error.message || 'Invalid credentials' },
      { status: 401 }
    );
  }
}
