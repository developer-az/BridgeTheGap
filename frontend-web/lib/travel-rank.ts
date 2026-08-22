import { FlightOffer, GroundTransport, TravelOffer } from '@/types';

export function offerPrice(offer: TravelOffer): number {
  const value = Number(offer.price?.total);
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

export function offerDurationMinutes(offer: TravelOffer): number {
  if (offer.type !== 'flight') return offer.durationMinutes || 0;
  const iso = offer.itineraries?.[0]?.duration || '';
  const hours = Number(iso.match(/(\d+)H/)?.[1] || 0);
  const minutes = Number(iso.match(/(\d+)M/)?.[1] || 0);
  return hours * 60 + minutes;
}

export function flattenOffers(input: {
  flights?: FlightOffer[] | { error: string };
  trains?: GroundTransport[] | { error: string };
  buses?: GroundTransport[] | { error: string };
}): TravelOffer[] {
  const flights = Array.isArray(input.flights) ? input.flights : [];
  const trains = Array.isArray(input.trains) ? input.trains : [];
  const buses = Array.isArray(input.buses) ? input.buses : [];
  return [...flights, ...trains, ...buses];
}

export function rankOffers(
  offers: TravelOffer[],
  sort: 'cheapest' | 'fastest' | 'balanced' = 'cheapest'
): TravelOffer[] {
  const copy = [...offers];
  if (sort === 'fastest') {
    return copy.sort(
      (a, b) =>
        offerDurationMinutes(a) - offerDurationMinutes(b) || offerPrice(a) - offerPrice(b)
    );
  }
  if (sort === 'balanced') {
    return copy.sort((a, b) => {
      const score = (offer: TravelOffer) => offerPrice(offer) + offerDurationMinutes(offer) * 0.12;
      return score(a) - score(b);
    });
  }
  return copy.sort(
    (a, b) => offerPrice(a) - offerPrice(b) || offerDurationMinutes(a) - offerDurationMinutes(b)
  );
}

export function cheapestOffer(offers: TravelOffer[]): TravelOffer | null {
  if (!offers.length) return null;
  return rankOffers(offers, 'cheapest')[0] || null;
}

export function formatMoney(amount: number, currency = 'USD'): string {
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount)}`;
  }
}
