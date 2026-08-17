import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase-admin';

// GET /api/schedule/user/:userId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const supabase = getAdminClient();
    await getUserFromToken(request);
    const { userId } = await params;
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching user schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

