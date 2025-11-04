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

// GET /api/schedule/mutual/:partnerId
export async function GET(
  request: NextRequest,
  { params }: { params: { partnerId: string } }
) {
  try {
    const user = await getUserFromToken(request);
    const userId = user.id;
    const partnerId = params.partnerId;

    const [{ data: mySchedule }, { data: partnerSchedule }] = await Promise.all([
      supabase.from('schedules').select('*').eq('user_id', userId),
      supabase.from('schedules').select('*').eq('user_id', partnerId),
    ]);

    return NextResponse.json({
      mySchedule: mySchedule || [],
      partnerSchedule: partnerSchedule || [],
    });
  } catch (error: any) {
    console.error('Error fetching mutual availability:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

