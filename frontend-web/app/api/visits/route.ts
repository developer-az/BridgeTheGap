import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { getAdminClient, isMissingTableError } from '@/lib/supabase-admin';

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('start_date', { ascending: true });

    if (error) {
      if (isMissingTableError(error)) return NextResponse.json([]);
      throw error;
    }

    const visits = await Promise.all(
      (data || []).map(async (visit) => {
        const partnerId = visit.user1_id === user.id ? visit.user2_id : visit.user1_id;
        const { data: partner } = await supabase
          .from('users')
          .select('id, email, name, location_city, location_state, university_name')
          .eq('id', partnerId)
          .maybeSingle();
        const traveler =
          visit.traveler_id === user.id
            ? { id: user.id, name: 'You' }
            : visit.traveler_id
              ? partner
              : null;
        return { ...visit, partner, traveler };
      })
    );

    return NextResponse.json(visits);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load visits';
    if (message.includes('token')) return unauthorized();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const body = await request.json();
    const { partner_id, start_date, end_date, traveler_id, travel_plan_id, note, status } = body;

    if (!partner_id || !start_date) {
      return NextResponse.json({ error: 'Partner and start date are required' }, { status: 400 });
    }

    const [user1_id, user2_id] = orderedPair(user.id, partner_id);
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('visits')
      .insert({
        user1_id,
        user2_id,
        start_date,
        end_date: end_date || null,
        traveler_id: traveler_id || user.id,
        travel_plan_id: travel_plan_id || null,
        note: note || null,
        status: status || 'proposed',
      })
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json(
          { error: 'Visits need the maison database update. Run backend/database/maison_revamp.sql in Supabase.' },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create visit';
    if (message.includes('token')) return unauthorized();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
