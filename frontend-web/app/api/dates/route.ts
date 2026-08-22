import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { getAdminClient, isMissingTableError } from '@/lib/supabase-admin';
import {
  expandRecurring,
  invitationsAsDates,
  mergeCoupleDates,
  occasionDatesForRange,
  visitsAsDates,
} from '@/lib/couple-dates';
import { CoupleDateKind } from '@/types';

function monthRange(year: number, month: number) {
  const from = new Date(year, month - 1, 1, 12);
  const to = new Date(year, month, 0, 12);
  return { from, to };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = Number(searchParams.get('year') || now.getFullYear());
    const month = Number(searchParams.get('month') || now.getMonth() + 1);
    const { from, to } = monthRange(year, month);

    // Pad range so recurring yearly dates near edges still show.
    const paddedFrom = new Date(from);
    paddedFrom.setMonth(paddedFrom.getMonth() - 1);
    const paddedTo = new Date(to);
    paddedTo.setMonth(paddedTo.getMonth() + 1);

    const [customRes, visitsRes, invitesRes, connectionsRes] = await Promise.all([
      supabase
        .from('couple_dates')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
      supabase
        .from('visits')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
      supabase
        .from('invitations')
        .select('*')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`),
      supabase
        .from('connections')
        .select('id, user1_id, user2_id, status')
        .eq('status', 'accepted')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
    ]);

    const custom = customRes.error && isMissingTableError(customRes.error) ? [] : customRes.data || [];
    const visits = visitsRes.error && isMissingTableError(visitsRes.error) ? [] : visitsRes.data || [];
    const invites = invitesRes.error && isMissingTableError(invitesRes.error) ? [] : invitesRes.data || [];
    const connections =
      connectionsRes.error && isMissingTableError(connectionsRes.error) ? [] : connectionsRes.data || [];

    const partnerIds = connections.map((row) => (row.user1_id === user.id ? row.user2_id : row.user1_id));

    const customMapped = expandRecurring(
      (custom || []).map((row) => ({ ...row, source: 'custom' as const })),
      paddedFrom,
      paddedTo
    );

    const merged = mergeCoupleDates([
      customMapped,
      visitsAsDates(visits || [], user.id),
      invitationsAsDates(invites || []),
      occasionDatesForRange(paddedFrom, paddedTo),
    ]);

    const inMonth = merged.filter((item) => {
      const [y, m] = item.date.split('-').map(Number);
      return y === year && m === month;
    });

    return NextResponse.json({
      year,
      month,
      partnerIds,
      dates: inMonth,
      upcoming: merged
        .filter((item) => item.date >= new Date().toISOString().slice(0, 10))
        .slice(0, 10),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('token')) {
      return unauthorized();
    }
    console.error('Couple dates GET error:', error);
    return NextResponse.json({ error: 'Failed to load calendar' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const supabase = getAdminClient();
    const body = await request.json();

    const title = String(body.title || '').trim();
    const date = String(body.date || '').trim();
    const kind = String(body.kind || 'custom') as CoupleDateKind;
    const notes = body.notes ? String(body.notes).trim() : null;
    const endDate = body.end_date ? String(body.end_date).trim() : null;
    const recurring = Boolean(body.recurring_yearly);
    const partnerId = body.partner_id ? String(body.partner_id) : null;

    if (!title || !date) {
      return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
    }

    const allowed: CoupleDateKind[] = [
      'anniversary',
      'birthday',
      'first-met',
      'visit',
      'occasion',
      'custom',
    ];
    if (!allowed.includes(kind)) {
      return NextResponse.json({ error: 'Unknown date kind' }, { status: 400 });
    }

    const user1 = partnerId && partnerId < user.id ? partnerId : user.id;
    const user2 = partnerId && partnerId < user.id ? user.id : partnerId;

    const { data, error } = await supabase
      .from('couple_dates')
      .insert({
        user1_id: user1,
        user2_id: user2,
        title,
        date,
        end_date: endDate,
        kind,
        notes,
        recurring_yearly: recurring,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json(
          {
            error:
              'Calendar table is missing. Run backend/database/couple_dates.sql in Supabase, then try again.',
          },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ ...data, source: 'custom' });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('token')) {
      return unauthorized();
    }
    console.error('Couple dates POST error:', error);
    return NextResponse.json({ error: 'Failed to save date' }, { status: 500 });
  }
}
