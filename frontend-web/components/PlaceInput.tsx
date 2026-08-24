'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { PlaceLocation } from '@/types';

type Suggestion = {
  placeId: string;
  label: string;
  main: string;
  secondary: string;
  kind?: 'university' | 'place';
};

type Props = {
  id?: string;
  label: string;
  value: string;
  place: PlaceLocation | null;
  onValueChange: (value: string) => void;
  onPlaceChange: (place: PlaceLocation | null) => void;
  placeholder?: string;
  required?: boolean;
  /** schools = official universities only; all = campuses + cities */
  prefer?: 'all' | 'schools';
  helper?: string;
};

export function PlaceInput({
  id,
  label,
  value,
  place,
  onValueChange,
  onPlaceChange,
  placeholder,
  required,
  prefer = 'all',
  helper,
}: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const pickingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hint, setHint] = useState('');

  const schools = useMemo(
    () => suggestions.filter((item) => item.kind === 'university'),
    [suggestions]
  );
  const places = useMemo(
    () => suggestions.filter((item) => item.kind !== 'university'),
    [suggestions]
  );

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setHint('');
      return;
    }

    if (place && (value === place.label || value === place.universityName)) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.autocompletePlaces(value, prefer);
        const next = (data.suggestions || []) as Suggestion[];
        setSuggestions(next);
        setOpen(next.length > 0);
        setActiveIndex(next.length ? 0 : -1);
        setHint('');
      } catch {
        setSuggestions([
          {
            placeId: `text:${value}`,
            label: value,
            main: value,
            secondary: 'Use as typed',
            kind: 'place',
          },
        ]);
        setOpen(true);
        setActiveIndex(0);
        setHint('Lookup is slow — you can still continue');
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [value, place, prefer]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const pick = async (suggestion: Suggestion) => {
    pickingRef.current = true;
    setOpen(false);
    setHint('');
    onValueChange(suggestion.kind === 'university' ? suggestion.main : suggestion.label);
    try {
      const resolved = await api.resolvePlace({
        placeId: suggestion.placeId,
        query: suggestion.label,
      });
      onPlaceChange(resolved.place);
      onValueChange(
        resolved.place.kind === 'university'
          ? resolved.place.universityName || resolved.place.label
          : resolved.place.label
      );
      if (resolved.place.confidence === 'text') {
        setHint('Using your text — pick a suggestion for a tighter match');
      }
    } catch {
      onPlaceChange({
        label: suggestion.label,
        query: suggestion.label,
        confidence: 'text',
        kind: suggestion.kind || 'place',
        universityName: suggestion.kind === 'university' ? suggestion.main : undefined,
      });
      setHint('Could not pin coordinates — travel will still search this name');
    } finally {
      window.setTimeout(() => {
        pickingRef.current = false;
      }, 200);
    }
  };

  const flatList = useMemo(() => [...schools, ...places], [schools, places]);

  const pinned =
    place &&
    (place.kind === 'university'
      ? place.universityName || place.label
      : [place.city, place.state].filter(Boolean).join(', ') || place.label);

  return (
    <div ref={wrapRef} className="place-field relative">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          value={value}
          required={required}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 && flatList[activeIndex]
              ? `${listId}-opt-${activeIndex}`
              : undefined
          }
          className={loading ? 'pr-10' : undefined}
          onChange={(event) => {
            onValueChange(event.target.value);
            onPlaceChange(null);
            setHint('');
          }}
          onFocus={() => {
            if (suggestions.length) setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              if (pickingRef.current) return;
              if (!place && value.trim().length >= 2) {
                void api
                  .resolvePlace({ query: value.trim() })
                  .then((data) => {
                    if (!data.place) return;
                    onPlaceChange(data.place);
                    if (data.place.kind === 'university' && data.place.universityName) {
                      onValueChange(data.place.universityName);
                    } else if (data.place.confidence !== 'text' && data.place.label) {
                      onValueChange(data.place.label);
                    }
                  })
                  .catch(() => {});
              }
            }, 120);
          }}
          onKeyDown={(event) => {
            if (!open || !flatList.length) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((current) => (current + 1) % flatList.length);
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((current) => (current <= 0 ? flatList.length - 1 : current - 1));
            }
            if (event.key === 'Enter' && activeIndex >= 0) {
              event.preventDefault();
              void pick(flatList[activeIndex]);
            }
            if (event.key === 'Escape') setOpen(false);
          }}
        />
        {loading && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--stone-dark)]">
            …
          </span>
        )}
      </div>

      {place && pinned && place.confidence !== 'text' && (
        <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--live)]">
          {place.kind === 'university' ? 'Campus' : 'Pinned'} · {pinned}
          {place.city && place.state && place.kind === 'university'
            ? ` · ${place.city}, ${place.state}`
            : ''}
        </p>
      )}
      {!place && helper && value.length < 2 && (
        <p className="mt-1.5 text-[0.68rem] text-[var(--stone-dark)]">{helper}</p>
      )}
      {hint && <p className="mt-1.5 text-[0.68rem] text-[var(--stone-dark)]">{hint}</p>}

      {open && flatList.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="place-menu absolute z-40 mt-1.5 max-h-72 w-full overflow-y-auto border border-[var(--line-strong)] bg-[var(--ivory)] shadow-[0_18px_40px_rgba(28,25,23,0.1)]"
        >
          {schools.length > 0 && (
            <li className="sticky top-0 bg-[var(--ivory-deep)] px-3 py-2 text-[0.62rem] uppercase tracking-[0.16em] text-[var(--stone-dark)]">
              Schools
            </li>
          )}
          {schools.map((suggestion, index) => {
            const flatIndex = index;
            return (
              <SuggestionRow
                key={`${suggestion.placeId}-${flatIndex}`}
                id={`${listId}-opt-${flatIndex}`}
                suggestion={suggestion}
                active={flatIndex === activeIndex}
                onPick={() => void pick(suggestion)}
              />
            );
          })}
          {places.length > 0 && prefer !== 'schools' && (
            <li className="sticky top-0 bg-[var(--ivory-deep)] px-3 py-2 text-[0.62rem] uppercase tracking-[0.16em] text-[var(--stone-dark)]">
              {schools.length ? 'Cities & places' : 'Places'}
            </li>
          )}
          {places.map((suggestion, index) => {
            const flatIndex = schools.length + index;
            return (
              <SuggestionRow
                key={`${suggestion.placeId}-${flatIndex}`}
                id={`${listId}-opt-${flatIndex}`}
                suggestion={suggestion}
                active={flatIndex === activeIndex}
                onPick={() => void pick(suggestion)}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SuggestionRow({
  id,
  suggestion,
  active,
  onPick,
}: {
  id: string;
  suggestion: Suggestion;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <li id={id} role="option" aria-selected={active}>
      <button
        type="button"
        className={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors duration-150 ${
          active ? 'bg-[var(--paper)]' : 'hover:bg-[var(--paper)]'
        }`}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onPick}
      >
        <span
          className={`mt-0.5 shrink-0 text-[0.58rem] uppercase tracking-[0.14em] ${
            suggestion.kind === 'university' ? 'text-[var(--oxblood)]' : 'text-[var(--stone-dark)]'
          }`}
        >
          {suggestion.kind === 'university' ? 'School' : 'Place'}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm text-[var(--espresso)]">{suggestion.main}</span>
          {suggestion.secondary && (
            <span className="mt-0.5 block truncate text-[0.68rem] text-[var(--stone-dark)]">
              {suggestion.secondary}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
