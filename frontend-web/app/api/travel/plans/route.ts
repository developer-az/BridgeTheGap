import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid token');
  
  return user;
}

// GET /api/travel/plans
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    const { data, error } = await supabase
      .from('travel_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching travel plans:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/travel/plans
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const body = await request.json();
    const { origin, destination, travel_date, return_date, saved_routes } = body;

    const { data, error } = await supabase
      .from('travel_plans')
      .insert({
        user_id: user.id,
        origin,
        destination,
        travel_date,
        return_date,
        saved_routes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error saving travel plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

