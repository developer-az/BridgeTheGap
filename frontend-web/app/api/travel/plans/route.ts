import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, unauthorized } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('travel_plans')
      .select('*')
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch travel plans';
    if (message.includes('token')) return unauthorized();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const body = await request.json();
    const { origin, destination, travel_date, return_date, saved_routes, partner_id } = body;

    if (!origin || !destination || !travel_date) {
      return NextResponse.json({ error: 'Origin, destination, and date are required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const insert: Record<string, unknown> = {
      user_id: user.id,
      origin,
      destination,
      travel_date,
      return_date: return_date || null,
      saved_routes: saved_routes || null,
    };

    if (partner_id) insert.partner_id = partner_id;

    const { data, error } = await supabase.from('travel_plans').insert(insert).select().single();

    if (error) {
      if (partner_id && (error.message || '').includes('partner_id')) {
        const retry = await supabase
          .from('travel_plans')
          .insert({
            user_id: user.id,
            origin,
            destination,
            travel_date,
            return_date: return_date || null,
            saved_routes: saved_routes || null,
          })
          .select()
          .single();
        if (retry.error) throw retry.error;
        return NextResponse.json(retry.data);
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save travel plan';
    if (message.includes('token')) return unauthorized();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
