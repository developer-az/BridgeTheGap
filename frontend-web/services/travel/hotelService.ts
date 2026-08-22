import axios from 'axios';
import { HotelOffer } from '@/types';
import { PlaceLocation } from '@/types';
import { cached, cacheKey } from '@/lib/cache';

const AMADEUS_API_URL = 'https://test.api.amadeus.com';

let accessToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Amadeus API credentials not configured');
  }

  const response = await axios.post(
    `${AMADEUS_API_URL}/v1/security/oauth2/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  accessToken = response.data.access_token;
  tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000;
  return accessToken!;
}

export async function nearestAirportCode(lat: number, lon: number): Promise<string | null> {
  try {
    const token = await getAccessToken();
    const response = await axios.get(`${AMADEUS_API_URL}/v1/reference-data/locations/airports`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        latitude: lat,
        longitude: lon,
        radius: 150,
        'page[limit]': 3,
      },
    });

    const airports = response.data?.data || [];
    const withIata = airports.find((row: { iataCode?: string }) => row.iataCode);
    return withIata?.iataCode || null;
  } catch {
    return null;
  }
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T12:00:00`);
  const end = new Date(`${checkOut}T12:00:00`);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
}

function googleHotelsUrl(place: PlaceLocation, checkIn: string, checkOut: string): string {
  const q = place.city && place.state ? `${place.city}, ${place.state}` : place.label;
  const params = new URLSearchParams({
    q,
    checkin: checkIn,
    checkout: checkOut,
    sort: 'price',
  });
  return `https://www.google.com/travel/hotels?${params.toString()}`;
}

function estimateHotels(
  place: PlaceLocation,
  checkIn: string,
  checkOut: string
): HotelOffer[] {
  const nights = nightsBetween(checkIn, checkOut);
  const cityTier = place.state ? 110 : 95;
  const budget = Math.round(cityTier * 0.85);
  const mid = cityTier;
  const nice = Math.round(cityTier * 1.35);

  const bookUrl = googleHotelsUrl(place, checkIn, checkOut);

  return [
    {
      id: `estimate-hotel-budget-${place.lat}-${checkIn}`,
      name: `Budget stay near ${place.city || place.label.split(',')[0]}`,
      address: place.label,
      nights,
      checkIn,
      checkOut,
      price: {
        total: String(budget * nights),
        perNight: String(budget),
        currency: 'USD',
      },
      type: 'hotel',
      source: 'estimate',
      bookUrl,
    },
    {
      id: `estimate-hotel-mid-${place.lat}-${checkIn}`,
      name: `Mid-range hotel · ${place.city || 'destination'}`,
      address: place.label,
      nights,
      checkIn,
      checkOut,
      price: {
        total: String(mid * nights),
        perNight: String(mid),
        currency: 'USD',
      },
      type: 'hotel',
      source: 'estimate',
      bookUrl,
    },
    {
      id: `estimate-hotel-nice-${place.lat}-${checkIn}`,
      name: `Nicer pick · ${place.city || 'destination'}`,
      address: place.label,
      rating: 4.2,
      nights,
      checkIn,
      checkOut,
      price: {
        total: String(nice * nights),
        perNight: String(nice),
        currency: 'USD',
      },
      type: 'hotel',
      source: 'estimate',
      bookUrl,
    },
  ];
}

export async function searchHotels(
  destination: PlaceLocation,
  checkIn: string,
  checkOut: string
): Promise<HotelOffer[]> {
  const nights = nightsBetween(checkIn, checkOut);
  const key = cacheKey([
    'hotels',
    destination.lat,
    destination.lon,
    checkIn,
    checkOut,
  ]);

  return cached(key, 15 * 60 * 1000, async () => {
    const bookUrl = googleHotelsUrl(destination, checkIn, checkOut);

    try {
      const token = await getAccessToken();

      const listResponse = await axios.get(
        `${AMADEUS_API_URL}/v1/reference-data/locations/hotels/by-geocode`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            latitude: destination.lat,
            longitude: destination.lon,
            radius: 8,
          },
        }
      );

      const hotelIds = (listResponse.data?.data || [])
        .slice(0, 12)
        .map((row: { hotelId: string }) => row.hotelId)
        .filter(Boolean);

      if (!hotelIds.length) {
        return estimateHotels(destination, checkIn, checkOut);
      }

      const offersResponse = await axios.get(`${AMADEUS_API_URL}/v3/shopping/hotel-offers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          hotelIds: hotelIds.join(','),
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults: 1,
          roomQuantity: 1,
          currency: 'USD',
        },
      });

      const offers = (offersResponse.data?.data || [])
        .map((entry: {
          hotel: { hotelId: string; name: string; rating?: string; address?: { lines?: string[] } };
          offers?: Array<{
            id: string;
            price: { total: string; currency: string };
          }>;
        }) => {
          const best = entry.offers?.[0];
          if (!best) return null;
          const total = Number(best.price.total);
          const perNight = Math.round(total / nights);
          const address = entry.hotel.address?.lines?.join(', ');

          return {
            id: best.id || entry.hotel.hotelId,
            name: entry.hotel.name,
            address: address || destination.label,
            rating: entry.hotel.rating ? Number(entry.hotel.rating) : undefined,
            nights,
            checkIn,
            checkOut,
            price: {
              total: best.price.total,
              perNight: String(perNight),
              currency: best.price.currency || 'USD',
            },
            type: 'hotel' as const,
            source: 'live' as const,
            bookUrl,
          };
        })
        .filter(Boolean) as HotelOffer[];

      if (!offers.length) {
        return estimateHotels(destination, checkIn, checkOut);
      }

      return offers.sort((a, b) => Number(a.price.total) - Number(b.price.total));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('not configured')) {
        console.warn('Using estimated hotel rates — add Amadeus credentials for live hotels');
      }
      return estimateHotels(destination, checkIn, checkOut);
    }
  });
}
