import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', role: null },
        { status: 400 }
      );
    }

    console.log('[user-role API] Fetching role for user:', userId);

    // Use admin client to bypass RLS and get user role
    const supabaseAdmin = getSupabaseAdmin();
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('staff_roles')
      .select('role, region')
      .eq('staff_id', userId)
      .maybeSingle();

    if (roleError) {
      console.error('[user-role API] Error fetching user role from DB:', roleError);
      return NextResponse.json(
        { error: 'Failed to fetch role', details: roleError, role: null },
        { status: 500 }
      );
    }

    if (!roleData) {
      console.log('[user-role API] No role found for user:', userId);
      return NextResponse.json(
        { role: null, region: null, message: 'No role assigned' },
        { status: 200 }
      );
    }

    console.log('[user-role API] Role found:', roleData);
    return NextResponse.json(
      {
        role: roleData.role,
        region: roleData.region,
        userId: userId
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[user-role API] Error in user-role endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message, role: null },
      { status: 500 }
    );
  }
}
