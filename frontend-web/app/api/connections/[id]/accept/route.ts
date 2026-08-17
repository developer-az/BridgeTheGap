import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase-admin';

// PUT /api/connections/:id/accept
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getAdminClient();
    await getUserFromToken(request);
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error accepting connection:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

