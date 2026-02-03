import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';
import { requireAuth, requireSuperAdmin } from '@/lib/rbac-middleware';

export const dynamic = 'force-dynamic';

// GET - List all regions (all authenticated users can view)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const supabase = getSupabaseAdmin();
    const { data: allRegions, error: dbError } = await supabase
      .from('regions')
      .select('id, name, code, created_at')
      .order('name', { ascending: true });

    if (dbError) {
      console.error('Error fetching regions:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch regions', details: dbError.message },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend consistency
    const transformedRegions = allRegions?.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      createdAt: r.created_at,
    })) || [];

    return NextResponse.json(transformedRegions);
  } catch (error: any) {
    console.error('Error fetching regions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch regions' },
      { status: 500 }
    );
  }
}

// POST - Create new region (super admin only)
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireSuperAdmin(request);
    if (error) return error;

    const { name, code } = await request.json();

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if region already exists
    const { data: existing } = await supabase
      .from('regions')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Region with this code already exists' },
        { status: 400 }
      );
    }

    // Create region
    const { data: newRegion, error: insertError } = await supabase
      .from('regions')
      .insert({ name, code })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating region:', insertError);
      return NextResponse.json(
        { error: 'Failed to create region', details: insertError.message },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformedRegion = {
      id: newRegion.id,
      name: newRegion.name,
      code: newRegion.code,
      createdAt: newRegion.created_at,
    };

    return NextResponse.json(transformedRegion, { status: 201 });
  } catch (error: any) {
    console.error('Error creating region:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create region' },
      { status: 500 }
    );
  }
}
