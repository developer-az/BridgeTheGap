import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { placeFromId, resolvePlaceQuery } from '@/lib/places';

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    if (!rateLimit(`places-resolve:${ip}`, 40, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many place lookups. Try again shortly.' }, { status: 429 });
    }

    const body = await request.json();
    const placeId = body.placeId ? String(body.placeId) : '';
    const query = body.query ? String(body.query).trim() : '';

    if (placeId) {
      const place = await placeFromId(placeId);
      if (!place) {
        return NextResponse.json({ error: 'Could not resolve that place' }, { status: 404 });
      }
      return NextResponse.json({ place });
    }

    if (!query) {
      return NextResponse.json({ error: 'Query or placeId is required' }, { status: 400 });
    }

    const place = await resolvePlaceQuery(query);
    if (!place) {
      return NextResponse.json({ error: 'No matching place found' }, { status: 404 });
    }

    return NextResponse.json({ place });
  } catch (error: unknown) {
    console.error('Places resolve error:', error);
    return NextResponse.json({ error: 'Failed to resolve place' }, { status: 500 });
  }
}
