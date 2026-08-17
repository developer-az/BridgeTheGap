import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { getAdminClient, isMissingTableError } from '@/lib/supabase-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    const { id } = await params;
    const body = await request.json();
    const allowed = ['status', 'start_date', 'end_date', 'traveler_id', 'note', 'travel_plan_id'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('visits')
      .update(updates)
      .eq('id', id)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ error: 'Visits are not available yet' }, { status: 503 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update visit';
    if (message.includes('token')) return unauthorized();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    const { id } = await params;
    const supabase = getAdminClient();
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', id)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (error) {
      if (isMissingTableError(error)) return NextResponse.json({ success: true });
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete visit';
    if (message.includes('token')) return unauthorized();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
