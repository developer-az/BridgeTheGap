import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { getAdminClient, isMissingTableError } from '@/lib/supabase-admin';
import { getOccasion } from '@/lib/occasions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.status) updates.status = body.status;
    if (body.opened) updates.opened_at = new Date().toISOString();
    if (body.proposed_date) updates.proposed_date = body.proposed_date;
    if (body.body) updates.body = body.body;

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('invitations')
      .update(updates)
      .eq('id', id)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) return NextResponse.json({ error: 'Letters are not available yet' }, { status: 503 });
      throw error;
    }

    return NextResponse.json({ ...data, occasion: getOccasion(data.occasion_slug) || null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update letter';
    if (message.includes('token')) return unauthorized();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
