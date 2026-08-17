import { NextResponse } from 'next/server';
import { OCCASIONS, upcomingOccasions } from '@/lib/occasions';

export async function GET() {
  const upcoming = upcomingOccasions().map((item) => ({
    ...item,
    date: item.date ? item.date.toISOString().slice(0, 10) : null,
  }));

  return NextResponse.json({
    occasions: OCCASIONS,
    upcoming,
  });
}
