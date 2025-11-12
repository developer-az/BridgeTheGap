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

// POST /api/ai/estimate-travel-costs
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    await getUserFromToken(request);
    
    const body = await request.json();
    const { requests } = body;

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return NextResponse.json(
        { error: 'Travel requests array is required' },
        { status: 400 }
      );
    }

    // Import and call the travel AI function server-side
    const { estimateTravelCostsServer } = await import('@/lib/travel-ai');
    const estimates = await estimateTravelCostsServer(requests);

    return NextResponse.json({ estimates });
  } catch (error: any) {
    console.error('Error estimating travel costs:', error);
    const errorMessage = error.message || 'Failed to estimate travel costs';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

