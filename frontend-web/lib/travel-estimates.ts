import { FlightOffer, GroundTransport } from '@/types';
import { addMinutes, formatDuration, geocode, haversineMiles, isoAt } from './geo';
import { generateSimpleGoogleFlightsUrl } from './google-flights';

export function googleMapsTransitUrl(origin: string, destination: string, date: string): string {
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'transit',
    dir_action: 'navigate',
  });
  if (date) params.set('departure_time', `${date}T08:00:00`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function googleMapsSearchUrl(origin: string, destination: string): string {
  return `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;
}

function price(distance: number, perMile: number, base: number): string {
  return Math.max(base, base + distance * perMile).toFixed(2);
}

export async function estimateFlights(
  origin: string,
  destination: string,
  date: string,
  returnDate?: string
): Promise<FlightOffer[]> {
  const bookUrl = generateSimpleGoogleFlightsUrl(origin, destination, date, returnDate);
  const points = await Promise.all([geocode(origin), geocode(destination)]);
  const miles = points[0] && points[1] ? haversineMiles(points[0], points[1]) : 420;
  const durationMin = Math.max(75, 40 + miles / 8.2);
  const durationIso = `PT${Math.floor(durationMin / 60)}H${Math.round(durationMin % 60)}M`;

  const morning: FlightOffer = {
    id: `estimate-flight-am-${origin}-${destination}`,
    price: { total: price(miles, 0.14, 89), currency: 'USD' },
    itineraries: [
      {
        duration: durationIso,
        segments: [
          {
            departure: { airport: origin.slice(0, 18), time: isoAt(date, 8, 10) },
            arrival: { airport: destination.slice(0, 18), time: isoAt(date, 8, 10 + Math.round(durationMin)) },
            carrier: '—',
            flightNumber: 'est',
            duration: durationIso,
          },
        ],
      },
    ],
    type: 'flight',
    source: 'estimate',
    bookUrl,
  };

  const afternoon: FlightOffer = {
    ...morning,
    id: `estimate-flight-pm-${origin}-${destination}`,
    price: { total: price(miles, 0.16, 110), currency: 'USD' },
    itineraries: [
      {
        duration: durationIso,
        segments: [
          {
            departure: { airport: origin.slice(0, 18), time: isoAt(date, 16, 40) },
            arrival: { airport: destination.slice(0, 18), time: isoAt(date, 16, 40 + Math.round(durationMin)) },
            carrier: '—',
            flightNumber: 'est',
            duration: durationIso,
          },
        ],
      },
    ],
  };

  return [morning, afternoon];
}

export async function estimateGround(
  origin: string,
  destination: string,
  date: string,
  mode: 'train' | 'bus'
): Promise<GroundTransport[]> {
  const bookUrl = googleMapsTransitUrl(origin, destination, date);
  const points = await Promise.all([geocode(origin), geocode(destination)]);
  const miles = points[0] && points[1] ? haversineMiles(points[0], points[1]) : 250;
  const speed = mode === 'train' ? 52 : 46;
  const durationMin = Math.max(90, (miles / speed) * 60 + (mode === 'train' ? 20 : 35));
  const perMile = mode === 'train' ? 0.24 : 0.14;
  const base = mode === 'train' ? 18 : 12;
  const line = mode === 'train' ? 'Rail corridor' : 'Coach';

  const first: GroundTransport = {
    id: `estimate-${mode}-1-${origin}-${destination}`,
    duration: formatDuration(durationMin),
    durationMinutes: durationMin,
    distance: `${Math.round(miles)} miles`,
    departure: addMinutes(date, 0, 7, 40),
    arrival: addMinutes(date, durationMin, 7, 40),
    transitDetails: [
      {
        line,
        vehicle: mode === 'train' ? 'RAIL' : 'BUS',
        departure: { stop: origin, time: addMinutes(date, 0, 7, 40) },
        arrival: { stop: destination, time: addMinutes(date, durationMin, 7, 40) },
        numStops: mode === 'train' ? 4 : 7,
      },
    ],
    price: { total: price(miles, perMile, base), currency: 'USD' },
    type: mode,
    source: 'estimate',
    bookUrl,
  };

  const second: GroundTransport = {
    ...first,
    id: `estimate-${mode}-2-${origin}-${destination}`,
    duration: formatDuration(durationMin * 1.12),
    durationMinutes: durationMin * 1.12,
    departure: addMinutes(date, 0, 13, 20),
    arrival: addMinutes(date, durationMin * 1.12, 13, 20),
    price: { total: price(miles, perMile * 0.9, base - 4), currency: 'USD' },
    transitDetails: [
      {
        line: mode === 'train' ? 'Regional' : 'Express coach',
        vehicle: mode === 'train' ? 'RAIL' : 'BUS',
        departure: { stop: origin, time: addMinutes(date, 0, 13, 20) },
        arrival: { stop: destination, time: addMinutes(date, durationMin * 1.12, 13, 20) },
        numStops: mode === 'train' ? 6 : 9,
      },
    ],
  };

  return [first, second];
}
