import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Use service role to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    // Get the access token from the Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      // Try to get session from cookies
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('sb-access-token')?.value || 
                         cookieStore.get('supabase-auth-token')?.value;
      
      if (!accessToken) {
        return NextResponse.json(
          { error: 'Not authenticated - no token found', role: null },
          { status: 401 }
        );
      }
    }

    // Use admin client to get user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token || '');

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated - invalid token', role: null },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Use admin client to bypass RLS and get user role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('staff_roles')
      .select('role, region')
      .eq('staff_id', userId)
      .maybeSingle();

    if (roleError) {
      console.error('Error fetching user role from DB:', roleError);
      return NextResponse.json(
        { error: 'Failed to fetch role', details: roleError, role: null },
        { status: 500 }
      );
    }

    if (!roleData) {
      return NextResponse.json(
        { role: null, region: null, message: 'No role assigned' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        role: roleData.role, 
        region: roleData.region,
        userId: userId 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in user-role endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message, role: null },
      { status: 500 }
    );
  }
}
