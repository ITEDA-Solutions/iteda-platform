import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

export const dynamic = 'force-dynamic';

// Map legacy table names to actual Supabase table names
const tableNameMap: Record<string, string> = {
  // Legacy mappings
  'users': 'profiles',
  'user_roles': 'staff_roles',
  'dryer_owners': 'dryer_owners',
  'staff': 'profiles',
  // Direct table names
  'profiles': 'profiles',
  'staff_roles': 'staff_roles',
  'farmers': 'dryer_owners',
  'regions': 'regions',
  'dryers': 'dryers',
  'presets': 'presets',
  'sensor_readings': 'sensor_readings',
  'alerts': 'alerts',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    const tableName = tableNameMap[table];

    if (!tableName) {
      return NextResponse.json(
        { error: `Table ${table} not found` },
        { status: 404 }
      );
    }

    const supabase = getSupabaseAdmin();

    // For now, return basic select all
    // In a real implementation, you'd parse query parameters for filtering
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: error.message || 'Database query failed' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    const tableName = tableNameMap[table];

    if (!tableName) {
      return NextResponse.json(
        { error: `Table ${table} not found` },
        { status: 404 }
      );
    }

    const { values } = await request.json();

    const supabase = getSupabaseAdmin();

    // Basic insert - in a real implementation, you'd handle this more robustly
    const { data, error } = await supabase
      .from(tableName)
      .insert(values)
      .select();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        { error: 'Database insert failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Database insert error:', error);
    return NextResponse.json(
      { error: error.message || 'Database insert failed' },
      { status: 500 }
    );
  }
}
