import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Valid table names for security (users table is now managed by Supabase Auth)
const validTables = [
  'profiles',
  'user_roles',
  'regions',
  'dryer_owners',
  'dryers',
  'presets',
  'sensor_readings',
  'alerts',
] as const;

type ValidTable = typeof validTables[number];

function isValidTable(table: string): table is ValidTable {
  return validTables.includes(table as ValidTable);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { table: string } }
) {
  try {
    const { table } = params;

    if (!isValidTable(table)) {
      return NextResponse.json(
        { error: `Table ${table} not found` },
        { status: 404 }
      );
    }

    // Get all records from the table
    const { data, error } = await supabaseAdmin
      .from(table as 'profiles')
      .select('*');

    if (error) {
      throw new Error(error.message);
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
  { params }: { params: { table: string } }
) {
  try {
    const { table } = params;

    if (!isValidTable(table)) {
      return NextResponse.json(
        { error: `Table ${table} not found` },
        { status: 404 }
      );
    }

    const { values } = await request.json();

    // Insert record into the table
    const { data, error } = await supabaseAdmin
      .from(table as 'profiles')
      .insert(values as any)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Database insert error:', error);
    return NextResponse.json(
      { error: error.message || 'Database insert failed' },
      { status: 500 }
    );
  }
}
