import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { getAdminClient, isMissingTableError } from '@/lib/supabase-admin';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    const { id: rawId } = await context.params;
    const idMatch = String(rawId || '').match(
      /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-\d{4})?$/i
    );
    const id = idMatch?.[1];
    if (!id) {
      return NextResponse.json({ error: 'That date cannot be removed from here' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { error } = await supabase
      .from('couple_dates')
      .delete()
      .eq('id', id)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ error: 'Calendar table is missing' }, { status: 503 });
      }
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('token')) {
      return unauthorized();
    }
    console.error('Couple dates DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete date' }, { status: 500 });
  }
}
