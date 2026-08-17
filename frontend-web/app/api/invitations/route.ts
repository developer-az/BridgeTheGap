import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { getAdminClient, isMissingTableError } from '@/lib/supabase-admin';
import { getOccasion } from '@/lib/occasions';

function pairFilter(userId: string) {
  return `from_user_id.eq.${userId},to_user_id.eq.${userId}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .or(pairFilter(user.id))
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error)) return NextResponse.json([]);
      throw error;
    }

    const invitations = await Promise.all(
      (data || []).map(async (invite) => {
        const otherId = invite.from_user_id === user.id ? invite.to_user_id : invite.from_user_id;
        const { data: other } = await supabase
          .from('users')
          .select('id, email, name, university_name, location_city, location_state, public_id')
          .eq('id', otherId)
          .maybeSingle();

        return {
          ...invite,
          occasion: getOccasion(invite.occasion_slug) || null,
          from_user: invite.from_user_id === user.id ? undefined : other,
          to_user: invite.to_user_id === user.id ? undefined : other,
        };
      })
    );

    return NextResponse.json(invitations);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load letters';
    if (message.includes('token')) return unauthorized();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const body = await request.json();
    const { to_user_id, occasion_slug, proposed_date, body: letterBody } = body;

    if (!to_user_id || !occasion_slug || !proposed_date) {
      return NextResponse.json(
        { error: 'Partner, occasion, and date are required' },
        { status: 400 }
      );
    }

    const occasion = getOccasion(occasion_slug);
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        from_user_id: user.id,
        to_user_id,
        occasion_slug,
        proposed_date,
        body: letterBody || occasion?.letterBody || '',
        status: 'sent',
      })
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json(
          { error: 'Letters need the maison database update. Run backend/database/maison_revamp.sql in Supabase.' },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ ...data, occasion: occasion || null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send letter';
    if (message.includes('token')) return unauthorized();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
