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

// Mock flight data
function getMockFlights(origin: string, destination: string, date: string) {
  return [
    {
      id: 'mock-flight-1',
      price: { total: '150.00', currency: 'USD' },
      itineraries: [{
        duration: 'PT2H30M',
        segments: [{
          departure: { airport: origin.substring(0, 3).toUpperCase(), time: `${date}T08:00:00` },
          arrival: { airport: destination.substring(0, 3).toUpperCase(), time: `${date}T10:30:00` },
          carrier: 'AA',
          flightNumber: '1234',
          duration: 'PT2H30M',
        }],
      }],
      type: 'flight',
    },
    {
      id: 'mock-flight-2',
      price: { total: '175.00', currency: 'USD' },
      itineraries: [{
        duration: 'PT3H15M',
        segments: [{
          departure: { airport: origin.substring(0, 3).toUpperCase(), time: `${date}T14:00:00` },
          arrival: { airport: destination.substring(0, 3).toUpperCase(), time: `${date}T17:15:00` },
          carrier: 'DL',
          flightNumber: '5678',
          duration: 'PT3H15M',
        }],
      }],
      type: 'flight',
    },
  ];
}

// Mock ground transport data
function getMockGroundTransport(origin: string, destination: string, date: string, mode: 'train' | 'bus') {
  const isTrain = mode === 'train';
  return [
    {
      id: `mock-${mode}-1`,
      duration: isTrain ? '3 hours 15 mins' : '4 hours 30 mins',
      durationMinutes: isTrain ? 195 : 270,
      distance: '250 miles',
      departure: '08:00 AM',
      arrival: isTrain ? '11:15 AM' : '12:30 PM',
      transitDetails: [{
        line: isTrain ? 'Northeast Regional' : 'Greyhound Express',
        vehicle: isTrain ? 'HEAVY_RAIL' : 'BUS',
        departure: { stop: `${origin} Station`, time: '08:00 AM' },
        arrival: { stop: `${destination} Station`, time: isTrain ? '11:15 AM' : '12:30 PM' },
        numStops: isTrain ? 5 : 8,
      }],
      price: { total: isTrain ? '65.00' : '45.00', currency: 'USD' },
      type: mode,
    },
    {
      id: `mock-${mode}-2`,
      duration: isTrain ? '4 hours' : '5 hours',
      durationMinutes: isTrain ? 240 : 300,
      distance: '250 miles',
      departure: '02:30 PM',
      arrival: isTrain ? '06:30 PM' : '07:30 PM',
      transitDetails: [{
        line: isTrain ? 'Acela Express' : 'Megabus',
        vehicle: isTrain ? 'HIGH_SPEED_TRAIN' : 'BUS',
        departure: { stop: `${origin} Central`, time: '02:30 PM' },
        arrival: { stop: `${destination} Terminal`, time: isTrain ? '06:30 PM' : '07:30 PM' },
        numStops: isTrain ? 3 : 6,
      }],
      price: { total: isTrain ? '85.00' : '35.00', currency: 'USD' },
      type: mode,
    },
  ];
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
        results.flights = getMockFlights(origin, destination, date);
      } catch (error: any) {
        console.error('Flight search error:', error.message);
        results.flights = { error: error.message };
      }
    }

    // Search trains if requested
    if (modes.includes('train')) {
      try {
        results.trains = getMockGroundTransport(origin, destination, date, 'train');
      } catch (error: any) {
        console.error('Train search error:', error.message);
        results.trains = { error: error.message };
      }
    }

    // Search buses if requested
    if (modes.includes('bus')) {
      try {
        results.buses = getMockGroundTransport(origin, destination, date, 'bus');
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

