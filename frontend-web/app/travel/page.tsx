'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { HotelCard } from '@/components/HotelCard';
import { OfferCard } from '@/components/OfferCard';
import { PlaceInput } from '@/components/PlaceInput';
import { TripCalculator } from '@/components/TripCalculator';
import { Button, EmptyState, Kicker } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { stashPendingPlan } from '@/lib/pending';
import {
  cheapestHotel,
  cheapestOffer,
  flattenOffers,
  formatMoney,
  hotelPerNight,
  offerPrice,
  rankOffers,
} from '@/lib/travel-rank';
import { HotelOffer, PlaceLocation, TravelOffer, TravelPlan, TravelSearchResults, User } from '@/types';

const SEARCH_KEY = 'btg:lastTravelSearch';

type RememberedSearch = {
  origin?: string;
  destination?: string;
  originPlace?: PlaceLocation | null;
  destinationPlace?: PlaceLocation | null;
  date?: string;
  returnDate?: string;
  modes?: string[];
};

function asHotels(results: TravelSearchResults | null): HotelOffer[] {
  if (!results || !Array.isArray(results.hotels)) return [];
  return results.hotels;
}

function loadLastSearch(): RememberedSearch | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(SEARCH_KEY) || 'null') as RememberedSearch | null;
  } catch {
    return null;
  }
}

function TravelPageInner() {
  const searchParams = useSearchParams();
  const { session, profile } = useAuth();
  const remembered = useMemo(() => loadLastSearch(), []);

  const [origin, setOrigin] = useState(
    searchParams.get('origin') || remembered?.origin || profile?.location_city || ''
  );
  const [destination, setDestination] = useState(
    searchParams.get('destination') || remembered?.destination || ''
  );
  const [originPlace, setOriginPlace] = useState<PlaceLocation | null>(remembered?.originPlace || null);
  const [destinationPlace, setDestinationPlace] = useState<PlaceLocation | null>(
    remembered?.destinationPlace || null
  );
  const [date, setDate] = useState(searchParams.get('date') || remembered?.date || '');
  const [returnDate, setReturnDate] = useState(
    searchParams.get('return') || remembered?.returnDate || ''
  );
  const [modes, setModes] = useState<string[]>(
    remembered?.modes || ['flight', 'train', 'bus', 'hotel']
  );
  const [sort, setSort] = useState<'cheapest' | 'fastest' | 'balanced'>('cheapest');
  const [results, setResults] = useState<TravelSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<TravelPlan[]>([]);
  const [gateOpen, setGateOpen] = useState(false);
  const [partner, setPartner] = useState<User | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  const partnerId = searchParams.get('partner');

  useEffect(() => {
    if (!session) return;
    api.getTravelPlans().then(setSaved).catch(() => setSaved([]));
  }, [session]);

  useEffect(() => {
    if (profile?.location_city && !origin && !searchParams.get('origin')) {
      const label = profile.location_state
        ? `${profile.location_city}, ${profile.location_state}`
        : profile.location_city;
      setOrigin(label);
      void api.resolvePlace({ query: label }).then((data) => setOriginPlace(data.place)).catch(() => {});
    }
  }, [profile, origin, searchParams]);

  const partnerDestination = (person: User) =>
    person.location_state
      ? `${person.location_city}, ${person.location_state}`
      : person.location_city || '';

  useEffect(() => {
    if (!partnerId || !session) return;
    api
      .getUser(partnerId)
      .then((person: User) => {
        setPartner(person);
        if (person.location_city && !searchParams.get('destination')) {
          const label = partnerDestination(person);
          setDestination(label);
          void api.resolvePlace({ query: label }).then((data) => setDestinationPlace(data.place)).catch(() => {});
        }
      })
      .catch(() => {});
  }, [partnerId, session, searchParams]);

  useEffect(() => {
    if (!session || partnerId) return;
    api
      .getConnections()
      .then((list: { status: string; partner?: User }[]) => {
        const accepted = list.find((item) => item.status === 'accepted' && item.partner);
        if (!accepted?.partner) return;
        setPartner(accepted.partner);
        if (!destination && accepted.partner.location_city) {
          const label = partnerDestination(accepted.partner);
          setDestination(label);
          void api.resolvePlace({ query: label }).then((data) => setDestinationPlace(data.place)).catch(() => {});
        }
      })
      .catch(() => {});
  }, [session, partnerId, destination]);

  const runSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    setError('');
    setLoading(true);
    setSelectedId(null);
    setSelectedHotelId(null);

    let resolvedOrigin = originPlace;
    let resolvedDestination = destinationPlace;

    try {
      const softResolve = async (query: string, existing: PlaceLocation | null) => {
        if (existing?.confidence === 'exact' || existing?.confidence === 'approximate') {
          return existing;
        }
        try {
          const data = await api.resolvePlace({
            query: query.trim(),
            placeId: existing?.placeId,
          });
          return (data.place as PlaceLocation) || existing;
        } catch {
          return (
            existing || {
              label: query.trim(),
              query: query.trim(),
              confidence: 'text' as const,
            }
          );
        }
      };

      if (origin.trim()) {
        resolvedOrigin = await softResolve(origin, resolvedOrigin);
        if (resolvedOrigin) {
          setOriginPlace(resolvedOrigin);
          if (resolvedOrigin.confidence !== 'text') setOrigin(resolvedOrigin.label);
        }
      }
      if (destination.trim()) {
        resolvedDestination = await softResolve(destination, resolvedDestination);
        if (resolvedDestination) {
          setDestinationPlace(resolvedDestination);
          if (resolvedDestination.confidence !== 'text') setDestination(resolvedDestination.label);
        }
      }

      const data = await api.searchTravel({
        origin: resolvedOrigin?.label || origin,
        destination: resolvedDestination?.label || destination,
        originPlace: resolvedOrigin,
        destinationPlace: resolvedDestination,
        date,
        returnDate: returnDate || undefined,
        modes,
      });
      setResults(data);
      const flat = flattenOffers(data);
      const bestOffer = cheapestOffer(flat);
      if (bestOffer) setSelectedId(bestOffer.id);
      const hotels = asHotels(data);
      const bestHotel = cheapestHotel(hotels);
      if (bestHotel) setSelectedHotelId(bestHotel.id);
      localStorage.setItem(
        SEARCH_KEY,
        JSON.stringify({
          origin: resolvedOrigin?.label || origin,
          destination: resolvedDestination?.label || destination,
          originPlace: resolvedOrigin,
          destinationPlace: resolvedDestination,
          date,
          returnDate,
          modes,
        })
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('go') === '1' && origin && destination && date) {
      void runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keep = async (routes?: unknown) => {
    const plan = {
      origin,
      destination,
      travel_date: date,
      return_date: returnDate || undefined,
      saved_routes: routes || results,
      partner_id: partner?.id || partnerId || undefined,
    };
    if (!session) {
      stashPendingPlan(plan);
      setGateOpen(true);
      return;
    }
    try {
      const savedPlan = await api.saveTravelPlan(plan);
      setSaved((current) => [savedPlan, ...current]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not keep this trip');
    }
  };

  const offers = useMemo(() => {
    if (!results) return [] as TravelOffer[];
    return rankOffers(flattenOffers(results), sort);
  }, [results, sort]);

  const best = useMemo(() => cheapestOffer(offers), [offers]);
  const selected = offers.find((offer) => offer.id === selectedId) || best;

  const toggleMode = (mode: string) => {
    setModes((current) =>
      current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode]
    );
  };

  const hotels = useMemo(() => asHotels(results), [results]);
  const bestHotel = useMemo(() => cheapestHotel(hotels), [hotels]);
  const selectedHotel = hotels.find((hotel) => hotel.id === selectedHotelId) || bestHotel;

  const swapCities = () => {
    setOrigin(destination);
    setDestination(origin);
    setOriginPlace(destinationPlace);
    setDestinationPlace(originPlace);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <Kicker>{partner ? `Toward ${partner.name || 'them'}` : 'Travel'}</Kicker>
      <h1 className="font-display mt-3 text-4xl md:text-6xl">The way there</h1>
      <p className="mt-4 max-w-xl text-[var(--espresso-soft)]">
        Search real places — campus, city, airport — then find the cheapest way there and where to stay.
        Tickets and rooms open with the provider; this house does not sell them.
      </p>

      <form
        onSubmit={runSearch}
        className="mt-10 grid gap-3 border border-[var(--line-strong)] bg-[var(--paper)] p-5 md:grid-cols-12"
      >
        <div className="md:col-span-3">
          <PlaceInput
            id="origin"
            label="From"
            value={origin}
            place={originPlace}
            onValueChange={setOrigin}
            onPlaceChange={setOriginPlace}
            placeholder="Your campus or city"
            required
          />
        </div>
        <div className="flex items-end md:col-span-1">
          <button
            type="button"
            onClick={swapCities}
            className="mb-1 w-full border border-[var(--line-strong)] py-3 text-[0.68rem] uppercase tracking-[0.14em] hover:border-[var(--espresso)]"
            aria-label="Swap places"
          >
            Swap
          </button>
        </div>
        <div className="md:col-span-3">
          <PlaceInput
            id="destination"
            label="To"
            value={destination}
            place={destinationPlace}
            onValueChange={setDestination}
            onPlaceChange={setDestinationPlace}
            placeholder={partner?.location_city || 'Their campus or city'}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="date">Leave</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="returnDate">Return</label>
          <input
            id="returnDate"
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>
        <div className="flex items-end md:col-span-1">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Looking' : 'Look'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-5 md:col-span-12">
          {(
            [
              ['flight', 'Flight'],
              ['train', 'Rail'],
              ['bus', 'Coach'],
              ['hotel', 'Hotel'],
            ] as const
          ).map(([mode, label]) => (
            <label
              key={mode}
              className="flex cursor-pointer items-center gap-2 text-[0.72rem] uppercase tracking-[0.14em] text-[var(--espresso-soft)]"
            >
              <input
                type="checkbox"
                checked={modes.includes(mode)}
                onChange={() => toggleMode(mode)}
                className="h-3.5 w-3.5 accent-[var(--espresso)]"
              />
              {label}
            </label>
          ))}
        </div>
      </form>

      {results?.resolved?.origin && results?.resolved?.destination && (
        <p className="mt-4 text-sm text-[var(--espresso-soft)]">
          Searching {results.resolved.origin.label} → {results.resolved.destination.label}
          {(results.resolved.origin.confidence === 'text' ||
            results.resolved.destination.confidence === 'text') && (
            <span className="ml-2 text-[var(--stone-dark)]">
              · one place is approximate — pick a suggestion for a tighter match
            </span>
          )}
        </p>
      )}

      {error && <p className="mt-4 text-sm text-[var(--oxblood)]">{error}</p>}

      {results && offers.length === 0 && hotels.length === 0 && (
        <div className="mt-10">
          <EmptyState
            title="Nothing came back"
            body="Pick a place from the suggestions so city and state are pinned, then try again."
          />
        </div>
      )}

      {(offers.length > 0 || hotels.length > 0) && (
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
          <div>
            {best && (
              <div className="mb-6 border border-[var(--live)]/25 bg-[var(--ivory)] px-5 py-4">
                <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--live)]">
                  Cheapest fare
                </p>
                <p className="font-display mt-1 text-2xl">
                  {formatMoney(offerPrice(best))} ·{' '}
                  {best.type === 'flight' ? 'Flight' : best.type === 'train' ? 'Rail' : 'Coach'}
                </p>
                <button
                  type="button"
                  className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--live)] hover:text-[var(--espresso)]"
                  onClick={() => setSelectedId(best.id)}
                >
                  Put it in the calculator
                </button>
              </div>
            )}

            {bestHotel && (
              <div className="mb-6 border border-[var(--live)]/25 bg-[var(--ivory)] px-5 py-4">
                <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--live)]">
                  Cheapest stay
                </p>
                <p className="font-display mt-1 text-2xl">
                  {formatMoney(hotelPerNight(bestHotel), bestHotel.price.currency)}/night · {bestHotel.name}
                </p>
                <button
                  type="button"
                  className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-[var(--live)] hover:text-[var(--espresso)]"
                  onClick={() => setSelectedHotelId(bestHotel.id)}
                >
                  Put it in the calculator
                </button>
              </div>
            )}

            {offers.length > 0 && (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h2 className="font-display text-3xl">Transport</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    {(
                      [
                        ['cheapest', 'Cheapest'],
                        ['fastest', 'Fastest'],
                        ['balanced', 'Balanced'],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSort(value)}
                        className={`text-[0.68rem] uppercase tracking-[0.14em] ${
                          sort === value
                            ? 'text-[var(--oxblood)]'
                            : 'text-[var(--stone-dark)] hover:text-[var(--espresso)]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => keep()}
                      className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]"
                    >
                      Keep this search
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {offers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      selected={selected?.id === offer.id}
                      badge={best?.id === offer.id ? 'Cheapest' : undefined}
                      onSelect={() => setSelectedId(offer.id)}
                      onKeep={() => keep(offer)}
                    />
                  ))}
                </div>
              </>
            )}

            {hotels.length > 0 && (
              <section className={offers.length > 0 ? 'mt-12' : ''}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <h2 className="font-display text-3xl">Hotels</h2>
                  <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[var(--stone-dark)]">
                    Near {results?.resolved?.destination?.city || destination}
                  </p>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {hotels.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      offer={hotel}
                      selected={selectedHotel?.id === hotel.id}
                      badge={bestHotel?.id === hotel.id ? 'Cheapest' : undefined}
                      onSelect={() => setSelectedHotelId(hotel.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <TripCalculator
              selected={selected}
              cheapest={best}
              selectedHotel={selectedHotel}
              cheapestHotel={bestHotel}
              origin={results?.resolved?.origin?.label || origin}
              destination={results?.resolved?.destination?.label || destination}
              date={date}
              returnDate={returnDate || undefined}
              onSelectCheapest={() => best && setSelectedId(best.id)}
              onSelectCheapestHotel={() => bestHotel && setSelectedHotelId(bestHotel.id)}
            />
          </div>
        </div>
      )}

      {session && saved.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-3xl">Kept</h2>
          <ul className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {saved.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-display text-xl">
                    {plan.origin} → {plan.destination}
                  </p>
                  <p className="text-sm text-[var(--stone-dark)]">{plan.travel_date}</p>
                </div>
                <button
                  type="button"
                  className="text-[0.7rem] uppercase tracking-[0.14em] text-[var(--stone-dark)] hover:text-[var(--oxblood)]"
                  onClick={async () => {
                    await api.deleteTravelPlan(plan.id);
                    setSaved((current) => current.filter((item) => item.id !== plan.id));
                  }}
                >
                  Release
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AuthGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        intent="Keep this trip in the house."
        nextPath="/travel"
      />
    </div>
  );
}

export default function TravelPage() {
  return (
    <Suspense
      fallback={<div className="px-5 py-24 text-center text-[var(--stone-dark)]">Loading the desk…</div>}
    >
      <TravelPageInner />
    </Suspense>
  );
}
