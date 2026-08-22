'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { OfferCard } from '@/components/OfferCard';
import { TripCalculator } from '@/components/TripCalculator';
import { Button, EmptyState, Kicker } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { stashPendingPlan } from '@/lib/pending';
import { cheapestOffer, flattenOffers, formatMoney, offerPrice, rankOffers } from '@/lib/travel-rank';
import { TravelOffer, TravelPlan, TravelSearchResults, User } from '@/types';

const SEARCH_KEY = 'btg:lastTravelSearch';

type RememberedSearch = {
  origin?: string;
  destination?: string;
  date?: string;
  returnDate?: string;
  modes?: string[];
};

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
  const [date, setDate] = useState(searchParams.get('date') || remembered?.date || '');
  const [returnDate, setReturnDate] = useState(
    searchParams.get('return') || remembered?.returnDate || ''
  );
  const [modes, setModes] = useState<string[]>(remembered?.modes || ['flight', 'train', 'bus']);
  const [sort, setSort] = useState<'cheapest' | 'fastest' | 'balanced'>('cheapest');
  const [results, setResults] = useState<TravelSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<TravelPlan[]>([]);
  const [gateOpen, setGateOpen] = useState(false);
  const [partner, setPartner] = useState<User | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const partnerId = searchParams.get('partner');

  useEffect(() => {
    if (!session) return;
    api.getTravelPlans().then(setSaved).catch(() => setSaved([]));
  }, [session]);

  useEffect(() => {
    if (profile?.location_city && !origin && !searchParams.get('origin')) {
      setOrigin(profile.location_city);
    }
  }, [profile, origin, searchParams]);

  useEffect(() => {
    if (!partnerId || !session) return;
    api
      .getUser(partnerId)
      .then((person: User) => {
        setPartner(person);
        if (person.location_city && !searchParams.get('destination')) {
          setDestination(
            person.location_state
              ? `${person.location_city}, ${person.location_state}`
              : person.location_city
          );
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
          setDestination(
            accepted.partner.location_state
              ? `${accepted.partner.location_city}, ${accepted.partner.location_state}`
              : accepted.partner.location_city
          );
        }
      })
      .catch(() => {});
  }, [session, partnerId, destination]);

  const runSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    setError('');
    setLoading(true);
    setSelectedId(null);
    try {
      const data = await api.searchTravel({
        origin,
        destination,
        date,
        returnDate: returnDate || undefined,
        modes,
      });
      setResults(data);
      const flat = flattenOffers(data);
      const bestOffer = cheapestOffer(flat);
      if (bestOffer) setSelectedId(bestOffer.id);
      localStorage.setItem(
        SEARCH_KEY,
        JSON.stringify({ origin, destination, date, returnDate, modes })
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

  const swapCities = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <Kicker>{partner ? `Toward ${partner.name || 'them'}` : 'Travel'}</Kicker>
      <h1 className="font-display mt-3 text-4xl md:text-6xl">The way there</h1>
      <p className="mt-4 max-w-xl text-[var(--espresso-soft)]">
        Find the cheapest path, then see what the whole visit costs. Tickets open with the carrier —
        this house does not sell them.
      </p>

      <form
        onSubmit={runSearch}
        className="mt-10 grid gap-3 border border-[var(--line-strong)] bg-[var(--paper)] p-5 md:grid-cols-12"
      >
        <div className="md:col-span-3">
          <label htmlFor="origin">From</label>
          <input
            id="origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            required
            placeholder="Your city"
            autoComplete="address-level2"
          />
        </div>
        <div className="flex items-end md:col-span-1">
          <button
            type="button"
            onClick={swapCities}
            className="mb-1 w-full border border-[var(--line-strong)] py-3 text-[0.68rem] uppercase tracking-[0.14em] hover:border-[var(--espresso)]"
            aria-label="Swap cities"
          >
            Swap
          </button>
        </div>
        <div className="md:col-span-3">
          <label htmlFor="destination">To</label>
          <input
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
            placeholder={partner?.location_city || 'Theirs'}
            autoComplete="address-level2"
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
          {['flight', 'train', 'bus'].map((mode) => (
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
              {mode === 'flight' ? 'Flight' : mode === 'train' ? 'Rail' : 'Coach'}
            </label>
          ))}
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-[var(--oxblood)]">{error}</p>}

      {results && offers.length === 0 && (
        <div className="mt-10">
          <EmptyState
            title="Nothing came back"
            body="Try nearby city names, or a 3-letter airport code for live fares."
          />
        </div>
      )}

      {offers.length > 0 && (
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
          <div>
            {best && (
              <div className="mb-6 border border-[var(--live)]/25 bg-[var(--ivory)] px-5 py-4">
                <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--live)]">
                  Cheapest overall
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

            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl">Offers</h2>
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
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <TripCalculator
              selected={selected}
              cheapest={best}
              origin={origin}
              destination={destination}
              date={date}
              returnDate={returnDate || undefined}
              onSelectCheapest={() => best && setSelectedId(best.id)}
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
