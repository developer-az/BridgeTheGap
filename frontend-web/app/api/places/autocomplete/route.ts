import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { autocompletePlaces } from '@/lib/places';

export async function GET(request: NextRequest) {
  try {
    const ip = clientIp(request);
    if (!rateLimit(`places:${ip}`, 60, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many place lookups. Try again shortly.' }, { status: 429 });
    }

    const q = String(new URL(request.url).searchParams.get('q') || '').trim();
    if (q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await autocompletePlaces(q);
    return NextResponse.json({ suggestions });
  } catch (error: unknown) {
    console.error('Places autocomplete error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
