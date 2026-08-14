'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui';

export function TravelSearchForm({
  origin = '',
  destination = '',
  date = '',
  returnDate = '',
}: {
  origin?: string;
  destination?: string;
  date?: string;
  returnDate?: string;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(origin);
  const [to, setTo] = useState(destination);
  const [when, setWhen] = useState(date);
  const [back, setBack] = useState(returnDate);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams({
      origin: from,
      destination: to,
      date: when,
    });
    if (back) params.set('return', back);
    params.set('go', '1');
    router.push(`/travel?${params.toString()}`);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-3 border border-[var(--line-strong)] bg-[var(--paper)] p-4 md:grid-cols-12 md:items-end">
      <div className="md:col-span-3">
        <label htmlFor="from">From</label>
        <input id="from" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Boston" required />
      </div>
      <div className="md:col-span-3">
        <label htmlFor="to">To</label>
        <input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="College Park" required />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="when">Leave</label>
        <input id="when" type="date" value={when} onChange={(e) => setWhen(e.target.value)} required />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="back">Return</label>
        <input id="back" type="date" value={back} onChange={(e) => setBack(e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" className="w-full">
          Look
        </Button>
      </div>
    </form>
  );
}
