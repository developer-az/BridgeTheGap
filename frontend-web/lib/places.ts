import { PlaceLocation } from '@/types';
import { cached, cacheKey } from './cache';
import { geocode as nominatimGeocode } from './geo';

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

export type PlaceSuggestion = {
  placeId: string;
  label: string;
  main: string;
  secondary: string;
};

function parseAddressComponents(components: Array<{ long_name: string; short_name: string; types: string[] }>) {
  let city = '';
  let state = '';
  let country = '';

  for (const part of components) {
    if (part.types.includes('locality')) city = part.long_name;
    if (!city && part.types.includes('sublocality')) city = part.long_name;
    if (!city && part.types.includes('administrative_area_level_3')) city = part.long_name;
    if (part.types.includes('administrative_area_level_1')) state = part.short_name;
    if (part.types.includes('country')) country = part.short_name;
  }

  return { city, state, country };
}

function toPlaceLocation(
  result: {
    place_id?: string;
    formatted_address?: string;
    name?: string;
    geometry: { location: { lat: number; lng: number } };
    address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
  }
): PlaceLocation {
  const { city, state, country } = parseAddressComponents(result.address_components || []);
  const formatted = result.formatted_address || result.name || '';
  const label =
    result.name && formatted && !formatted.startsWith(result.name)
      ? `${result.name}, ${formatted}`
      : formatted || result.name || '';

  return {
    label,
    query: formatted || label,
    placeId: result.place_id,
    lat: result.geometry.location.lat,
    lon: result.geometry.location.lng,
    city: city || undefined,
    state: state || undefined,
    country: country || undefined,
  };
}

export async function autocompletePlaces(input: string): Promise<PlaceSuggestion[]> {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 2) return [];

  if (!GOOGLE_KEY) {
    const point = await nominatimGeocode(trimmed);
    if (!point) return [];
    return [
      {
        placeId: `nominatim:${point.label}`,
        label: point.label,
        main: point.label.split(',')[0] || point.label,
        secondary: point.label.split(',').slice(1).join(',').trim(),
      },
    ];
  }

  return cached(cacheKey(['places-ac', trimmed.toLowerCase()]), 10 * 60 * 1000, async () => {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', trimmed);
    url.searchParams.set('types', 'geocode');
    url.searchParams.set('components', 'country:us');
    url.searchParams.set('key', GOOGLE_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) return [];
    const data = (await response.json()) as {
      status: string;
      predictions?: Array<{
        place_id: string;
        description: string;
        structured_formatting?: { main_text: string; secondary_text: string };
      }>;
    };

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return [];

    return (data.predictions || []).slice(0, 8).map((prediction) => ({
      placeId: prediction.place_id,
      label: prediction.description,
      main: prediction.structured_formatting?.main_text || prediction.description,
      secondary: prediction.structured_formatting?.secondary_text || '',
    }));
  });
}

export async function placeFromId(placeId: string): Promise<PlaceLocation | null> {
  if (placeId.startsWith('nominatim:')) {
    return resolvePlaceQuery(placeId.replace(/^nominatim:/, ''));
  }

  if (!GOOGLE_KEY) return null;

  return cached(cacheKey(['place', placeId]), 24 * 60 * 60 * 1000, async () => {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set(
      'fields',
      'place_id,formatted_address,geometry,address_components,name'
    );
    url.searchParams.set('key', GOOGLE_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) return null;
    const data = (await response.json()) as {
      status: string;
      result?: {
        place_id: string;
        formatted_address: string;
        name?: string;
        geometry: { location: { lat: number; lng: number } };
        address_components: Array<{ long_name: string; short_name: string; types: string[] }>;
      };
    };

    if (data.status !== 'OK' || !data.result) return null;
    return toPlaceLocation(data.result);
  });
}

async function googleGeocodePlace(query: string): Promise<PlaceLocation | null> {
  if (!GOOGLE_KEY) return null;

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query.trim());
  url.searchParams.set('components', 'country:US');
  url.searchParams.set('key', GOOGLE_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = (await response.json()) as {
    status: string;
    results?: Array<{
      place_id: string;
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
      address_components: Array<{ long_name: string; short_name: string; types: string[] }>;
    }>;
  };

  if (data.status !== 'OK' || !data.results?.[0]) return null;
  return toPlaceLocation(data.results[0]);
}

export async function resolvePlaceQuery(query: string): Promise<PlaceLocation | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  return cached(cacheKey(['resolve-place', trimmed.toLowerCase()]), 24 * 60 * 60 * 1000, async () => {
    const google = await googleGeocodePlace(trimmed);
    if (google) return google;

    const point = await nominatimGeocode(trimmed);
    if (!point) return null;

    const parts = point.label.split(',').map((part) => part.trim());
    const city = parts[0];
    const stateMatch = parts.find((part) => /^[A-Z]{2}$/.test(part) || part.length === 2);

    return {
      label: point.label,
      query: point.label,
      lat: point.lat,
      lon: point.lon,
      city,
      state: stateMatch,
    };
  });
}

export function placeTravelQuery(place: PlaceLocation): string {
  return place.query || place.label;
}

export function placeCoordsQuery(place: PlaceLocation): string {
  return `${place.lat},${place.lon}`;
}
