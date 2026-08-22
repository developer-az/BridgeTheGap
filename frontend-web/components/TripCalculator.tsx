'use client';

import { useEffect, useMemo, useState } from 'react';
import { HotelOffer, TravelOffer } from '@/types';
import { formatMoney, hotelPerNight, offerPrice } from '@/lib/travel-rank';
import { Button, Kicker } from './ui';

const CALC_KEY = 'btg:tripCalculator';

type SavedCalc = {
  travelers?: number;
  lodging?: number;
  food?: number;
  extras?: number;
  split?: 'together' | 'me' | 'them';
};

function loadCalc(): SavedCalc {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(CALC_KEY) || '{}') as SavedCalc;
  } catch {
    return {};
  }
}

type Props = {
  selected: TravelOffer | null;
  cheapest: TravelOffer | null;
  selectedHotel?: HotelOffer | null;
  cheapestHotel?: HotelOffer | null;
  origin: string;
  destination: string;
  date: string;
  returnDate?: string;
  onSelectCheapest: () => void;
  onSelectCheapestHotel?: () => void;
};

export function TripCalculator({
  selected,
  cheapest,
  selectedHotel,
  cheapestHotel,
  origin,
  destination,
  date,
  returnDate,
  onSelectCheapest,
  onSelectCheapestHotel,
}: Props) {
  const remembered = useMemo(() => loadCalc(), []);
  const [travelers, setTravelers] = useState(remembered.travelers || 1);
  const [nights, setNights] = useState(0);
  const [lodging, setLodging] = useState(remembered.lodging || 0);
  const [food, setFood] = useState(remembered.food || 0);
  const [extras, setExtras] = useState(remembered.extras || 0);
  const [split, setSplit] = useState<'together' | 'me' | 'them'>(remembered.split || 'together');
  const [nightsTouched, setNightsTouched] = useState(false);
  const [lodgingTouched, setLodgingTouched] = useState(false);

  const activeHotel = selectedHotel || cheapestHotel;

  useEffect(() => {
    if (nightsTouched) return;
    if (!returnDate || !date) {
      setNights(activeHotel?.nights || 0);
      return;
    }
    const start = new Date(`${date}T12:00:00`);
    const end = new Date(`${returnDate}T12:00:00`);
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
    setNights(Math.max(activeHotel?.nights || 0, diff));
  }, [date, returnDate, nightsTouched, activeHotel?.nights]);

  useEffect(() => {
    if (lodgingTouched || !activeHotel) return;
    setLodging(Math.round(hotelPerNight(activeHotel)));
  }, [activeHotel, lodgingTouched]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CALC_KEY,
        JSON.stringify({ travelers, lodging, food, extras, split })
      );
    } catch {
      /* ignore */
    }
  }, [travelers, lodging, food, extras, split]);

  const fare = selected ? offerPrice(selected) * travelers : 0;
  const stay = nights * lodging;
  const meals = (nights > 0 ? nights : 1) * food * travelers;
  const total = fare + stay + meals + extras;
  const yours = split === 'me' ? total : split === 'them' ? 0 : total / 2;
  const theirs = total - yours;

  const savings = useMemo(() => {
    if (!selected || !cheapest) return 0;
    return Math.max(0, offerPrice(selected) - offerPrice(cheapest));
  }, [selected, cheapest]);

  return (
    <section className="border border-[var(--line-strong)] bg-[var(--paper)] p-5 md:p-6">
      <Kicker>Trip calculator</Kicker>
      <h2 className="font-display mt-2 text-3xl">What this visit costs</h2>
      <p className="mt-2 text-sm text-[var(--espresso-soft)]">
        {origin && destination ? `${origin} → ${destination}` : 'Pick an offer, then tune the visit.'}
        {date ? ` · ${date}` : ''}
        {returnDate ? ` → ${returnDate}` : ''}
      </p>

      {!selected && !activeHotel ? (
        <p className="mt-6 text-sm text-[var(--stone-dark)]">
          Choose a fare or hotel — the cheapest picks fill in automatically.
        </p>
      ) : (
        <>
          {activeHotel && (
            <p className="mt-4 text-sm text-[var(--espresso-soft)]">
              Lodging from {activeHotel.name} · {formatMoney(hotelPerNight(activeHotel))}/night
            </p>
          )}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="travelers">Travelers</label>
              <input
                id="travelers"
                type="number"
                min={1}
                max={8}
                value={travelers}
                onChange={(e) => setTravelers(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div>
              <label htmlFor="nights">Nights</label>
              <input
                id="nights"
                type="number"
                min={0}
                max={60}
                value={nights}
                onChange={(e) => {
                  setNightsTouched(true);
                  setNights(Math.max(0, Number(e.target.value) || 0));
                }}
              />
            </div>
            <div>
              <label htmlFor="lodging">Lodging / night</label>
              <input
                id="lodging"
                type="number"
                min={0}
                value={lodging || ''}
                placeholder="0"
                onChange={(e) => {
                  setLodgingTouched(true);
                  setLodging(Math.max(0, Number(e.target.value) || 0));
                }}
              />
            </div>
            <div>
              <label htmlFor="food">Food / person / day</label>
              <input
                id="food"
                type="number"
                min={0}
                value={food || ''}
                placeholder="0"
                onChange={(e) => setFood(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="extras">Extras</label>
              <input
                id="extras"
                type="number"
                min={0}
                value={extras || ''}
                placeholder="Gifts, tickets, buffer"
                onChange={(e) => setExtras(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(
              [
                ['together', 'Split evenly'],
                ['me', 'I cover it'],
                ['them', 'They cover it'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSplit(value)}
                className={`border px-3 py-2 text-[0.68rem] uppercase tracking-[0.14em] transition-colors ${
                  split === value
                    ? 'border-[var(--espresso)] bg-[var(--espresso)] text-[var(--ivory)]'
                    : 'border-[var(--line-strong)] text-[var(--espresso-soft)] hover:border-[var(--espresso)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <dl className="mt-6 space-y-2 border-t border-[var(--line)] pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--stone-dark)]">Fare × {travelers}</dt>
              <dd>{formatMoney(fare)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--stone-dark)]">Lodging</dt>
              <dd>{formatMoney(stay)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--stone-dark)]">Food</dt>
              <dd>{formatMoney(meals)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--stone-dark)]">Extras</dt>
              <dd>{formatMoney(extras)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-[var(--line)] pt-3 font-display text-2xl">
              <dt>Total</dt>
              <dd>{formatMoney(total)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-[var(--espresso-soft)]">
              <dt>Your share</dt>
              <dd>{formatMoney(yours)}</dd>
            </div>
            <div className="flex justify-between gap-4 text-[var(--espresso-soft)]">
              <dt>Their share</dt>
              <dd>{formatMoney(theirs)}</dd>
            </div>
          </dl>

          {cheapest && savings > 0 && (
            <div className="mt-5 border border-[var(--live)]/30 bg-[var(--ivory)] px-4 py-3 text-sm">
              <p className="text-[var(--live)]">
                The cheapest fare is {formatMoney(offerPrice(cheapest))} — {formatMoney(savings)} less
                per ticket.
              </p>
              <Button type="button" variant="ghost" className="mt-2 px-0" onClick={onSelectCheapest}>
                Use cheapest fare
              </Button>
            </div>
          )}

          {cheapestHotel && onSelectCheapestHotel && selectedHotel?.id !== cheapestHotel.id && (
            <div className="mt-5 border border-[var(--live)]/30 bg-[var(--ivory)] px-4 py-3 text-sm">
              <p className="text-[var(--live)]">
                Cheapest stay is {formatMoney(hotelPerNight(cheapestHotel))}/night at {cheapestHotel.name}.
              </p>
              <Button type="button" variant="ghost" className="mt-2 px-0" onClick={onSelectCheapestHotel}>
                Use cheapest hotel
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
