import { cached, cacheKey } from './cache';

export type GeoPoint = {
  lat: number;
  lon: number;
  label: string;
};

export async function geocode(query: string): Promise<GeoPoint | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  return cached(cacheKey(['geo', trimmed]), 24 * 60 * 60 * 1000, async () => {
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

    return {
      lat: Number(data[0].lat),
      lon: Number(data[0].lon),
      label: data[0].display_name,
    };
  });
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
