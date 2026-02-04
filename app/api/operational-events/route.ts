import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

interface OperationalEventPayload {
  dryer_id: string;
  event_type: 'heater_on' | 'heater_off' | 'fan_on' | 'fan_off' | 'door_open' | 'door_close';
  timestamp?: string;
  previous_state?: boolean;
  new_state?: boolean;
  triggered_by?: 'manual' | 'automatic' | 'preset' | 'alert';
  notes?: string;
}

// POST - Record operational event
export async function POST(request: NextRequest) {
  try {
    const payload: OperationalEventPayload = await request.json();

    // Validate required fields
    if (!payload.dryer_id || !payload.event_type) {
      return NextResponse.json(
        { error: 'dryer_id and event_type are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify dryer exists
    const { data: dryer, error: dryerError } = await supabase
      .from('dryers')
      .select('id')
      .eq('dryer_id', payload.dryer_id)
      .single();

    if (dryerError || !dryer) {
      return NextResponse.json(
        { error: 'Dryer not found' },
        { status: 404 }
      );
    }

    // Prepare event data
    const eventData = {
      dryer_id: dryer.id,
      event_type: payload.event_type,
      timestamp: payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString(),
      previous_state: payload.previous_state,
      new_state: payload.new_state,
      triggered_by: payload.triggered_by || 'automatic',
      notes: payload.notes,
    };

    // Insert operational event
    const { data: event, error: insertError } = await supabase
      .from('operational_events')
      .insert([eventData])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting operational event:', insertError);
      return NextResponse.json(
        { error: 'Failed to store operational event', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event_id: event.id,
      timestamp: event.timestamp,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Operational event endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Retrieve operational events for a dryer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dryerId = searchParams.get('dryer_id');
    const eventType = searchParams.get('event_type');
    const limit = parseInt(searchParams.get('limit') || '100');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!dryerId) {
      return NextResponse.json(
        { error: 'dryer_id parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Get dryer UUID
    const { data: dryer, error: dryerError } = await supabase
      .from('dryers')
      .select('id')
      .eq('dryer_id', dryerId)
      .single();

    if (dryerError || !dryer) {
      return NextResponse.json(
        { error: 'Dryer not found' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('operational_events')
      .select('*')
      .eq('dryer_id', dryer.id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    // Add filters
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      return NextResponse.json(
        { error: 'Failed to retrieve operational events', details: eventsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      dryer_id: dryerId,
      count: events?.length || 0,
      events: events || [],
    });

  } catch (error: any) {
    console.error('Operational events retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
