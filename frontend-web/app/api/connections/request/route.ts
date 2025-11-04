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

// POST /api/connections/request
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const body = await request.json();
    const { target_user_id } = body;
    const userId = user.id;

    if (!target_user_id) {
      return NextResponse.json({ error: 'target_user_id is required' }, { status: 400 });
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('connections')
      .select('id')
      .or(`and(user1_id.eq.${userId},user2_id.eq.${target_user_id}),and(user1_id.eq.${target_user_id},user2_id.eq.${userId})`)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Connection already exists' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('connections')
      .insert({
        user1_id: userId,
        user2_id: target_user_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating connection:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

