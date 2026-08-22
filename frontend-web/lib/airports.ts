const CITY_IATA: Record<string, string> = {
  boston: 'BOS',
  'cambridge ma': 'BOS',
  'cambridge, ma': 'BOS',
  'new york': 'JFK',
  'new york, ny': 'JFK',
  nyc: 'JFK',
  manhattan: 'LGA',
  brooklyn: 'JFK',
  philadelphia: 'PHL',
  'philadelphia, pa': 'PHL',
  'college park': 'DCA',
  'college park, md': 'DCA',
  washington: 'DCA',
  'washington dc': 'DCA',
  'washington, dc': 'DCA',
  baltimore: 'BWI',
  'baltimore, md': 'BWI',
  chicago: 'ORD',
  'chicago, il': 'ORD',
  'los angeles': 'LAX',
  'los angeles, ca': 'LAX',
  'san francisco': 'SFO',
  'san francisco, ca': 'SFO',
  seattle: 'SEA',
  'seattle, wa': 'SEA',
  atlanta: 'ATL',
  'atlanta, ga': 'ATL',
  miami: 'MIA',
  'miami, fl': 'MIA',
  dallas: 'DFW',
  'dallas, tx': 'DFW',
  austin: 'AUS',
  'austin, tx': 'AUS',
  houston: 'IAH',
  'houston, tx': 'IAH',
  denver: 'DEN',
  'denver, co': 'DEN',
  detroit: 'DTW',
  'detroit, mi': 'DTW',
  'ann arbor': 'DTW',
  'ann arbor, mi': 'DTW',
  pittsburgh: 'PIT',
  'pittsburgh, pa': 'PIT',
  cleveland: 'CLE',
  columbus: 'CMH',
  cincinnati: 'CVG',
  nashville: 'BNA',
  charlotte: 'CLT',
  raleigh: 'RDU',
  durham: 'RDU',
  'chapel hill': 'RDU',
  minneapolis: 'MSP',
  madison: 'MSN',
  milwaukee: 'MKE',
  stlouis: 'STL',
  'st louis': 'STL',
  'st. louis': 'STL',
  'kansas city': 'MCI',
  phoenix: 'PHX',
  'san diego': 'SAN',
  portland: 'PDX',
  orlando: 'MCO',
  tampa: 'TPA',
  'new orleans': 'MSY',
  providence: 'PVD',
  hartford: 'BDL',
  newark: 'EWR',
  ithaca: 'ITH',
  syracuse: 'SYR',
  buffalo: 'BUF',
  rochester: 'ROC',
  albany: 'ALB',
  princeton: 'EWR',
  'new haven': 'HVN',
  'state college': 'SCE',
  'university park': 'SCE',
};

function normalizePlaceKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toAirportCode(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();

  const full = normalizePlaceKey(trimmed);
  if (CITY_IATA[full]) return CITY_IATA[full];

  const withoutCountry = full.replace(/, usa$/, '').replace(/, us$/, '').trim();
  if (CITY_IATA[withoutCountry]) return CITY_IATA[withoutCountry];

  const cityOnly = withoutCountry.replace(/,.*$/, '').trim();
  return CITY_IATA[cityOnly] || null;
}

export function airportCandidates(input: string, city?: string, state?: string): string[] {
  const candidates = new Set<string>();
  const direct = toAirportCode(input);
  if (direct) candidates.add(direct);

  if (city && state) {
    const combo = toAirportCode(`${city}, ${state}`);
    if (combo) candidates.add(combo);
  }

  if (city) {
    const cityOnly = toAirportCode(city);
    if (cityOnly) candidates.add(cityOnly);
  }

  return [...candidates];
}
