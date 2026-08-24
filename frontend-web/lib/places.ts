import { PlaceLocation } from '@/types';
import { toAirportCode } from './airports';
import { cached, cacheKey } from './cache';
import {
  findCuratedUniversity,
  searchUniversities,
  universityFromId,
  universityToPlace,
} from './universities';

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

export type PlaceSuggestion = {
  placeId: string;
  label: string;
  main: string;
  secondary: string;
  kind?: 'university' | 'place';
};

/** Common US city / campus centers when remote geocoders fail. */
const KNOWN_PLACES: Array<{
  keys: string[];
  label: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
}> = [
  { keys: ['boston', 'bos'], label: 'Boston, MA, USA', city: 'Boston', state: 'MA', lat: 42.3601, lon: -71.0589 },
  { keys: ['cambridge', 'cambridge ma'], label: 'Cambridge, MA, USA', city: 'Cambridge', state: 'MA', lat: 42.3736, lon: -71.1097 },
  { keys: ['new york', 'nyc', 'new york city', 'manhattan'], label: 'New York, NY, USA', city: 'New York', state: 'NY', lat: 40.7128, lon: -74.006 },
  { keys: ['brooklyn'], label: 'Brooklyn, NY, USA', city: 'Brooklyn', state: 'NY', lat: 40.6782, lon: -73.9442 },
  { keys: ['philadelphia', 'philly'], label: 'Philadelphia, PA, USA', city: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
  { keys: ['college park', 'college park md', 'university of maryland', 'umd'], label: 'College Park, MD, USA', city: 'College Park', state: 'MD', lat: 38.9897, lon: -76.9378 },
  { keys: ['washington', 'washington dc', 'dc'], label: 'Washington, DC, USA', city: 'Washington', state: 'DC', lat: 38.9072, lon: -77.0369 },
  { keys: ['baltimore'], label: 'Baltimore, MD, USA', city: 'Baltimore', state: 'MD', lat: 39.2904, lon: -76.6122 },
  { keys: ['chicago'], label: 'Chicago, IL, USA', city: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
  { keys: ['los angeles', 'la'], label: 'Los Angeles, CA, USA', city: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437 },
  { keys: ['san francisco', 'sf'], label: 'San Francisco, CA, USA', city: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194 },
  { keys: ['seattle'], label: 'Seattle, WA, USA', city: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
  { keys: ['atlanta'], label: 'Atlanta, GA, USA', city: 'Atlanta', state: 'GA', lat: 33.749, lon: -84.388 },
  { keys: ['miami'], label: 'Miami, FL, USA', city: 'Miami', state: 'FL', lat: 25.7617, lon: -80.1918 },
  { keys: ['dallas'], label: 'Dallas, TX, USA', city: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.797 },
  { keys: ['austin'], label: 'Austin, TX, USA', city: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
  { keys: ['houston'], label: 'Houston, TX, USA', city: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698 },
  { keys: ['denver'], label: 'Denver, CO, USA', city: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
  { keys: ['detroit'], label: 'Detroit, MI, USA', city: 'Detroit', state: 'MI', lat: 42.3314, lon: -83.0458 },
  { keys: ['ann arbor'], label: 'Ann Arbor, MI, USA', city: 'Ann Arbor', state: 'MI', lat: 42.2808, lon: -83.743 },
  { keys: ['pittsburgh'], label: 'Pittsburgh, PA, USA', city: 'Pittsburgh', state: 'PA', lat: 40.4406, lon: -79.9959 },
  { keys: ['ithaca'], label: 'Ithaca, NY, USA', city: 'Ithaca', state: 'NY', lat: 42.443, lon: -76.5019 },
  { keys: ['princeton'], label: 'Princeton, NJ, USA', city: 'Princeton', state: 'NJ', lat: 40.3573, lon: -74.6672 },
  { keys: ['new haven'], label: 'New Haven, CT, USA', city: 'New Haven', state: 'CT', lat: 41.3083, lon: -72.9279 },
  { keys: ['raleigh'], label: 'Raleigh, NC, USA', city: 'Raleigh', state: 'NC', lat: 35.7796, lon: -78.6382 },
  { keys: ['durham'], label: 'Durham, NC, USA', city: 'Durham', state: 'NC', lat: 35.994, lon: -78.8986 },
  { keys: ['chapel hill'], label: 'Chapel Hill, NC, USA', city: 'Chapel Hill', state: 'NC', lat: 35.9132, lon: -79.0558 },
  { keys: ['state college', 'university park'], label: 'State College, PA, USA', city: 'State College', state: 'PA', lat: 40.7934, lon: -77.86 },
];

function normalizeKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[.]/g, '')
    .replace(/\bunited states\b/g, '')
    .replace(/\busa\b/g, '')
    .replace(/\bus\b/g, '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCityState(query: string): { city?: string; state?: string } {
  const trimmed = query.trim();
  const match = trimmed.match(/^([^,]+),\s*([A-Za-z]{2})\b/);
  if (match) {
    return { city: match[1].trim(), state: match[2].toUpperCase() };
  }
  const parts = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2 && /^[A-Za-z]{2}$/.test(parts[1])) {
    return { city: parts[0], state: parts[1].toUpperCase() };
  }
  return { city: parts[0] || trimmed };
}

function knownPlaceMatch(query: string): PlaceLocation | null {
  const key = normalizeKey(query);
  const hit =
    KNOWN_PLACES.find((place) => place.keys.includes(key)) ||
    KNOWN_PLACES.find((place) => key.startsWith(place.keys[0]) || place.keys.some((k) => key.includes(k) && k.length > 3));

  if (!hit) return null;
  return {
    label: hit.label,
    query: hit.label,
    lat: hit.lat,
    lon: hit.lon,
    city: hit.city,
    state: hit.state,
    country: 'US',
    confidence: 'approximate',
  };
}

function textPlace(query: string): PlaceLocation {
  const { city, state } = parseCityState(query);
  const known = knownPlaceMatch(query);
  if (known) return known;

  return {
    label: query.trim(),
    query: query.trim(),
    city,
    state,
    country: 'US',
    confidence: 'text',
  };
}

function parseAddressComponents(components: Array<{ long_name: string; short_name: string; types: string[] }>) {
  let city = '';
  let state = '';
  let country = '';

  for (const part of components) {
    if (part.types.includes('locality')) city = part.long_name;
    if (!city && part.types.includes('postal_town')) city = part.long_name;
    if (!city && part.types.includes('sublocality')) city = part.long_name;
    if (!city && part.types.includes('administrative_area_level_3')) city = part.long_name;
    if (!city && part.types.includes('administrative_area_level_2')) city = part.long_name;
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
    geometry?: { location: { lat: number; lng: number } };
    address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
  },
  confidence: PlaceLocation['confidence'] = 'exact'
): PlaceLocation | null {
  if (!result.geometry?.location) return null;
  const { city, state, country } = parseAddressComponents(result.address_components || []);
  const formatted = result.formatted_address || result.name || '';
  const label =
    result.name && formatted && !formatted.startsWith(result.name)
      ? `${result.name}, ${formatted}`
      : formatted || result.name || '';

  if (!label) return null;

  return {
    label,
    query: formatted || label,
    placeId: result.place_id,
    lat: result.geometry.location.lat,
    lon: result.geometry.location.lng,
    city: city || undefined,
    state: state || undefined,
    country: country || undefined,
    confidence,
  };
}

async function cachedIfPresent<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T | null>
): Promise<T | null> {
  // Only cache successful lookups — never lock in a temporary miss.
  const existing = await cached(key, ttlMs, async () => {
    const value = await fn();
    if (value == null) throw new Error('PLACE_MISS');
    return value;
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === 'PLACE_MISS') return null;
    throw error;
  });
  return existing;
}

async function nominatimSearch(query: string, limit = 5): Promise<PlaceLocation[]> {
  const variants = Array.from(
    new Set([
      query.trim(),
      query.replace(/,?\s*United States$/i, '').trim(),
      `${query.trim()}, USA`,
      parseCityState(query).city && parseCityState(query).state
        ? `${parseCityState(query).city}, ${parseCityState(query).state}, USA`
        : '',
    ].filter(Boolean))
  );

  for (const variant of variants) {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('q', variant);

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'BridgeTheGap/1.0 (long-distance planner; https://bridgethegap.app)',
          Accept: 'application/json',
        },
      });
      if (!response.ok) continue;

      const data = (await response.json()) as Array<{
        place_id: number;
        lat: string;
        lon: string;
        display_name: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          state?: string;
          country_code?: string;
        };
      }>;

      if (!data.length) continue;

      return data.map((row) => {
        const city =
          row.address?.city ||
          row.address?.town ||
          row.address?.village ||
          row.address?.municipality ||
          row.display_name.split(',')[0];
        const stateRaw = row.address?.state || '';
        const state =
          STATE_ABBR[normalizeKey(stateRaw)] ||
          (/^[A-Z]{2}$/.test(stateRaw) ? stateRaw : undefined);

        return {
          label: row.display_name,
          query: row.display_name,
          placeId: `nominatim:${row.place_id}`,
          lat: Number(row.lat),
          lon: Number(row.lon),
          city,
          state,
          country: row.address?.country_code?.toUpperCase(),
          confidence: 'exact' as const,
        };
      });
    } catch (error) {
      console.warn('Nominatim search failed for', variant, error);
    }
  }

  return [];
}

const STATE_ABBR: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA',
  colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO',
  montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI',
  'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI',
  wyoming: 'WY', 'district of columbia': 'DC',
};

async function googleAutocomplete(input: string): Promise<PlaceSuggestion[]> {
  if (!GOOGLE_KEY) return [];

  try {
    const attempts = [
      { types: undefined as string | undefined, components: 'country:us' },
      { types: 'geocode', components: 'country:us' },
      { types: undefined, components: undefined },
    ];

    for (const attempt of attempts) {
      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      url.searchParams.set('input', input);
      if (attempt.types) url.searchParams.set('types', attempt.types);
      if (attempt.components) url.searchParams.set('components', attempt.components);
      url.searchParams.set('key', GOOGLE_KEY);

      const response = await fetch(url.toString());
      if (!response.ok) continue;
      const data = (await response.json()) as {
        status: string;
        error_message?: string;
        predictions?: Array<{
          place_id: string;
          description: string;
          structured_formatting?: { main_text: string; secondary_text: string };
        }>;
      };

      if (data.status === 'OK' && data.predictions?.length) {
        return data.predictions.slice(0, 8).map((prediction) => ({
          placeId: prediction.place_id,
          label: prediction.description,
          main: prediction.structured_formatting?.main_text || prediction.description,
          secondary: prediction.structured_formatting?.secondary_text || '',
        }));
      }

      if (data.status && data.status !== 'ZERO_RESULTS') {
        console.warn('Places autocomplete:', data.status, data.error_message || '');
      }
    }
  } catch (error) {
    console.warn('Google autocomplete failed', error);
  }

  return [];
}

async function googleGeocodePlace(query: string): Promise<PlaceLocation | null> {
  if (!GOOGLE_KEY) return null;

  const attempts = [
    { address: query, components: 'country:US' },
    { address: query, components: undefined },
    { address: `${query}, USA`, components: undefined },
  ];

  for (const attempt of attempts) {
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('address', attempt.address);
      if (attempt.components) url.searchParams.set('components', attempt.components);
      url.searchParams.set('key', GOOGLE_KEY);

      const response = await fetch(url.toString());
      if (!response.ok) continue;
      const data = (await response.json()) as {
        status: string;
        error_message?: string;
        results?: Array<{
          place_id: string;
          formatted_address: string;
          geometry: { location: { lat: number; lng: number } };
          address_components: Array<{ long_name: string; short_name: string; types: string[] }>;
        }>;
      };

      if (data.status === 'OK' && data.results?.[0]) {
        return toPlaceLocation(data.results[0], 'exact');
      }
      if (data.status && !['ZERO_RESULTS', 'OK'].includes(data.status)) {
        console.warn('Google geocode:', data.status, data.error_message || '');
      }
    } catch (error) {
      console.warn('Google geocode failed', error);
    }
  }

  return null;
}

async function googlePlaceDetails(placeId: string): Promise<PlaceLocation | null> {
  if (!GOOGLE_KEY || placeId.startsWith('nominatim:')) return null;

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'place_id,formatted_address,geometry,address_components,name');
    url.searchParams.set('key', GOOGLE_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) return null;
    const data = (await response.json()) as {
      status: string;
      error_message?: string;
      result?: {
        place_id: string;
        formatted_address: string;
        name?: string;
        geometry: { location: { lat: number; lng: number } };
        address_components: Array<{ long_name: string; short_name: string; types: string[] }>;
      };
    };

    if (data.status !== 'OK' || !data.result) {
      if (data.status !== 'OK') {
        console.warn('Place details:', data.status, data.error_message || '');
      }
      return null;
    }
    return toPlaceLocation(data.result, 'exact');
  } catch (error) {
    console.warn('Place details failed', error);
    return null;
  }
}

export async function autocompletePlaces(
  input: string,
  options?: { prefer?: 'all' | 'schools' }
): Promise<PlaceSuggestion[]> {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 2) return [];
  const prefer = options?.prefer || 'all';

  const universities = await searchUniversities(trimmed, prefer === 'schools' ? 10 : 6);
  const schoolSuggestions: PlaceSuggestion[] = universities.map((school) => ({
    placeId: school.id,
    label: `${school.name}, ${school.city}, ${school.state}`,
    main: school.name,
    secondary: `${school.city}, ${school.state}`,
    kind: 'university',
  }));

  if (prefer === 'schools') {
    return schoolSuggestions.length
      ? schoolSuggestions
      : [
          {
            placeId: `text:${trimmed}`,
            label: trimmed,
            main: trimmed,
            secondary: 'Use as typed',
            kind: 'place',
          },
        ];
  }

  const google = await googleAutocomplete(trimmed);
  const placeSuggestions: PlaceSuggestion[] = google.length
    ? google.map((item) => ({ ...item, kind: 'place' as const }))
    : (await nominatimSearch(trimmed, 5)).map((place) => ({
        placeId: place.placeId || `nominatim:${place.label}`,
        label: place.label,
        main: place.city || place.label.split(',')[0] || place.label,
        secondary:
          [place.state, place.country].filter(Boolean).join(', ') ||
          place.label.split(',').slice(1).join(',').trim(),
        kind: 'place' as const,
      }));

  if (!placeSuggestions.length) {
    const known = knownPlaceMatch(trimmed);
    if (known) {
      placeSuggestions.push({
        placeId: `known:${normalizeKey(known.label)}`,
        label: known.label,
        main: known.city || known.label,
        secondary: [known.state, known.country].filter(Boolean).join(', '),
        kind: 'place',
      });
    }
  }

  const merged: PlaceSuggestion[] = [];
  const seen = new Set<string>();
  for (const item of [...schoolSuggestions, ...placeSuggestions]) {
    const key = `${item.kind}|${item.main.toLowerCase()}|${item.secondary.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= 10) break;
  }

  if (!merged.length) {
    return [
      {
        placeId: `text:${trimmed}`,
        label: trimmed,
        main: trimmed,
        secondary: 'Use as typed',
        kind: 'place',
      },
    ];
  }

  return merged;
}

export async function placeFromId(placeId: string, fallbackQuery?: string): Promise<PlaceLocation | null> {
  if (placeId.startsWith('text:')) {
    return resolvePlaceQuery(placeId.slice(5) || fallbackQuery || '');
  }
  if (placeId.startsWith('known:')) {
    return knownPlaceMatch(placeId.slice(6)) || (fallbackQuery ? knownPlaceMatch(fallbackQuery) : null);
  }
  if (
    placeId.startsWith('scorecard:') ||
    placeId.startsWith('curated-') ||
    placeId.startsWith('university:')
  ) {
    const school = await universityFromId(placeId);
    if (school) return universityToPlace(school);
    const curated = findCuratedUniversity(fallbackQuery || placeId);
    if (curated) return universityToPlace(curated);
  }
  if (placeId.startsWith('nominatim:')) {
    const idOrLabel = placeId.slice('nominatim:'.length);
    if (/^\d+$/.test(idOrLabel) && fallbackQuery) {
      return resolvePlaceQuery(fallbackQuery);
    }
    return resolvePlaceQuery(fallbackQuery || idOrLabel);
  }

  const details = await cachedIfPresent(cacheKey(['place', placeId]), 24 * 60 * 60 * 1000, () =>
    googlePlaceDetails(placeId)
  );
  if (details) return details;

  if (fallbackQuery) {
    return resolvePlaceQuery(fallbackQuery);
  }
  return null;
}

export async function resolvePlaceQuery(query: string): Promise<PlaceLocation> {
  const trimmed = query.trim();
  if (!trimmed) {
    return textPlace('');
  }

  // Prefer official schools when the query looks like a campus name.
  const curatedSchool = findCuratedUniversity(trimmed.replace(/\s*·.*$/, ''));
  if (curatedSchool) return universityToPlace(curatedSchool);

  if (/\b(university|college|institute|polytechnic)\b/i.test(trimmed) || trimmed.includes('·')) {
    const schools = await searchUniversities(trimmed.replace(/\s*·.*$/, ''), 1);
    if (schools[0]) return universityToPlace(schools[0]);
  }

  // IATA airport codes
  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    const code = toAirportCode(trimmed);
    if (code) {
      const known = knownPlaceMatch(code) || knownPlaceMatch(trimmed);
      if (known) {
        return { ...known, label: `${code} · ${known.label}`, query: known.query, confidence: 'approximate' };
      }
      return {
        label: code,
        query: code,
        city: code,
        confidence: 'text',
      };
    }
  }

  const cachedHit = await cachedIfPresent(
    cacheKey(['resolve-place-v3', trimmed.toLowerCase()]),
    6 * 60 * 60 * 1000,
    async () => {
      const google = await googleGeocodePlace(trimmed);
      if (google) return google;

      const nominatim = await nominatimSearch(trimmed, 1);
      if (nominatim[0]) return nominatim[0];

      const known = knownPlaceMatch(trimmed);
      if (known) return known;

      const schools = await searchUniversities(trimmed, 1);
      if (schools[0]) return universityToPlace(schools[0]);

      return null;
    }
  );

  if (cachedHit) return cachedHit;

  // Soft place — travel search can still run on the typed string.
  return textPlace(trimmed);
}

/** Always returns a place; never throws for empty geocoder results. */
export async function resolvePlaceBestEffort(input: {
  placeId?: string;
  query?: string;
}): Promise<{ place: PlaceLocation; source: string }> {
  const query = (input.query || '').trim();
  const placeId = (input.placeId || '').trim();

  if (placeId) {
    const fromId = await placeFromId(placeId, query);
    if (fromId) return { place: fromId, source: 'placeId' };
  }

  if (query) {
    const resolved = await resolvePlaceQuery(query);
    return {
      place: resolved,
      source: resolved.confidence === 'text' ? 'text' : resolved.confidence || 'resolved',
    };
  }

  return { place: textPlace(query || 'Unknown'), source: 'empty' };
}

export function placeTravelQuery(place: PlaceLocation): string {
  if (place.city && place.state) return `${place.city}, ${place.state}`;
  return place.query || place.label;
}

export function placeCoordsQuery(place: PlaceLocation): string | null {
  if (typeof place.lat !== 'number' || typeof place.lon !== 'number') return null;
  if (!Number.isFinite(place.lat) || !Number.isFinite(place.lon)) return null;
  return `${place.lat},${place.lon}`;
}

export function placeHasCoords(place: PlaceLocation | null | undefined): place is PlaceLocation & {
  lat: number;
  lon: number;
} {
  return Boolean(
    place &&
      typeof place.lat === 'number' &&
      typeof place.lon === 'number' &&
      Number.isFinite(place.lat) &&
      Number.isFinite(place.lon)
  );
}
