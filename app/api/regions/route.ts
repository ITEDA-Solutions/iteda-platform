import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
import { regions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, requireSuperAdmin } from '@/lib/rbac-middleware';

// GET - List all regions (all authenticated users can view)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const allRegions = await db
      .select({
        id: regions.id,
        name: regions.name,
        code: regions.code,
        createdAt: regions.createdAt,
      })
      .from(regions)
      .orderBy(regions.name);

    return NextResponse.json(allRegions);
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

    // Check if region already exists
    const existing = await db
      .select()
      .from(regions)
      .where(eq(regions.code, code))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Region with this code already exists' },
        { status: 400 }
      );
    }

    // Create region
    const [newRegion] = await db
      .insert(regions)
      .values({ name, code })
      .returning();

    return NextResponse.json(newRegion, { status: 201 });
  } catch (error: any) {
    console.error('Error creating region:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create region' },
      { status: 500 }
    );
  }
}
