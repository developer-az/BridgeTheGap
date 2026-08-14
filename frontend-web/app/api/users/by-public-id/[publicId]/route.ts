import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase-admin';

// GET /api/users/by-public-id/:publicId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const supabase = getAdminClient();
    await getUserFromToken(request);
    const { publicId } = await params;
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, university_name, major, location_city, location_state, bio, public_id')
      .eq('public_id', publicId.toUpperCase())
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'User not found with that ID' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching user by public ID:', error);
    return NextResponse.json({ error: 'User not found with that ID' }, { status: 404 });
  }
}

