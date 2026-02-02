import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT - Dismiss alert (for false positives)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { dismissed_by, dismissal_reason } = body;

    if (!dismissal_reason) {
      return NextResponse.json(
        { error: 'dismissal_reason is required' },
        { status: 400 }
      );
    }

    // Get the alert to find the dryer
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('dryer_id, status')
      .eq('id', params.id)
      .single();

    if (alertError || !alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Update alert status to dismissed
    const { data, error } = await supabase
      .from('alerts')
      .update({
        status: 'dismissed',
        dismissed_by,
        dismissed_at: new Date().toISOString(),
        dismissal_reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    // Decrement dryer's active alert count if alert was active
    if (alert.status === 'active' && alert.dryer_id) {
      await supabase.rpc('decrement_dryer_alert_count', {
        dryer_uuid: alert.dryer_id,
      });
    }

    return NextResponse.json(
      { success: true, alert: data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error dismissing alert:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss alert', details: error.message },
      { status: 500 }
    );
  }
}
