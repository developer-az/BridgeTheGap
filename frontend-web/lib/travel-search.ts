import { FlightOffer, GroundTransport, HotelOffer, PlaceLocation, TravelSearchResults } from '@/types';
import { airportCandidates, toAirportCode } from './airports';
import { cached, cacheKey } from './cache';
import { generateSimpleGoogleFlightsUrl } from './google-flights';
import { placeCoordsQuery, placeTravelQuery, resolvePlaceQuery } from './places';
import { estimateFlights, estimateGround, googleMapsTransitUrl } from './travel-estimates';
import { nearestAirportCode, searchHotels } from '@/services/travel/hotelService';
import { searchFlights } from '@/services/travel/amadeusService';
import { searchGroundTransport } from '@/services/travel/googleService';

function byPrice<T extends { price: { total: string } }>(a: T, b: T) {
  return Number(a.price.total) - Number(b.price.total);
}

function withFlightMeta(
  offers: Record<string, unknown>[],
  origin: string,
  destination: string,
  date: string,
  returnDate?: string,
  source: 'live' | 'estimate' = 'live'
): FlightOffer[] {
  const bookUrl = generateSimpleGoogleFlightsUrl(origin, destination, date, returnDate);
  return (offers || [])
    .map((offer) => ({
      ...(offer as unknown as FlightOffer),
      type: 'flight' as const,
      source: (offer.source as FlightOffer['source']) || source,
      bookUrl: (offer.bookUrl as string) || bookUrl,
    }))
    .sort(byPrice);
}

function withGroundMeta(
  offers: Record<string, unknown>[],
  origin: string,
  destination: string,
  date: string,
  source: 'live' | 'estimate' = 'live'
): GroundTransport[] {
  const bookUrl = googleMapsTransitUrl(origin, destination, date);
  return (offers || [])
    .map((offer) => ({
      ...(offer as unknown as GroundTransport),
      source: (offer.source as GroundTransport['source']) || source,
      bookUrl: (offer.bookUrl as string) || bookUrl,
    }))
    .sort(byPrice);
}

function directionsQuery(place: PlaceLocation | null, fallback: string): string {
  if (!place) return fallback;
  if (process.env.GOOGLE_MAPS_API_KEY) {
    return placeCoordsQuery(place);
  }
  return placeTravelQuery(place);
}

async function airportCodeFor(place: PlaceLocation | null, fallback: string): Promise<string | null> {
  const candidates = place
    ? airportCandidates(place.label, place.city, place.state)
    : airportCandidates(fallback);

  if (candidates.length) return candidates[0];

  if (place && process.env.AMADEUS_CLIENT_ID) {
    const nearest = await nearestAirportCode(place.lat, place.lon);
    if (nearest) return nearest;
  }

  return toAirportCode(fallback);
}

async function liveFlights(
  originPlace: PlaceLocation | null,
  destinationPlace: PlaceLocation | null,
  origin: string,
  destination: string,
  date: string,
  returnDate?: string
) {
  const originCode = await airportCodeFor(originPlace, origin);
  const destCode = await airportCodeFor(destinationPlace, destination);
  if (!originCode || !destCode) return [];

  const offers = (await searchFlights(originCode, destCode, date, returnDate)) as Record<string, unknown>[];
  const live = (offers || []).filter((offer) => !String(offer.id || '').startsWith('mock-'));
  return withFlightMeta(live, origin, destination, date, returnDate, 'live');
}

async function liveGround(
  originPlace: PlaceLocation | null,
  destinationPlace: PlaceLocation | null,
  origin: string,
  destination: string,
  date: string,
  mode: 'train' | 'bus'
) {
  if (!process.env.GOOGLE_MAPS_API_KEY) return [];
  const from = directionsQuery(originPlace, origin);
  const to = directionsQuery(destinationPlace, destination);
  const offers = (await searchGroundTransport(from, to, date, mode)) as Record<string, unknown>[];
  const live = (offers || []).filter((offer) => !String(offer.id || '').startsWith('mock-'));
  return withGroundMeta(live, origin, destination, date, 'live');
}

function checkoutDate(date: string, returnDate?: string): string {
  if (returnDate) return returnDate;
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + 1);
  return next.toISOString().slice(0, 10);
}

export async function runTravelSearch(input: {
  origin: string;
  destination: string;
  originPlace?: PlaceLocation | null;
  destinationPlace?: PlaceLocation | null;
  date: string;
  returnDate?: string;
  modes: string[];
}): Promise<TravelSearchResults> {
  const { origin, destination, date, returnDate, modes } = input;

  const resolvedOrigin =
    input.originPlace || (await resolvePlaceQuery(origin)) || undefined;
  const resolvedDestination =
    input.destinationPlace || (await resolvePlaceQuery(destination)) || undefined;

  const originLabel = resolvedOrigin?.label || origin;
  const destinationLabel = resolvedDestination?.label || destination;

  const key = cacheKey([
    'travel',
    originLabel,
    destinationLabel,
    date,
    returnDate,
    modes.join(','),
  ]);

  return cached(key, 15 * 60 * 1000, async () => {
    const results: TravelSearchResults = {
      flights: [],
      trains: [],
      buses: [],
      hotels: [],
      resolved: {
        origin: resolvedOrigin,
        destination: resolvedDestination,
      },
    };

    if (modes.includes('flight')) {
      try {
        const live = await liveFlights(
          resolvedOrigin || null,
          resolvedDestination || null,
          originLabel,
          destinationLabel,
          date,
          returnDate
        );
        results.flights = live.length
          ? live
          : (await estimateFlights(originLabel, destinationLabel, date, returnDate)).sort(byPrice);
      } catch {
        results.flights = (await estimateFlights(originLabel, destinationLabel, date, returnDate)).sort(
          byPrice
        );
      }
    }

    if (modes.includes('train')) {
      try {
        const live = await liveGround(
          resolvedOrigin || null,
          resolvedDestination || null,
          originLabel,
          destinationLabel,
          date,
          'train'
        );
        results.trains = live.length
          ? live
          : (await estimateGround(originLabel, destinationLabel, date, 'train')).sort(byPrice);
      } catch {
        results.trains = (await estimateGround(originLabel, destinationLabel, date, 'train')).sort(
          byPrice
        );
      }
    }

    if (modes.includes('bus')) {
      try {
        const live = await liveGround(
          resolvedOrigin || null,
          resolvedDestination || null,
          originLabel,
          destinationLabel,
          date,
          'bus'
        );
        results.buses = live.length
          ? live
          : (await estimateGround(originLabel, destinationLabel, date, 'bus')).sort(byPrice);
      } catch {
        results.buses = (await estimateGround(originLabel, destinationLabel, date, 'bus')).sort(
          byPrice
        );
      }
    }

    if (modes.includes('hotel') && resolvedDestination) {
      try {
        results.hotels = await searchHotels(
          resolvedDestination,
          date,
          checkoutDate(date, returnDate)
        );
      } catch {
        results.hotels = [];
      }
    }

    return results;
  });
}

export type { HotelOffer };
