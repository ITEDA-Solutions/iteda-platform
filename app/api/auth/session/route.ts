import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ session: null });
    }

    const user = await AuthService.verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({
      user,
      token,
    });
  } catch (error: any) {
    console.error('Session error:', error);
    return NextResponse.json({ session: null });
  }
}
