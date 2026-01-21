import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
import {
  staff,
  profiles,
  staffRoles,
  regions,
  farmers,
  dryers,
  presets,
  sensorReadings,
  alerts
} from '@/lib/schema';

// Map table names to schema objects
const tableMap: Record<string, any> = {
  // New names
  staff,
  staff_roles: staffRoles,
  farmers,

  // Legacy mappings for backward compatibility
  users: staff,
  user_roles: staffRoles,
  dryer_owners: farmers,

  // Existing tables
  profiles,
  regions,
  dryers,
  presets,
  sensor_readings: sensorReadings,
  alerts,
};

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  try {
    const { table } = params;
    const tableSchema = tableMap[table];

    if (!tableSchema) {
      return NextResponse.json(
        { error: `Table ${table} not found` },
        { status: 404 }
      );
    }

    // For now, return basic select all
    // In a real implementation, you'd parse query parameters for filtering
    const result = await db.select().from(tableSchema);

    return NextResponse.json(result);
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
    const tableSchema = tableMap[table];

    if (!tableSchema) {
      return NextResponse.json(
        { error: `Table ${table} not found` },
        { status: 404 }
      );
    }

    const { values } = await request.json();

    // Basic insert - in a real implementation, you'd handle this more robustly
    const result = await db.insert(tableSchema).values(values).returning();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Database insert error:', error);
    return NextResponse.json(
      { error: error.message || 'Database insert failed' },
      { status: 500 }
    );
  }
}
