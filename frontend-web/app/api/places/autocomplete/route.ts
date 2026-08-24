import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { autocompletePlaces } from '@/lib/places';

export async function GET(request: NextRequest) {
  try {
    const ip = clientIp(request);
    if (!rateLimit(`places:${ip}`, 60, 10 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many place lookups. Try again shortly.' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get('q') || '').trim();
    const prefer = searchParams.get('prefer') === 'schools' ? 'schools' : 'all';
    if (q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await autocompletePlaces(q, { prefer });
    return NextResponse.json({ suggestions });
  } catch (error: unknown) {
    console.error('Places autocomplete error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
