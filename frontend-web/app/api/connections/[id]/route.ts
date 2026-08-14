import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase-admin';

// DELETE /api/connections/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getAdminClient();
    await getUserFromToken(request);
    const { id } = await params;
    
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting connection:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

