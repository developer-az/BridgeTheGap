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

// GET /api/users/search
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const searchParams = request.nextUrl.searchParams;
    const university = searchParams.get('university');

    let query = supabase
      .from('users')
      .select('id, email, university_name, major, location_city, location_state, public_id')
      .neq('id', user.id);

    if (university) {
      query = query.ilike('university_name', `%${university}%`);
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

