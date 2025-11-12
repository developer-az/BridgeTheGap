import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in API route');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient('', '');

async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid token');
  
  return user;
}

// GET /api/users/profile
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase credentials:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
        url: supabaseUrl ? 'present' : 'missing',
        serviceKey: supabaseServiceKey ? 'present' : 'missing'
      });
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials. Please add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables.' },
        { status: 500 }
      );
    }
    
    const user = await getUserFromToken(request);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('❌ Supabase query error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // If user doesn't exist yet, return a default profile structure
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          id: user.id,
          email: user.email,
          university_name: null,
          major: null,
          location_city: null,
          location_state: null,
          bio: null,
          public_id: null,
          created_at: null,
          updated_at: null
        });
      }
      
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error fetching profile:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide more specific error messages
    let errorMessage = error.message || 'Failed to fetch profile';
    if (error.message?.includes('Invalid token')) {
      errorMessage = 'Authentication failed. Please log in again.';
    } else if (error.message?.includes('No token')) {
      errorMessage = 'No authentication token provided.';
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/users/profile
export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials. Please add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables.' },
        { status: 500 }
      );
    }
    
    const user = await getUserFromToken(request);
    const body = await request.json();
    const { university_name, major, location_city, location_state, bio } = body;

    // Check if user exists and has a public_id
    const { data: existingUser } = await supabase
      .from('users')
      .select('public_id')
      .eq('id', user.id)
      .single();

    // Generate public_id if missing (database trigger only works on INSERT, not UPDATE)
    let publicId = existingUser?.public_id;
    if (!publicId) {
      // Generate an 8-character ID using the same logic as the database function
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
      let newId = '';
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!newId && attempts < maxAttempts) {
        let candidate = '';
        for (let i = 0; i < 8; i++) {
          candidate += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Check if ID already exists
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('public_id', candidate)
          .single();
        
        if (!existing) {
          newId = candidate;
        }
        attempts++;
      }
      
      if (!newId) {
        throw new Error('Failed to generate unique public ID. Please try again.');
      }
      
      publicId = newId;
    }

    const upsertData: any = {
      id: user.id,
      email: user.email,
      university_name,
      major,
      location_city,
      location_state,
      bio,
      public_id: publicId, // Ensure public_id is set
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(upsertData, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error updating profile:', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
  }
}

