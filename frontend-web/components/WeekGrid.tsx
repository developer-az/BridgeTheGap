import { ScheduleEntry } from '@/types';
import { weekdayName } from '@/lib/occasions';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

function toHour(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

const typeColor: Record<ScheduleEntry['type'], string> = {
  class: 'bg-[var(--espresso)] text-[var(--ivory)]',
  work: 'bg-[var(--oxblood)] text-[var(--ivory)]',
  other: 'bg-[var(--stone)] text-[var(--espresso)]',
};

export function WeekGrid({
  mine,
  theirs,
  highlightDays = [],
}: {
  mine: ScheduleEntry[];
  theirs?: ScheduleEntry[];
  highlightDays?: number[];
}) {
  const showTheirs = Boolean(theirs);
  const days = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className={`grid border border-[var(--line)]`} style={{ gridTemplateColumns: `3.5rem repeat(7, 1fr)` }}>
          <div className="border-b border-[var(--line)] bg-[var(--ivory-deep)]" />
          {days.map((day) => (
            <div
              key={day}
              className={`border-b border-l border-[var(--line)] px-2 py-3 text-center text-[0.62rem] uppercase tracking-[0.14em] ${
                highlightDays.includes(day) ? 'bg-[var(--oxblood)]/8 text-[var(--oxblood)]' : 'bg-[var(--ivory-deep)]'
              }`}
            >
              {weekdayName(day).slice(0, 3)}
            </div>
          ))}

          {HOURS.map((hour) => (
            <HourRow
              key={hour}
              hour={hour}
              days={days}
              mine={mine}
              theirs={theirs}
              showTheirs={showTheirs}
            />
          ))}
        </div>
        {showTheirs && (
          <div className="mt-3 flex gap-5 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--stone-dark)]">
            <span><i className="mr-2 inline-block h-2 w-2 bg-[var(--espresso)]" />You</span>
            <span><i className="mr-2 inline-block h-2 w-2 bg-[var(--oxblood)]" />Them</span>
          </div>
        )}
      </div>
    </div>
  );
}

function HourRow({
  hour,
  days,
  mine,
  theirs,
  showTheirs,
}: {
  hour: number;
  days: number[];
  mine: ScheduleEntry[];
  theirs?: ScheduleEntry[];
  showTheirs: boolean;
}) {
  return (
    <>
      <div className="border-t border-[var(--line)] py-2 pr-2 text-right text-[0.62rem] text-[var(--stone-dark)]">
        {hour}:00
      </div>
      {days.map((day) => {
        const myBlocks = mine.filter((e) => e.day_of_week === day && Math.floor(toHour(e.start_time)) === hour);
        const theirBlocks = (theirs || []).filter((e) => e.day_of_week === day && Math.floor(toHour(e.start_time)) === hour);
        return (
          <div key={`${day}-${hour}`} className="relative min-h-12 border-l border-t border-[var(--line)] p-1">
            {myBlocks.map((entry) => (
              <div
                key={entry.id}
                className={`mb-1 truncate px-1.5 py-1 text-[0.65rem] leading-tight ${showTheirs ? 'bg-[var(--espresso)] text-[var(--ivory)]' : typeColor[entry.type]}`}
                title={`${entry.title} ${entry.start_time.slice(0, 5)}–${entry.end_time.slice(0, 5)}`}
              >
                {entry.title || 'Busy'}
              </div>
            ))}
            {theirBlocks.map((entry) => (
              <div
                key={entry.id}
                className="mb-1 truncate bg-[var(--oxblood)] px-1.5 py-1 text-[0.65rem] leading-tight text-[var(--ivory)]"
                title={`${entry.title} ${entry.start_time.slice(0, 5)}–${entry.end_time.slice(0, 5)}`}
              >
                {entry.title || 'Busy'}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
