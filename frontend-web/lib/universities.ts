import { PlaceLocation } from '@/types';
import { cached, cacheKey } from './cache';

export type UniversityRecord = {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  aliases?: string[];
  source: 'curated' | 'scorecard';
};

/** Fast local matches for common LDR campuses and nicknames. */
const CURATED: UniversityRecord[] = [
  { id: 'curated-harvard', name: 'Harvard University', city: 'Cambridge', state: 'MA', lat: 42.377, lon: -71.1167, aliases: ['harvard'], source: 'curated' },
  { id: 'curated-mit', name: 'Massachusetts Institute of Technology', city: 'Cambridge', state: 'MA', lat: 42.3601, lon: -71.0942, aliases: ['mit'], source: 'curated' },
  { id: 'curated-bu', name: 'Boston University', city: 'Boston', state: 'MA', lat: 42.3505, lon: -71.1054, aliases: ['bu'], source: 'curated' },
  { id: 'curated-bc', name: 'Boston College', city: 'Chestnut Hill', state: 'MA', lat: 42.3355, lon: -71.1685, aliases: ['bc'], source: 'curated' },
  { id: 'curated-nu', name: 'Northeastern University', city: 'Boston', state: 'MA', lat: 42.3398, lon: -71.0892, aliases: ['northeastern', 'neu'], source: 'curated' },
  { id: 'curated-yale', name: 'Yale University', city: 'New Haven', state: 'CT', lat: 41.3163, lon: -72.9223, aliases: ['yale'], source: 'curated' },
  { id: 'curated-princeton', name: 'Princeton University', city: 'Princeton', state: 'NJ', lat: 40.3431, lon: -74.6551, aliases: ['princeton'], source: 'curated' },
  { id: 'curated-columbia', name: 'Columbia University', city: 'New York', state: 'NY', lat: 40.8075, lon: -73.9626, aliases: ['columbia'], source: 'curated' },
  { id: 'curated-cornell', name: 'Cornell University', city: 'Ithaca', state: 'NY', lat: 42.4534, lon: -76.4735, aliases: ['cornell'], source: 'curated' },
  { id: 'curated-upenn', name: 'University of Pennsylvania', city: 'Philadelphia', state: 'PA', lat: 39.9522, lon: -75.1932, aliases: ['upenn', 'penn'], source: 'curated' },
  { id: 'curated-brown', name: 'Brown University', city: 'Providence', state: 'RI', lat: 41.8268, lon: -71.4025, aliases: ['brown'], source: 'curated' },
  { id: 'curated-dartmouth', name: 'Dartmouth College', city: 'Hanover', state: 'NH', lat: 43.7044, lon: -72.2887, aliases: ['dartmouth'], source: 'curated' },
  { id: 'curated-umd', name: 'University of Maryland-College Park', city: 'College Park', state: 'MD', lat: 38.9869, lon: -76.9426, aliases: ['umd', 'maryland', 'university of maryland'], source: 'curated' },
  { id: 'curated-umbc', name: 'University of Maryland-Baltimore County', city: 'Baltimore', state: 'MD', lat: 39.2557, lon: -76.711, aliases: ['umbc'], source: 'curated' },
  { id: 'curated-georgetown', name: 'Georgetown University', city: 'Washington', state: 'DC', lat: 38.9076, lon: -77.0723, aliases: ['georgetown', 'gu'], source: 'curated' },
  { id: 'curated-gwu', name: 'George Washington University', city: 'Washington', state: 'DC', lat: 38.8997, lon: -77.0486, aliases: ['gwu', 'george washington'], source: 'curated' },
  { id: 'curated-american', name: 'American University', city: 'Washington', state: 'DC', lat: 38.937, lon: -77.0901, aliases: ['american university', 'au'], source: 'curated' },
  { id: 'curated-howard', name: 'Howard University', city: 'Washington', state: 'DC', lat: 38.9227, lon: -77.0194, aliases: ['howard'], source: 'curated' },
  { id: 'curated-jhu', name: 'Johns Hopkins University', city: 'Baltimore', state: 'MD', lat: 39.3299, lon: -76.6205, aliases: ['jhu', 'johns hopkins', 'hopkins'], source: 'curated' },
  { id: 'curated-uva', name: 'University of Virginia', city: 'Charlottesville', state: 'VA', lat: 38.0336, lon: -78.508, aliases: ['uva'], source: 'curated' },
  { id: 'curated-vt', name: 'Virginia Polytechnic Institute and State University', city: 'Blacksburg', state: 'VA', lat: 37.2284, lon: -80.4234, aliases: ['virginia tech', 'vt'], source: 'curated' },
  { id: 'curated-unc', name: 'University of North Carolina at Chapel Hill', city: 'Chapel Hill', state: 'NC', lat: 35.9049, lon: -79.0469, aliases: ['unc', 'chapel hill'], source: 'curated' },
  { id: 'curated-duke', name: 'Duke University', city: 'Durham', state: 'NC', lat: 36.0014, lon: -78.9382, aliases: ['duke'], source: 'curated' },
  { id: 'curated-ncsu', name: 'North Carolina State University', city: 'Raleigh', state: 'NC', lat: 35.7847, lon: -78.6821, aliases: ['nc state', 'ncsu'], source: 'curated' },
  { id: 'curated-gatech', name: 'Georgia Institute of Technology', city: 'Atlanta', state: 'GA', lat: 33.7756, lon: -84.3963, aliases: ['georgia tech', 'gatech'], source: 'curated' },
  { id: 'curated-emory', name: 'Emory University', city: 'Atlanta', state: 'GA', lat: 33.7925, lon: -84.324, aliases: ['emory'], source: 'curated' },
  { id: 'curated-uf', name: 'University of Florida', city: 'Gainesville', state: 'FL', lat: 29.6436, lon: -82.3549, aliases: ['uf', 'florida'], source: 'curated' },
  { id: 'curated-umich', name: 'University of Michigan-Ann Arbor', city: 'Ann Arbor', state: 'MI', lat: 42.278, lon: -83.7382, aliases: ['umich', 'michigan', 'u of m'], source: 'curated' },
  { id: 'curated-msu', name: 'Michigan State University', city: 'East Lansing', state: 'MI', lat: 42.7018, lon: -84.4822, aliases: ['msu'], source: 'curated' },
  { id: 'curated-osu', name: 'Ohio State University', city: 'Columbus', state: 'OH', lat: 40.0067, lon: -83.0305, aliases: ['osu', 'ohio state'], source: 'curated' },
  { id: 'curated-psu', name: 'Pennsylvania State University', city: 'University Park', state: 'PA', lat: 40.7982, lon: -77.8599, aliases: ['penn state', 'psu'], source: 'curated' },
  { id: 'curated-pitt', name: 'University of Pittsburgh', city: 'Pittsburgh', state: 'PA', lat: 40.4444, lon: -79.9608, aliases: ['pitt'], source: 'curated' },
  { id: 'curated-cmu', name: 'Carnegie Mellon University', city: 'Pittsburgh', state: 'PA', lat: 40.4433, lon: -79.9436, aliases: ['cmu', 'carnegie mellon'], source: 'curated' },
  { id: 'curated-uiuc', name: 'University of Illinois Urbana-Champaign', city: 'Champaign', state: 'IL', lat: 40.102, lon: -88.2272, aliases: ['uiuc', 'illinois'], source: 'curated' },
  { id: 'curated-uchicago', name: 'University of Chicago', city: 'Chicago', state: 'IL', lat: 41.7886, lon: -87.5987, aliases: ['uchicago', 'u chicago'], source: 'curated' },
  { id: 'curated-northwestern', name: 'Northwestern University', city: 'Evanston', state: 'IL', lat: 42.0565, lon: -87.6753, aliases: ['northwestern', 'nu'], source: 'curated' },
  { id: 'curated-uwmadison', name: 'University of Wisconsin-Madison', city: 'Madison', state: 'WI', lat: 43.0766, lon: -89.4125, aliases: ['uw madison', 'wisconsin'], source: 'curated' },
  { id: 'curated-umn', name: 'University of Minnesota-Twin Cities', city: 'Minneapolis', state: 'MN', lat: 44.974, lon: -93.2277, aliases: ['umn', 'minnesota'], source: 'curated' },
  { id: 'curated-indiana', name: 'Indiana University-Bloomington', city: 'Bloomington', state: 'IN', lat: 39.1682, lon: -86.523, aliases: ['iu', 'indiana'], source: 'curated' },
  { id: 'curated-purdue', name: 'Purdue University', city: 'West Lafayette', state: 'IN', lat: 40.4237, lon: -86.9212, aliases: ['purdue'], source: 'curated' },
  { id: 'curated-notre-dame', name: 'University of Notre Dame', city: 'Notre Dame', state: 'IN', lat: 41.7056, lon: -86.2353, aliases: ['notre dame', 'nd'], source: 'curated' },
  { id: 'curated-ut', name: 'The University of Texas at Austin', city: 'Austin', state: 'TX', lat: 30.2849, lon: -97.7341, aliases: ['ut austin', 'texas', 'ut'], source: 'curated' },
  { id: 'curated-tamu', name: 'Texas A&M University', city: 'College Station', state: 'TX', lat: 30.6187, lon: -96.3365, aliases: ['texas a&m', 'tamu'], source: 'curated' },
  { id: 'curated-rice', name: 'Rice University', city: 'Houston', state: 'TX', lat: 29.7174, lon: -95.4018, aliases: ['rice'], source: 'curated' },
  { id: 'curated-cu', name: 'University of Colorado Boulder', city: 'Boulder', state: 'CO', lat: 40.0076, lon: -105.2659, aliases: ['cu boulder', 'colorado'], source: 'curated' },
  { id: 'curated-asu', name: 'Arizona State University', city: 'Tempe', state: 'AZ', lat: 33.4242, lon: -111.9281, aliases: ['asu'], source: 'curated' },
  { id: 'curated-ucla', name: 'University of California-Los Angeles', city: 'Los Angeles', state: 'CA', lat: 34.0689, lon: -118.4452, aliases: ['ucla'], source: 'curated' },
  { id: 'curated-berkeley', name: 'University of California-Berkeley', city: 'Berkeley', state: 'CA', lat: 37.8719, lon: -122.2585, aliases: ['berkeley', 'cal', 'uc berkeley'], source: 'curated' },
  { id: 'curated-usc', name: 'University of Southern California', city: 'Los Angeles', state: 'CA', lat: 34.0224, lon: -118.2851, aliases: ['usc'], source: 'curated' },
  { id: 'curated-stanford', name: 'Stanford University', city: 'Stanford', state: 'CA', lat: 37.4275, lon: -122.1697, aliases: ['stanford'], source: 'curated' },
  { id: 'curated-ucsd', name: 'University of California-San Diego', city: 'La Jolla', state: 'CA', lat: 32.8801, lon: -117.234, aliases: ['ucsd'], source: 'curated' },
  { id: 'curated-uci', name: 'University of California-Irvine', city: 'Irvine', state: 'CA', lat: 33.6405, lon: -117.8443, aliases: ['uci'], source: 'curated' },
  { id: 'curated-ucsb', name: 'University of California-Santa Barbara', city: 'Santa Barbara', state: 'CA', lat: 34.414, lon: -119.8489, aliases: ['ucsb'], source: 'curated' },
  { id: 'curated-uw', name: 'University of Washington', city: 'Seattle', state: 'WA', lat: 47.6553, lon: -122.3035, aliases: ['uw', 'u dub', 'washington'], source: 'curated' },
  { id: 'curated-oregon', name: 'University of Oregon', city: 'Eugene', state: 'OR', lat: 44.0448, lon: -123.0726, aliases: ['uo', 'oregon'], source: 'curated' },
  { id: 'curated-osu-or', name: 'Oregon State University', city: 'Corvallis', state: 'OR', lat: 44.5646, lon: -123.262, aliases: ['oregon state'], source: 'curated' },
  { id: 'curated-nyu', name: 'New York University', city: 'New York', state: 'NY', lat: 40.7295, lon: -73.9965, aliases: ['nyu'], source: 'curated' },
  { id: 'curated-syracuse', name: 'Syracuse University', city: 'Syracuse', state: 'NY', lat: 43.0392, lon: -76.1351, aliases: ['syracuse', 'cuse'], source: 'curated' },
  { id: 'curated-rochester', name: 'University of Rochester', city: 'Rochester', state: 'NY', lat: 43.1306, lon: -77.626, aliases: ['u of r', 'rochester'], source: 'curated' },
  { id: 'curated-vandy', name: 'Vanderbilt University', city: 'Nashville', state: 'TN', lat: 36.1447, lon: -86.8027, aliases: ['vanderbilt', 'vandy'], source: 'curated' },
  { id: 'curated-tufts', name: 'Tufts University', city: 'Medford', state: 'MA', lat: 42.4075, lon: -71.119, aliases: ['tufts'], source: 'curated' },
  { id: 'curated-brandeis', name: 'Brandeis University', city: 'Waltham', state: 'MA', lat: 42.3654, lon: -71.2586, aliases: ['brandeis'], source: 'curated' },
  { id: 'curated-rutgers', name: 'Rutgers University-New Brunswick', city: 'New Brunswick', state: 'NJ', lat: 40.5008, lon: -74.4474, aliases: ['rutgers'], source: 'curated' },
];

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreUniversity(school: UniversityRecord, query: string): number {
  const q = normalize(query);
  if (!q) return 0;
  const name = normalize(school.name);
  const aliasHit = (school.aliases || []).some((alias) => normalize(alias) === q);
  if (aliasHit) return 100;
  if (name === q) return 95;
  if (name.startsWith(q)) return 90;
  if ((school.aliases || []).some((alias) => normalize(alias).startsWith(q))) return 88;
  if (name.includes(q)) return 70;
  if ((school.aliases || []).some((alias) => normalize(alias).includes(q))) return 65;
  // token overlap
  const qTokens = q.split(' ').filter((t) => t.length > 1);
  const nameTokens = new Set(name.split(' '));
  const hits = qTokens.filter((t) => nameTokens.has(t)).length;
  if (hits && hits === qTokens.length) return 60;
  if (hits) return 40 + hits * 5;
  return 0;
}

export function searchCuratedUniversities(query: string, limit = 6): UniversityRecord[] {
  return CURATED.map((school) => ({ school, score: scoreUniversity(school, query) }))
    .filter((row) => row.score >= 40)
    .sort((a, b) => b.score - a.score || a.school.name.localeCompare(b.school.name))
    .slice(0, limit)
    .map((row) => row.school);
}

async function searchScorecard(query: string, limit = 8): Promise<UniversityRecord[]> {
  const key = process.env.COLLEGE_SCORECARD_API_KEY || 'DEMO_KEY';
  const url = new URL('https://api.data.gov/ed/collegescorecard/v1/schools.json');
  url.searchParams.set('api_key', key);
  url.searchParams.set('school.name', query);
  url.searchParams.set('school.degrees_awarded.predominant', '3');
  url.searchParams.set('school.operating', '1');
  url.searchParams.set(
    'fields',
    'id,school.name,school.city,school.state,school.alias,location.lat,location.lon'
  );
  url.searchParams.set('per_page', String(limit));

  const response = await fetch(url.toString());
  if (!response.ok) return [];
  const data = (await response.json()) as {
    results?: Array<{
      id: number;
      'school.name': string;
      'school.city': string;
      'school.state': string;
      'school.alias'?: string | null;
      'location.lat'?: number;
      'location.lon'?: number;
    }>;
  };

  return (data.results || [])
    .filter((row) => row['location.lat'] != null && row['location.lon'] != null)
    .map((row) => ({
      id: `scorecard:${row.id}`,
      name: row['school.name'],
      city: row['school.city'],
      state: row['school.state'],
      lat: Number(row['location.lat']),
      lon: Number(row['location.lon']),
      aliases: row['school.alias']
        ? row['school.alias'].split('|').map((part) => part.trim()).filter(Boolean)
        : undefined,
      source: 'scorecard' as const,
    }));
}

export async function searchUniversities(query: string, limit = 8): Promise<UniversityRecord[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  return cached(cacheKey(['uni-search-v1', trimmed.toLowerCase()]), 30 * 60 * 1000, async () => {
    const curated = searchCuratedUniversities(trimmed, limit);
    let remote: UniversityRecord[] = [];
    try {
      remote = await searchScorecard(trimmed, limit);
    } catch (error) {
      console.warn('College Scorecard search failed', error);
    }

    const seen = new Set<string>();
    const merged: UniversityRecord[] = [];
    for (const school of [...curated, ...remote]) {
      const key = normalize(`${school.name}|${school.city}|${school.state}`);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(school);
      if (merged.length >= limit) break;
    }
    return merged;
  });
}

export function universityToPlace(school: UniversityRecord): PlaceLocation {
  const location = `${school.city}, ${school.state}`;
  return {
    label: `${school.name} · ${location}`,
    query: location,
    placeId: school.id.startsWith('scorecard:') || school.id.startsWith('curated-')
      ? school.id
      : `university:${school.id}`,
    lat: school.lat,
    lon: school.lon,
    city: school.city,
    state: school.state,
    country: 'US',
    confidence: 'exact',
    kind: 'university',
    universityName: school.name,
  };
}

export function findCuratedUniversity(idOrQuery: string): UniversityRecord | null {
  const trimmed = idOrQuery.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('curated-')) {
    return CURATED.find((school) => school.id === trimmed) || null;
  }
  const scored = searchCuratedUniversities(trimmed, 1);
  return scored[0] || null;
}

export async function universityFromId(placeId: string): Promise<UniversityRecord | null> {
  if (placeId.startsWith('curated-') || placeId.startsWith('university:')) {
    const id = placeId.replace(/^university:/, '');
    return findCuratedUniversity(id);
  }

  if (!placeId.startsWith('scorecard:')) return null;
  const numericId = placeId.replace(/^scorecard:/, '');
  const key = process.env.COLLEGE_SCORECARD_API_KEY || 'DEMO_KEY';
  const url = new URL('https://api.data.gov/ed/collegescorecard/v1/schools.json');
  url.searchParams.set('api_key', key);
  url.searchParams.set('id', numericId);
  url.searchParams.set(
    'fields',
    'id,school.name,school.city,school.state,school.alias,location.lat,location.lon'
  );
  url.searchParams.set('per_page', '1');

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return null;
    const data = (await response.json()) as {
      results?: Array<{
        id: number;
        'school.name': string;
        'school.city': string;
        'school.state': string;
        'school.alias'?: string | null;
        'location.lat'?: number;
        'location.lon'?: number;
      }>;
    };
    const row = data.results?.[0];
    if (!row || row['location.lat'] == null || row['location.lon'] == null) return null;
    return {
      id: `scorecard:${row.id}`,
      name: row['school.name'],
      city: row['school.city'],
      state: row['school.state'],
      lat: Number(row['location.lat']),
      lon: Number(row['location.lon']),
      aliases: row['school.alias']
        ? row['school.alias'].split('|').map((part) => part.trim()).filter(Boolean)
        : undefined,
      source: 'scorecard',
    };
  } catch {
    return null;
  }
}
