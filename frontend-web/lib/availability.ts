import { FreeWindow, ScheduleEntry } from '@/types';
import { weekdayName } from './occasions';

const DAY_START = 7 * 60;
const DAY_END = 23 * 60;
const MIN_WINDOW = 30;

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function fromMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function busyForDay(entries: ScheduleEntry[], day: number): Array<[number, number]> {
  return entries
    .filter((entry) => entry.day_of_week === day)
    .map((entry) => [toMinutes(entry.start_time), toMinutes(entry.end_time)] as [number, number])
    .sort((a, b) => a[0] - b[0]);
}

function mergeBusy(blocks: Array<[number, number]>): Array<[number, number]> {
  if (!blocks.length) return [];
  const merged: Array<[number, number]> = [blocks[0]];
  for (const [start, end] of blocks.slice(1)) {
    const last = merged[merged.length - 1];
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

function gaps(busy: Array<[number, number]>): Array<[number, number]> {
  const windows: Array<[number, number]> = [];
  let cursor = DAY_START;
  for (const [start, end] of busy) {
    if (start - cursor >= MIN_WINDOW) {
      windows.push([cursor, start]);
    }
    cursor = Math.max(cursor, end);
  }
  if (DAY_END - cursor >= MIN_WINDOW) {
    windows.push([cursor, DAY_END]);
  }
  return windows;
}

function overlapWindows(a: Array<[number, number]>, b: Array<[number, number]>): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const start = Math.max(a[i][0], b[j][0]);
    const end = Math.min(a[i][1], b[j][1]);
    if (end - start >= MIN_WINDOW) {
      result.push([start, end]);
    }
    if (a[i][1] < b[j][1]) i += 1;
    else j += 1;
  }
  return result;
}

export function computeFreeWindows(
  mySchedule: ScheduleEntry[],
  partnerSchedule: ScheduleEntry[]
): FreeWindow[] {
  const windows: FreeWindow[] = [];

  for (let day = 0; day <= 6; day += 1) {
    const mine = gaps(mergeBusy(busyForDay(mySchedule, day)));
    const theirs = gaps(mergeBusy(busyForDay(partnerSchedule, day)));
    const shared = overlapWindows(mine, theirs);

    for (const [start, end] of shared) {
      windows.push({
        day_of_week: day,
        day_name: weekdayName(day),
        start_time: fromMinutes(start),
        end_time: fromMinutes(end),
        minutes: end - start,
      });
    }
  }

  return windows.sort((a, b) => b.minutes - a.minutes || a.day_of_week - b.day_of_week);
}

export function formatWindow(window: FreeWindow): string {
  const hours = Math.floor(window.minutes / 60);
  const minutes = window.minutes % 60;
  const span = hours && minutes ? `${hours}h ${minutes}m` : hours ? `${hours}h` : `${minutes}m`;
  return `${window.day_name} · ${window.start_time}–${window.end_time} · ${span}`;
}
