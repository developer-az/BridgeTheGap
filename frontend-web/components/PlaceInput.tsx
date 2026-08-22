'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { PlaceLocation } from '@/types';

type Suggestion = {
  placeId: string;
  label: string;
  main: string;
  secondary: string;
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
}: Props) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hint, setHint] = useState('');

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setHint('');
      return;
    }

    if (place && value === place.label) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.autocompletePlaces(value);
        const next = data.suggestions || [];
        setSuggestions(next);
        setOpen(next.length > 0);
        setActiveIndex(-1);
        setHint(next.length ? '' : 'No suggestions — search will still use what you typed');
      } catch {
        setSuggestions([
          {
            placeId: `text:${value}`,
            label: value,
            main: value,
            secondary: 'Use as typed',
          },
        ]);
        setOpen(true);
        setHint('Place lookup is slow — you can still continue');
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [value, place]);

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
    setOpen(false);
    setHint('');
    onValueChange(suggestion.label);
    try {
      const resolved = await api.resolvePlace({
        placeId: suggestion.placeId,
        query: suggestion.label,
      });
      onPlaceChange(resolved.place);
      onValueChange(resolved.place.label);
      if (resolved.place.confidence === 'text') {
        setHint('Using your text — pick a fuller suggestion if fares look off');
      }
    } catch {
      onPlaceChange({
        label: suggestion.label,
        query: suggestion.label,
        confidence: 'text',
      });
      setHint('Could not pin coordinates — travel will still search this name');
    }
  };

  const pinnedBits = place
    ? [place.city, place.state].filter(Boolean).join(', ') ||
      (place.confidence === 'exact' ? place.label : '')
    : '';

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor={id}>{label}</label>
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
        onChange={(event) => {
          onValueChange(event.target.value);
          onPlaceChange(null);
          setHint('');
        }}
        onFocus={() => {
          if (suggestions.length) setOpen(true);
        }}
        onBlur={() => {
          // Soft-resolve typed text if nothing was picked.
          if (!place && value.trim().length >= 2) {
            void api
              .resolvePlace({ query: value.trim() })
              .then((data) => {
                if (data.place) {
                  onPlaceChange(data.place);
                  if (data.place.label && data.place.confidence !== 'text') {
                    onValueChange(data.place.label);
                  }
                }
              })
              .catch(() => {});
          }
        }}
        onKeyDown={(event) => {
          if (!open || !suggestions.length) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % suggestions.length);
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
          }
          if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            void pick(suggestions[activeIndex]);
          }
          if (event.key === 'Escape') setOpen(false);
        }}
      />
      {place && value === place.label && pinnedBits && place.confidence !== 'text' && (
        <p className="mt-1 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--live)]">
          {pinnedBits}
          {place.confidence === 'approximate' ? ' · close match' : ' · pinned'}
        </p>
      )}
      {(loading || hint) && (
        <p className="mt-1 text-[0.62rem] text-[var(--stone-dark)]">
          {loading ? 'Looking up places…' : hint}
        </p>
      )}
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto border border-[var(--line-strong)] bg-[var(--ivory)] shadow-[0_16px_40px_rgba(28,25,23,0.08)]"
        >
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.placeId}-${index}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={`block w-full px-3 py-3 text-left transition-colors ${
                  index === activeIndex ? 'bg-[var(--paper)]' : 'hover:bg-[var(--paper)]'
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void pick(suggestion)}
              >
                <span className="block text-sm text-[var(--espresso)]">{suggestion.main}</span>
                {suggestion.secondary && (
                  <span className="mt-0.5 block text-[0.68rem] text-[var(--stone-dark)]">
                    {suggestion.secondary}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
