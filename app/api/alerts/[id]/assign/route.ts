import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

// POST - Assign alert to technician
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { assigned_to, assigned_by, notes } = body;

    if (!assigned_to) {
      return NextResponse.json(
        { error: 'assigned_to is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify the alert exists
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('id, status')
      .eq('id', id)
      .single();

    if (alertError || !alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Update alert with assignment
    const { data, error } = await supabase
      .from('alerts')
      .update({
        assigned_to,
        assigned_by,
        assigned_at: new Date().toISOString(),
        status: alert.status === 'active' ? 'acknowledged' : alert.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Optionally create an assignment record in a separate table
    // This could be useful for tracking assignment history

    return NextResponse.json(
      { success: true, alert: data },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error assigning alert:', error);
    return NextResponse.json(
      { error: 'Failed to assign alert', details: error.message },
      { status: 500 }
    );
  }
}
