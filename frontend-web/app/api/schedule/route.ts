import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase-admin';

// GET /api/schedule
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const user = await getUserFromToken(request);
    
    const { data, error} = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/schedule
export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const user = await getUserFromToken(request);
    const body = await request.json();
    
    // Check if this is a batch insert (array of entries)
    if (Array.isArray(body)) {
      const entries = body.map(entry => ({
        user_id: user.id,
        day_of_week: entry.day_of_week,
        start_time: entry.start_time,
        end_time: entry.end_time,
        title: entry.title,
        type: entry.type,
      }));

      const { data, error } = await supabase
        .from('schedules')
        .insert(entries)
        .select();

      if (error) throw error;

      return NextResponse.json(data);
    } else {
      // Single entry (existing behavior)
      const { day_of_week, start_time, end_time, title, type } = body;

      const { data, error } = await supabase
        .from('schedules')
        .insert({
          user_id: user.id,
          day_of_week,
          start_time,
          end_time,
          title,
          type,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('Error creating schedule entry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

