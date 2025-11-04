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

// GET /api/connections
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const userId = user.id;

    const { data, error } = await supabase
      .from('connections')
      .select(`
        id,
        user1_id,
        user2_id,
        status,
        created_at
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (error) throw error;

    const connectionsWithPartners = await Promise.all(
      data.map(async (conn) => {
        const partnerId = conn.user1_id === userId ? conn.user2_id : conn.user1_id;
        
        const { data: partner } = await supabase
          .from('users')
          .select('id, email, university_name, major, location_city, location_state, bio, public_id')
          .eq('id', partnerId)
          .single();

        return {
          id: conn.id,
          partner,
          status: conn.status,
          created_at: conn.created_at,
        };
      })
    );

    return NextResponse.json(connectionsWithPartners);
  } catch (error: any) {
    console.error('Error fetching connections:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

