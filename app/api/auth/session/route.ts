import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServiceClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ session: null }, { status: 401 });
    }

    const supabase = getServiceClient();

    // Verify the token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ session: null }, { status: 401 });
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, staff_roles(role, region)')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || user.user_metadata?.full_name,
        role: profile?.staff_roles?.role,
        region: profile?.staff_roles?.region,
      },
      token,
    });
  } catch (error: any) {
    console.error('Session error:', error);
    return NextResponse.json({ session: null }, { status: 500 });
  }
}
