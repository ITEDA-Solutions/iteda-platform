import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

// PUT - Acknowledge an alert
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, notes } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get the alert
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (alertError || !alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Update alert status
    const { data: updatedAlert, error: updateError } = await supabase
      .from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Decrement dryer alert count if alert was active
    if (alert.status === 'active' && alert.dryer_id) {
      await supabase.rpc('decrement_dryer_alert_count', {
        dryer_uuid: alert.dryer_id,
      });
    }

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Get the alert
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (alertError || !alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Update alert status to dismissed
    const { error: updateError } = await supabase
      .from('alerts')
      .update({
        status: 'dismissed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Decrement dryer alert count if alert was active
    if (alert.status === 'active' && alert.dryer_id) {
      await supabase.rpc('decrement_dryer_alert_count', {
        dryer_uuid: alert.dryer_id,
      });
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
