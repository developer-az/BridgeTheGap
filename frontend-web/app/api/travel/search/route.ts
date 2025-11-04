import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchFlights } from '@/services/travel/amadeusService';
import { searchGroundTransport } from '@/services/travel/googleService';

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

// POST /api/travel/search
export async function POST(request: NextRequest) {
  try {
    await getUserFromToken(request);
    const body = await request.json();
    const { origin, destination, date, returnDate, modes } = body;

    const results: any = {
      flights: [],
      trains: [],
      buses: [],
    };

    // Search flights if requested
    if (modes.includes('flight')) {
      try {
        results.flights = await searchFlights(origin, destination, date, returnDate);
      } catch (error: any) {
        console.error('Flight search error:', error.message);
        results.flights = { error: error.message };
      }
    }

    // Search trains if requested
    if (modes.includes('train')) {
      try {
        results.trains = await searchGroundTransport(origin, destination, date, 'train');
      } catch (error: any) {
        console.error('Train search error:', error.message);
        results.trains = { error: error.message };
      }
    }

    // Search buses if requested
    if (modes.includes('bus')) {
      try {
        results.buses = await searchGroundTransport(origin, destination, date, 'bus');
      } catch (error: any) {
        console.error('Bus search error:', error.message);
        results.buses = { error: error.message };
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error searching travel:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

