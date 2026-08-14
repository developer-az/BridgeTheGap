'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { AuthGate } from '@/components/AuthGate';
import { WeekGrid } from '@/components/WeekGrid';
import { Button, Kicker, RoomGate } from '@/components/ui';
import { api } from '@/lib/api';
import { parseScheduleFromText } from '@/lib/openrouter';
import { weekdayName } from '@/lib/occasions';
import { ScheduleEntry } from '@/types';

const emptyForm = {
  day_of_week: 1,
  start_time: '09:00',
  end_time: '10:00',
  title: '',
  type: 'class' as ScheduleEntry['type'],
};

export default function SchedulePage() {
  const { session, loading } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<ScheduleEntry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [parsed, setParsed] = useState<typeof emptyForm[]>([]);
  const [parseError, setParseError] = useState('');
  const [parsing, setParsing] = useState(false);
  const [gate, setGate] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session || loading) return;
    api.getSchedule().then(setSchedule).catch(() => {}).finally(() => setLoaded(true));
  }, [session, loading]);

  const load = async () => {
    const data = await api.getSchedule();
    setSchedule(data);
  };

  if (loading) {
    return <div className="px-5 py-32 text-center text-[var(--stone-dark)]">The week…</div>;
  }

  if (!session) {
    return (
      <>
        <RoomGate
          title="Your week stays private."
          body="Add classes when you want the overlap to mean something. Until then, travel and occasions are still open."
        />
        <AuthGate open={gate} onClose={() => setGate(false)} intent="Editing the week needs an account." nextPath="/schedule" />
      </>
    );
  }

  if (!loaded) {
    return <div className="px-5 py-32 text-center text-[var(--stone-dark)]">The week…</div>;
  }

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (editing) await api.updateScheduleEntry(editing.id, form);
    else await api.createScheduleEntry(form);
    setModal(false);
    setEditing(null);
    setForm(emptyForm);
    await load();
  };

  const startEdit = (entry: ScheduleEntry) => {
    setEditing(entry);
    setForm({
      day_of_week: entry.day_of_week,
      start_time: entry.start_time.slice(0, 5),
      end_time: entry.end_time.slice(0, 5),
      title: entry.title || '',
      type: entry.type,
    });
    setModal(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Your week</Kicker>
          <h1 className="font-display mt-3 text-4xl md:text-6xl">What takes the hours</h1>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => setPasteOpen((v) => !v)}>
            Paste your classes
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setModal(true);
            }}
          >
            Add a block
          </Button>
        </div>
      </div>
      <p className="mt-4 max-w-xl text-[var(--espresso-soft)]">
        This is only yours until someone is linked. Then Together shows the overlap.
      </p>

      {pasteOpen && (
        <div className="mt-8 border border-[var(--line)] bg-[var(--paper)] p-5">
          <label htmlFor="paste">Natural language</label>
          <textarea
            id="paste"
            rows={4}
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="CS 101 Monday and Wednesday 9–10:30. Work Friday 5–8."
          />
          {parseError && <p className="mt-2 text-sm text-[var(--oxblood)]">{parseError}</p>}
          <div className="mt-4 flex gap-3">
            <Button
              type="button"
              variant="line"
              disabled={parsing}
              onClick={async () => {
                setParsing(true);
                setParseError('');
                try {
                  const entries = await parseScheduleFromText(aiText);
                  if (!entries?.length) setParseError('Nothing parsed. Try days and times in the same sentence.');
                  else setParsed(entries as typeof emptyForm[]);
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : 'Could not parse';
                  setParseError(
                    message.includes('API key') || message.includes('not configured')
                      ? 'AI is not configured here. Add the blocks by hand — it is the same week.'
                      : message
                  );
                } finally {
                  setParsing(false);
                }
              }}
            >
              {parsing ? 'Reading' : 'Read this'}
            </Button>
            {parsed.length > 0 && (
              <Button
                onClick={async () => {
                  await api.createScheduleEntriesBatch(parsed);
                  setParsed([]);
                  setAiText('');
                  setPasteOpen(false);
                  await load();
                }}
              >
                Keep {parsed.length}
              </Button>
            )}
          </div>
          {parsed.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm">
              {parsed.map((entry, i) => (
                <li key={i}>
                  {entry.title} · {weekdayName(entry.day_of_week)} · {entry.start_time}–{entry.end_time}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-10">
        <WeekGrid mine={schedule} />
      </div>
      <p className="mt-3 text-sm text-[var(--stone-dark)]">Tap a block in the list below to change it.</p>
      <ul className="mt-6 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {schedule
          .slice()
          .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
          .map((entry) => (
            <li key={entry.id}>
              <button type="button" className="flex w-full items-center justify-between py-3 text-left" onClick={() => startEdit(entry)}>
                <span className="font-display text-xl">{entry.title || 'Busy'}</span>
                <span className="text-sm text-[var(--stone-dark)]">
                  {weekdayName(entry.day_of_week)} · {entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)}
                </span>
              </button>
            </li>
          ))}
      </ul>

      <Link href="/together" className="mt-8 inline-block text-[0.72rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]">
        See it against theirs
      </Link>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--espresso)]/40 p-4 sm:items-center">
          <form onSubmit={save} className="w-full max-w-md space-y-4 border border-[var(--line-strong)] bg-[var(--paper)] p-6">
            <h2 className="font-display text-3xl">{editing ? 'Change' : 'Add'}</h2>
            <div>
              <label htmlFor="day">Day</label>
              <select id="day" value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}>
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <option key={d} value={d}>{weekdayName(d)}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="start">Start</label>
                <input id="start" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
              </div>
              <div>
                <label htmlFor="end">End</label>
                <input id="end" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
              </div>
            </div>
            <div>
              <label htmlFor="title">Title</label>
              <input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="CS 101" />
            </div>
            <div>
              <label htmlFor="type">Kind</label>
              <select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ScheduleEntry['type'] })}>
                <option value="class">Class</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={async () => {
                    await api.deleteScheduleEntry(editing.id);
                    setModal(false);
                    setEditing(null);
                    await load();
                  }}
                >
                  Remove
                </Button>
              )}
              <Button type="button" variant="line" onClick={() => setModal(false)}>
                Close
              </Button>
              <Button type="submit">{editing ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
