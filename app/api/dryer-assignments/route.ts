import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';
import { requireAdminLevel } from '@/lib/rbac-middleware';

export const dynamic = 'force-dynamic';

// Get all dryer assignments
export async function GET(request: NextRequest) {
  try {
    // Only admins and super admins can view all assignments
    const { user: currentUser, error } = await requireAdminLevel(request);
    if (error) return error;

    const supabase = getSupabaseAdmin();

    const { data: assignments, error: dbError } = await supabase
      .from('dryer_assignments')
      .select(`
        id,
        technician_id,
        dryer_id,
        assigned_at,
        assigned_by,
        notes,
        technician:profiles!dryer_assignments_technician_id_fkey(full_name, email),
        dryer:dryers(serial_number, status)
      `)
      .order('assigned_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching dryer assignments:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch dryer assignments', details: dbError.message },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend consistency
    const transformedAssignments = assignments?.map(a => {
      // Supabase returns joined data - handle both array and object cases
      const tech = Array.isArray(a.technician) ? a.technician[0] : a.technician;
      const dry = Array.isArray(a.dryer) ? a.dryer[0] : a.dryer;
      return {
        id: a.id,
        technicianId: a.technician_id,
        dryerId: a.dryer_id,
        assignedAt: a.assigned_at,
        assignedBy: a.assigned_by,
        notes: a.notes,
        technicianName: tech?.full_name || null,
        technicianEmail: tech?.email || null,
        dryerSerialNumber: dry?.serial_number || null,
        dryerStatus: dry?.status || null,
      };
    }) || [];

    return NextResponse.json(transformedAssignments);
  } catch (error: any) {
    console.error('Error fetching dryer assignments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dryer assignments' },
      { status: 500 }
    );
  }
}

// Create new dryer assignment
export async function POST(request: NextRequest) {
  try {
    // Only admins and super admins can assign dryers
    const { user: currentUser, error } = await requireAdminLevel(request);
    if (error) return error;

    const { technicianId, dryerId, notes } = await request.json();

    if (!technicianId || !dryerId) {
      return NextResponse.json(
        { error: 'Technician ID and Dryer ID are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if technician exists
    const { data: technician, error: techError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', technicianId)
      .maybeSingle();

    if (techError || !technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    // Check if dryer exists
    const { data: dryer, error: dryerError } = await supabase
      .from('dryers')
      .select('id')
      .eq('id', dryerId)
      .maybeSingle();

    if (dryerError || !dryer) {
      return NextResponse.json({ error: 'Dryer not found' }, { status: 404 });
    }

    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('dryer_assignments')
      .select('id')
      .eq('technician_id', technicianId)
      .eq('dryer_id', dryerId)
      .maybeSingle();

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'This dryer is already assigned to this technician' },
        { status: 400 }
      );
    }

    // Create assignment
    const { data: assignment, error: insertError } = await supabase
      .from('dryer_assignments')
      .insert({
        technician_id: technicianId,
        dryer_id: dryerId,
        assigned_by: currentUser.id,
        notes,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating assignment:', insertError);
      return NextResponse.json(
        { error: 'Failed to create assignment', details: insertError.message },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformedAssignment = {
      id: assignment.id,
      technicianId: assignment.technician_id,
      dryerId: assignment.dryer_id,
      assignedAt: assignment.assigned_at,
      assignedBy: assignment.assigned_by,
      notes: assignment.notes,
    };

    return NextResponse.json(transformedAssignment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating dryer assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create dryer assignment' },
      { status: 500 }
    );
  }
}
