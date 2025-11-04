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

// GET /api/schedule/user/:userId
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await getUserFromToken(request);
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', params.userId)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching user schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

