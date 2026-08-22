import { FlightOffer, GroundTransport, TravelOffer } from '@/types';
import { SourceBadge } from './ui';
import { formatMoney, offerPrice } from '@/lib/travel-rank';

function formatIsoDuration(iso: string): string {
  const hours = iso.match(/(\d+)H/);
  const minutes = iso.match(/(\d+)M/);
  const h = hours ? `${hours[1]}h` : '';
  const m = minutes ? `${minutes[1]}m` : '';
  return `${h} ${m}`.trim() || iso;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function OfferCard({
  offer,
  onKeep,
  onSelect,
  selected,
  badge,
}: {
  offer: TravelOffer;
  onKeep?: () => void;
  onSelect?: () => void;
  selected?: boolean;
  badge?: string;
}) {
  const isFlight = offer.type === 'flight';
  const bookUrl = offer.bookUrl;
  let title = '';
  let meta = '';
  let times = '';

  if (isFlight) {
    const flight = offer as FlightOffer;
    const segment = flight.itineraries[0]?.segments[0];
    title = `${segment?.departure.airport || 'Origin'} → ${segment?.arrival.airport || 'Destination'}`;
    meta = formatIsoDuration(flight.itineraries[0]?.duration || '');
    times = segment
      ? `${formatTime(segment.departure.time)} – ${formatTime(segment.arrival.time)}`
      : '';
  } else {
    const ground = offer as GroundTransport;
    title = ground.transitDetails[0]?.line || ground.type;
    meta = `${ground.duration} · ${ground.distance}`;
    times = `${ground.departure} – ${ground.arrival}`;
  }

  const kind = offer.type === 'flight' ? 'Flight' : offer.type === 'train' ? 'Rail' : 'Coach';

  return (
    <article
      className={`offer-card flex flex-col p-5 transition-[border-color,box-shadow] duration-200 ${
        selected ? 'border-[var(--espresso)] shadow-[0_12px_28px_rgba(28,25,23,0.08)]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--stone-dark)]">{kind}</p>
          {badge && (
            <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-[var(--live)]">{badge}</p>
          )}
        </div>
        <SourceBadge source={offer.source} />
      </div>
      <h3 className="font-display mt-3 text-2xl leading-tight">{title}</h3>
      <p className="mt-2 text-sm text-[var(--espresso-soft)]">{times}</p>
      <p className="mt-1 text-sm text-[var(--stone-dark)]">{meta}</p>
      <p className="mt-6 font-display text-3xl">
        {formatMoney(offerPrice(offer), offer.price.currency || 'USD')}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
        {onSelect && (
          <button
            type="button"
            onClick={onSelect}
            className="text-[0.7rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]"
          >
            {selected ? 'In calculator' : 'Use in calculator'}
          </button>
        )}
        {bookUrl && (
          <a
            href={bookUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[0.7rem] uppercase tracking-[0.16em] underline decoration-[var(--stone)] underline-offset-4 hover:text-[var(--oxblood)]"
          >
            Open tickets
          </a>
        )}
        {onKeep && (
          <button
            type="button"
            onClick={onKeep}
            className="text-[0.7rem] uppercase tracking-[0.16em] hover:text-[var(--oxblood)]"
          >
            Keep
          </button>
        )}
      </div>
    </article>
  );
}
