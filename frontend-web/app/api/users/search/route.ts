import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase-admin';

// GET /api/users/search
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const searchParams = request.nextUrl.searchParams;
    const university = searchParams.get('university');
    const supabase = getAdminClient();

    let query = supabase
      .from('users')
      .select('id, email, name, university_name, major, location_city, location_state, public_id')
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

