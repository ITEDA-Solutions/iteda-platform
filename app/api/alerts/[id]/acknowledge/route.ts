import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { alerts, dryers } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

interface RouteContext {
  params: {
    id: string;
  };
}

// PUT - Acknowledge an alert
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId, notes } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get the alert
    const existingAlert = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, id))
      .limit(1);

    if (existingAlert.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    const alert = existingAlert[0];

    // Update alert status
    const updatedAlert = await db
      .update(alerts)
      .set({
        status: 'acknowledged',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, id))
      .returning();

    // Decrement dryer alert count if alert was active
    if (alert.status === 'active') {
      await db
        .update(dryers)
        .set({
          activeAlertsCount: sql`GREATEST(0, ${dryers.activeAlertsCount} - 1)`,
          updatedAt: new Date(),
        })
        .where(eq(dryers.id, alert.dryerId));
    }

    return NextResponse.json({
      success: true,
      alert: updatedAlert[0],
    });

  } catch (error: any) {
    console.error('Alert acknowledgment error:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Dismiss an alert
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;

    // Get the alert
    const existingAlert = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, id))
      .limit(1);

    if (existingAlert.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    const alert = existingAlert[0];

    // Update alert status to dismissed
    await db
      .update(alerts)
      .set({
        status: 'dismissed',
        updatedAt: new Date(),
      })
      .where(eq(alerts.id, id));

    // Decrement dryer alert count if alert was active
    if (alert.status === 'active') {
      await db
        .update(dryers)
        .set({
          activeAlertsCount: sql`GREATEST(0, ${dryers.activeAlertsCount} - 1)`,
          updatedAt: new Date(),
        })
        .where(eq(dryers.id, alert.dryerId));
    }

    return NextResponse.json({
      success: true,
      message: 'Alert dismissed',
    });

  } catch (error: any) {
    console.error('Alert dismissal error:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss alert', details: error.message },
      { status: 500 }
    );
  }
}
