import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase-admin';
import { computeFreeWindows } from '@/lib/availability';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const user = await getUserFromToken(request);
    const { partnerId } = await params;
    const supabase = getAdminClient();

    const [{ data: mySchedule }, { data: partnerSchedule }] = await Promise.all([
      supabase.from('schedules').select('*').eq('user_id', user.id),
      supabase.from('schedules').select('*').eq('user_id', partnerId),
    ]);

    const mine = mySchedule || [];
    const theirs = partnerSchedule || [];

    return NextResponse.json({
      mySchedule: mine,
      partnerSchedule: theirs,
      windows: computeFreeWindows(mine, theirs),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch mutual availability';
    if (message.includes('token')) return unauthorized();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
