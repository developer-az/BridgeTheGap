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

// GET /api/users/by-public-id/:publicId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    await getUserFromToken(request);
    const { publicId } = await params;
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, university_name, major, location_city, location_state, bio, public_id')
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

