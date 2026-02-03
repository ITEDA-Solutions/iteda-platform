import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';
import { verifyAuth } from '@/lib/supabase-auth';

// GET - Fetch all staff roles from Supabase (admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication - only admins can view all staff roles
    const { user, error: authError } = await verifyAuth(request);
    if (authError) return authError;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin and admin can view all staff roles
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: roles, error } = await supabase
      .from('staff_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff roles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch staff roles', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: roles?.length || 0,
      roles: roles || [],
    });

  } catch (error: any) {
    console.error('Staff roles fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
