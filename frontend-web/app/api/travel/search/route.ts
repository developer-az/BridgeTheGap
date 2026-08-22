import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { runTravelSearch } from '@/lib/travel-search';

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    if (!rateLimit(`travel:${ip}`, 20, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many searches from this network. Try again in a few minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const origin = String(body.origin || '').trim();
    const destination = String(body.destination || '').trim();
    const date = String(body.date || '').trim();
    const returnDate = body.returnDate ? String(body.returnDate).trim() : undefined;
    const originPlace = body.originPlace || null;
    const destinationPlace = body.destinationPlace || null;
    const modes: string[] = Array.isArray(body.modes) && body.modes.length
      ? body.modes
      : ['flight', 'train', 'bus', 'hotel'];

    if (!origin || !destination || !date) {
      return NextResponse.json(
        { error: 'Origin, destination, and date are required' },
        { status: 400 }
      );
    }

    const results = await runTravelSearch({
      origin,
      destination,
      originPlace,
      destinationPlace,
      date,
      returnDate,
      modes,
    });
    return NextResponse.json(results);
  } catch (error: unknown) {
    console.error('Travel search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search travel' },
      { status: 500 }
    );
  }
}
