import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase-admin';

// PUT /api/schedule/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getAdminClient();
    const user = await getUserFromToken(request);
    const { id } = await params;
    const body = await request.json();
    const { day_of_week, start_time, end_time, title, type } = body;

    const { data, error } = await supabase
      .from('schedules')
      .update({
        day_of_week,
        start_time,
        end_time,
        title,
        type,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating schedule entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/schedule/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getAdminClient();
    const user = await getUserFromToken(request);
    const { id } = await params;
    
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting schedule entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

