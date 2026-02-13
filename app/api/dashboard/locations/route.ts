import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data, error } = await supabaseAdmin
      .from('dryers')
      .select(`
        id,
        dryer_id,
        location_latitude,
        location_longitude,
        location_address,
        status,
        region_id
      `)
      .not('location_latitude', 'is', null)
      .not('location_longitude', 'is', null);

    if (error) {
      console.error('[dashboard-locations] Error fetching locations:', error);
      return NextResponse.json({ locations: [] }, { status: 200 });
    }

    if (data && data.length > 0) {
      // Fetch region names
      const uniqueRegionIds = data.map(d => d.region_id).filter(Boolean);
      const regionIds = Array.from(new Set(uniqueRegionIds));
      const { data: regionsData } = await supabaseAdmin
        .from('regions')
        .select('id, name')
        .in('id', regionIds);

      const locations = data.map(d => {
        const region = regionsData?.find(r => r.id === d.region_id);
        return {
          id: d.id,
          dryer_id: d.dryer_id,
          location_latitude: d.location_latitude,
          location_longitude: d.location_longitude,
          location_address: d.location_address,
          status: d.status,
          region_name: region?.name || 'Unknown'
        };
      });

      return NextResponse.json({ locations }, { status: 200 });
    }

    return NextResponse.json({ locations: [] }, { status: 200 });
  } catch (error: any) {
    console.error('[dashboard-locations] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations', details: error.message },
      { status: 500 }
    );
  }
}
