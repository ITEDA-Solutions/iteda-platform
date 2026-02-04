import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-db';
import { requireAdminLevel } from '@/lib/rbac-middleware';

export const dynamic = 'force-dynamic';

// Delete dryer assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only admins and super admins can remove assignments
    const { user: currentUser, error } = await requireAdminLevel(request);
    if (error) return error;

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Check if assignment exists
    const { data: existingAssignment, error: fetchError } = await supabase
      .from('dryer_assignments')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Delete assignment
    const { error: deleteError } = await supabase
      .from('dryer_assignments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting assignment:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete assignment', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting dryer assignment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete dryer assignment' },
      { status: 500 }
    );
  }
}
