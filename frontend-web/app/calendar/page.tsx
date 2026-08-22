'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Button, EmptyState, Kicker, RoomGate } from '@/components/ui';
import { api } from '@/lib/api';
import { buildMonthGrid, customDateDbId, kindLabel, localDateIso } from '@/lib/couple-dates';
import { CoupleDate, CoupleDateKind, User } from '@/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const KINDS: Array<{ value: CoupleDateKind; label: string }> = [
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'first-met', label: 'First met' },
  { value: 'visit', label: 'Visit' },
  { value: 'custom', label: 'Custom' },
];

export default function CalendarPage() {
  const { session, profile, loading } = useAuth();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [dates, setDates] = useState<CoupleDate[]>([]);
  const [upcoming, setUpcoming] = useState<CoupleDate[]>([]);
  const [partner, setPartner] = useState<User | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [kind, setKind] = useState<CoupleDateKind>('custom');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const monthLabel = useMemo(
    () => new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    [year, month]
  );

  const selectedDates = useMemo(
    () => (selectedDay ? dates.filter((item) => item.date === selectedDay) : []),
    [dates, selectedDay]
  );

  const load = async (y = year, m = month) => {
    setBusy(true);
    setError('');
    try {
      const data = await api.getCoupleDates(y, m + 1);
      setDates(data.dates || []);
      setUpcoming(data.upcoming || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load calendar');
      setDates([]);
      setUpcoming([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    void load();
    api
      .getConnections()
      .then((list: { status: string; partner?: User }[]) => {
        const accepted = list.find((item) => item.status === 'accepted' && item.partner);
        setPartner(accepted?.partner || null);
      })
      .catch(() => setPartner(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, year, month]);

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setSelectedDay(null);
  };

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await api.createCoupleDate({
        title,
        date,
        kind,
        notes: notes || undefined,
        recurring_yearly: recurring,
        partner_id: partner?.id,
      });
      setTitle('');
      setNotes('');
      setRecurring(kind === 'anniversary' || kind === 'birthday' || kind === 'first-met');
      await load();
      const created = new Date(`${date}T12:00:00`);
      setYear(created.getFullYear());
      setMonth(created.getMonth());
      setSelectedDay(date);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save date');
    }
  };

  if (loading) {
    return <div className="px-5 py-32 text-center text-[var(--stone-dark)]">Opening the calendar…</div>;
  }

  if (!session) {
    return (
      <RoomGate
        title="Your shared calendar waits inside."
        body="Sign in to keep anniversaries, visits, and the small days that matter on one page."
      />
    );
  }

  const firstName = profile?.name?.split(' ')[0] || 'Your';

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <Kicker>Calendar</Kicker>
      <h1 className="font-display mt-3 text-4xl md:text-6xl">
        {partner ? `${firstName} & ${partner.name?.split(' ')[0] || 'them'}` : `${firstName} dates`}
      </h1>
      <p className="mt-4 max-w-xl text-[var(--espresso-soft)]">
        Occasions, visits, and the days you name yourselves — in one quiet month view. Nothing fidgety.
        Just what is coming.
      </p>

      {error && <p className="mt-4 text-sm text-[var(--oxblood)]">{error}</p>}

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
        <section className="border border-[var(--line-strong)] bg-[var(--paper)] p-5 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="text-[0.7rem] uppercase tracking-[0.14em] hover:text-[var(--oxblood)]"
            >
              Prev
            </button>
            <h2 className="font-display text-3xl">{monthLabel}</h2>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="text-[0.7rem] uppercase tracking-[0.14em] hover:text-[var(--oxblood)]"
            >
              Next
            </button>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[0.65rem] uppercase tracking-[0.14em] text-[var(--stone-dark)]">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell, index) => {
              if (!cell) return <div key={`empty-${index}`} className="min-h-20" />;
              const iso = localDateIso(cell);
              const dayItems = dates.filter((item) => item.date === iso);
              const isToday = iso === localDateIso(today);
              const isSelected = selectedDay === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    setSelectedDay(iso);
                    setDate(iso);
                  }}
                  className={`min-h-20 border p-2 text-left transition-[border-color,background-color] duration-200 ${
                    isSelected
                      ? 'border-[var(--espresso)] bg-[var(--ivory)]'
                      : 'border-[var(--line)] hover:border-[var(--espresso-soft)]'
                  }`}
                >
                  <span
                    className={`text-sm ${isToday ? 'font-medium text-[var(--oxblood)]' : 'text-[var(--espresso)]'}`}
                  >
                    {cell.getDate()}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayItems.slice(0, 2).map((item) => (
                      <p
                        key={item.id}
                        className="truncate text-[0.62rem] leading-tight text-[var(--espresso-soft)]"
                      >
                        {item.title}
                      </p>
                    ))}
                    {dayItems.length > 2 && (
                      <p className="text-[0.6rem] text-[var(--stone-dark)]">+{dayItems.length - 2}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {busy && <p className="mt-4 text-sm text-[var(--stone-dark)]">Updating…</p>}

          {selectedDay && (
            <div className="mt-6 border-t border-[var(--line)] pt-5">
              <h3 className="font-display text-2xl">{selectedDay}</h3>
              {selectedDates.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--stone-dark)]">Nothing marked. Add one on the right.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {selectedDates.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--stone-dark)]">
                          {kindLabel(item.kind)}
                          {item.source && item.source !== 'custom' ? ` · ${item.source}` : ''}
                        </p>
                        <p className="font-display text-xl">{item.title}</p>
                        {item.notes && (
                          <p className="mt-1 text-sm text-[var(--espresso-soft)]">{item.notes}</p>
                        )}
                      </div>
                      {item.source === 'custom' && customDateDbId(item.id) && (
                        <button
                          type="button"
                          className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--stone-dark)] hover:text-[var(--oxblood)]"
                          onClick={async () => {
                            const dbId = customDateDbId(item.id);
                            if (!dbId) return;
                            await api.deleteCoupleDate(dbId);
                            await load();
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4">
                <Link
                  href={`/travel?date=${selectedDay}${partner ? `&partner=${partner.id}` : ''}&go=1`}
                  className="text-[0.7rem] uppercase tracking-[0.14em] hover:text-[var(--oxblood)]"
                >
                  Find the cheapest way for this day
                </Link>
              </div>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <form onSubmit={onCreate} className="border border-[var(--line-strong)] bg-[var(--paper)] p-5">
            <Kicker>Add a date</Kicker>
            <h2 className="font-display mt-2 text-3xl">Keep it on the wall</h2>
            <div className="mt-5 space-y-3">
              <div>
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Our anniversary"
                />
              </div>
              <div>
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="kind">Kind</label>
                <select
                  id="kind"
                  value={kind}
                  onChange={(e) => {
                    const next = e.target.value as CoupleDateKind;
                    setKind(next);
                    setRecurring(next === 'anniversary' || next === 'birthday' || next === 'first-met');
                  }}
                >
                  {KINDS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="notes">Note</label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional — a place, a ritual, a reminder"
                />
              </div>
              <label className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.14em] text-[var(--espresso-soft)]">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--espresso)]"
                />
                Repeat each year
              </label>
              <Button type="submit" className="w-full">
                Save date
              </Button>
            </div>
          </form>

          <section className="border border-[var(--line)] bg-[var(--ivory)] p-5">
            <Kicker>Coming up</Kicker>
            <h2 className="font-display mt-2 text-2xl">Next on the calendar</h2>
            {upcoming.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Quiet for now"
                  body="Add an anniversary, or open Occasions to put a seasonal date on the wall."
                  action={
                    <Link href="/occasions" className="text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
                      Browse occasions
                    </Link>
                  }
                />
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {upcoming.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="w-full text-left hover:text-[var(--oxblood)]"
                      onClick={() => {
                        const d = new Date(`${item.date}T12:00:00`);
                        setYear(d.getFullYear());
                        setMonth(d.getMonth());
                        setSelectedDay(item.date);
                      }}
                    >
                      <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--stone-dark)]">
                        {item.date} · {kindLabel(item.kind)}
                      </p>
                      <p className="font-display text-xl">{item.title}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex flex-wrap gap-4 text-[0.7rem] uppercase tracking-[0.14em]">
              <Link href="/travel" className="hover:text-[var(--oxblood)]">
                Plan travel
              </Link>
              <Link href="/together" className="hover:text-[var(--oxblood)]">
                Find free hours
              </Link>
              <Link href="/occasions" className="hover:text-[var(--oxblood)]">
                Occasions
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
