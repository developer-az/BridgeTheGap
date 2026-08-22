import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { resolvePlaceBestEffort } from '@/lib/places';

export async function POST(request: NextRequest) {
  let placeId = '';
  let query = '';

  try {
    const ip = clientIp(request);
    if (!rateLimit(`places-resolve:${ip}`, 80, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many place lookups. Try again shortly.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    placeId = body.placeId ? String(body.placeId) : '';
    query = body.query ? String(body.query).trim() : '';

    if (!placeId && !query) {
      return NextResponse.json({ error: 'Query or placeId is required' }, { status: 400 });
    }

    const { place, source } = await resolvePlaceBestEffort({ placeId, query });
    return NextResponse.json({ place, source });
  } catch (error: unknown) {
    console.error('Places resolve error:', error);
    const fallback = query || placeId || 'Unknown';
    return NextResponse.json({
      place: {
        label: fallback,
        query: fallback,
        confidence: 'text',
      },
      source: 'fallback',
      warning: 'Place lookup failed; using what you typed.',
    });
  }
}
