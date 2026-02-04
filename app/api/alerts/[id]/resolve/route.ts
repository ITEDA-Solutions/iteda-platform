import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

// PUT - Resolve alert
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { resolved_by, resolution_notes } = body;

    const supabase = getSupabaseAdmin();

    // Get the alert to find the dryer
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('dryer_id, status')
      .eq('id', id)
      .single();

    if (alertError || !alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Update alert status to resolved
    const { data, error } = await supabase
      .from('alerts')
      .update({
        status: 'resolved',
        resolved_by,
        resolved_at: new Date().toISOString(),
        resolution_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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
    console.error('Error resolving alert:', error);
    return NextResponse.json(
      { error: 'Failed to resolve alert', details: error.message },
      { status: 500 }
    );
  }
}
