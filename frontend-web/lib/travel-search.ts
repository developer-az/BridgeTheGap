import { FlightOffer, GroundTransport, TravelSearchResults } from '@/types';
import { toAirportCode } from './airports';
import { cached, cacheKey } from './cache';
import { generateSimpleGoogleFlightsUrl } from './google-flights';
import { estimateFlights, estimateGround, googleMapsTransitUrl } from './travel-estimates';
import { searchFlights } from '@/services/travel/amadeusService';
import { searchGroundTransport } from '@/services/travel/googleService';

function withFlightMeta(
  offers: Record<string, unknown>[],
  origin: string,
  destination: string,
  date: string,
  returnDate?: string,
  source: 'live' | 'estimate' = 'live'
): FlightOffer[] {
  const bookUrl = generateSimpleGoogleFlightsUrl(origin, destination, date, returnDate);
  return (offers || []).map((offer) => ({
    ...(offer as unknown as FlightOffer),
    type: 'flight' as const,
    source: (offer.source as FlightOffer['source']) || source,
    bookUrl: (offer.bookUrl as string) || bookUrl,
  }));
}

function withGroundMeta(
  offers: Record<string, unknown>[],
  origin: string,
  destination: string,
  date: string,
  source: 'live' | 'estimate' = 'live'
): GroundTransport[] {
  const bookUrl = googleMapsTransitUrl(origin, destination, date);
  return (offers || []).map((offer) => ({
    ...(offer as unknown as GroundTransport),
    source: (offer.source as GroundTransport['source']) || source,
    bookUrl: (offer.bookUrl as string) || bookUrl,
  }));
}

async function liveFlights(origin: string, destination: string, date: string, returnDate?: string) {
  const originCode = toAirportCode(origin);
  const destCode = toAirportCode(destination);
  if (!originCode || !destCode) return [];

  const offers = (await searchFlights(originCode, destCode, date, returnDate)) as Record<string, unknown>[];
  const live = (offers || []).filter((offer) => !String(offer.id || '').startsWith('mock-'));
  return withFlightMeta(live, origin, destination, date, returnDate, 'live');
}

async function liveGround(origin: string, destination: string, date: string, mode: 'train' | 'bus') {
  if (!process.env.GOOGLE_MAPS_API_KEY) return [];
  const offers = (await searchGroundTransport(origin, destination, date, mode)) as Record<string, unknown>[];
  const live = (offers || []).filter((offer) => !String(offer.id || '').startsWith('mock-'));
  return withGroundMeta(live, origin, destination, date, 'live');
}

export async function runTravelSearch(input: {
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  modes: string[];
}): Promise<TravelSearchResults> {
  const { origin, destination, date, returnDate, modes } = input;
  const key = cacheKey(['travel', origin, destination, date, returnDate, modes.join(',')]);

  return cached(key, 15 * 60 * 1000, async () => {
    const results: TravelSearchResults = { flights: [], trains: [], buses: [] };

    if (modes.includes('flight')) {
      try {
        const live = await liveFlights(origin, destination, date, returnDate);
        results.flights = live.length
          ? live
          : await estimateFlights(origin, destination, date, returnDate);
      } catch {
        results.flights = await estimateFlights(origin, destination, date, returnDate);
      }
    }

    if (modes.includes('train')) {
      try {
        const live = await liveGround(origin, destination, date, 'train');
        results.trains = live.length ? live : await estimateGround(origin, destination, date, 'train');
      } catch {
        results.trains = await estimateGround(origin, destination, date, 'train');
      }
    }

    if (modes.includes('bus')) {
      try {
        const live = await liveGround(origin, destination, date, 'bus');
        results.buses = live.length ? live : await estimateGround(origin, destination, date, 'bus');
      } catch {
        results.buses = await estimateGround(origin, destination, date, 'bus');
      }
    }

    return results;
  });
}
