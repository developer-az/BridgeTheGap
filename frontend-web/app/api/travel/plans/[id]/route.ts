import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase-admin';

// DELETE /api/travel/plans/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getAdminClient();
    const user = await getUserFromToken(request);
    const { id } = await params;
    
    const { error } = await supabase
      .from('travel_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting travel plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

