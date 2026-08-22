import { cacheKey } from './cache';

export type GeoPoint = {
  lat: number;
  lon: number;
  label: string;
};

type CacheEntry = { value: GeoPoint; expires: number };
const geoStore = new Map<string, CacheEntry>();

function storePeek(key: string): GeoPoint | null {
  const hit = geoStore.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  return null;
}

function storeSet(key: string, value: GeoPoint, ttlMs: number) {
  geoStore.set(key, { value, expires: Date.now() + ttlMs });
}

async function googleGeocode(query: string): Promise<GeoPoint | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const attempts = [
    { address: query, components: 'country:US' },
    { address: query, components: undefined as string | undefined },
    { address: `${query}, USA`, components: undefined },
  ];

  for (const attempt of attempts) {
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('address', attempt.address);
      if (attempt.components) url.searchParams.set('components', attempt.components);
      url.searchParams.set('key', key);

      const response = await fetch(url.toString());
      if (!response.ok) continue;
      const data = (await response.json()) as {
        status: string;
        results?: Array<{
          formatted_address: string;
          geometry: { location: { lat: number; lng: number } };
        }>;
      };

      if (data.status === 'OK' && data.results?.[0]) {
        return {
          lat: data.results[0].geometry.location.lat,
          lon: data.results[0].geometry.location.lng,
          label: data.results[0].formatted_address,
        };
      }
    } catch {
      /* try next */
    }
  }

  return null;
}

export async function geocode(query: string): Promise<GeoPoint | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const key = cacheKey(['geo-v2', trimmed]);
  const hit = storePeek(key);
  if (hit) return hit;

  const google = await googleGeocode(trimmed);
  if (google) {
    storeSet(key, google, 24 * 60 * 60 * 1000);
    return google;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BridgeTheGap/1.0 (long-distance planner; https://bridgethegap.app)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;
    const data = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!data[0]) return null;

    const point = {
      lat: Number(data[0].lat),
      lon: Number(data[0].lon),
      label: data[0].display_name,
    };
    storeSet(key, point, 24 * 60 * 60 * 1000);
    return point;
  } catch {
    return null;
  }
}

export function haversineMiles(a: GeoPoint, b: GeoPoint): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours && rest) return `${hours}h ${rest}m`;
  if (hours) return `${hours}h`;
  return `${rest}m`;
}

export function addMinutes(date: string, minutes: number, hour = 8, minute = 0): string {
  const base = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  base.setMinutes(base.getMinutes() + minutes);
  return base.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function isoAt(date: string, hour: number, minute = 0): string {
  const base = new Date(`${date}T00:00:00`);
  base.setHours(hour, minute, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date}T${pad(base.getHours())}:${pad(base.getMinutes())}:00`;
}
