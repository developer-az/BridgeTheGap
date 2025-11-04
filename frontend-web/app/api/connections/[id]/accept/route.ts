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

// PUT /api/connections/:id/accept
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getUserFromToken(request);
    
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error accepting connection:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

