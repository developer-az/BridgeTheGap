const CITY_IATA: Record<string, string> = {
  boston: 'BOS',
  'cambridge ma': 'BOS',
  'new york': 'JFK',
  nyc: 'JFK',
  manhattan: 'LGA',
  brooklyn: 'JFK',
  philadelphia: 'PHL',
  'college park': 'DCA',
  'washington': 'DCA',
  'washington dc': 'DCA',
  baltimore: 'BWI',
  chicago: 'ORD',
  'los angeles': 'LAX',
  'san francisco': 'SFO',
  seattle: 'SEA',
  atlanta: 'ATL',
  miami: 'MIA',
  dallas: 'DFW',
  austin: 'AUS',
  houston: 'IAH',
  denver: 'DEN',
  detroit: 'DTW',
  'ann arbor': 'DTW',
  pittsburgh: 'PIT',
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

export function toAirportCode(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z]{3}$/.test(trimmed)) return trimmed.toUpperCase();

  const key = trimmed
    .toLowerCase()
    .replace(/,.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return CITY_IATA[key] || null;
}
