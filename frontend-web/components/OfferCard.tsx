import { FlightOffer, GroundTransport } from '@/types';
import { SourceBadge } from './ui';

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

type Offer = FlightOffer | GroundTransport;

export function OfferCard({
  offer,
  onKeep,
}: {
  offer: Offer;
  onKeep?: () => void;
}) {
  const isFlight = offer.type === 'flight';
  const price = offer.price.total;
  const currency = offer.price.currency === 'USD' ? '$' : `${offer.price.currency} `;
  const bookUrl = offer.bookUrl;

  let title = '';
  let meta = '';
  let times = '';

  if (isFlight) {
    const segment = offer.itineraries[0]?.segments[0];
    title = `${segment?.departure.airport || 'Origin'} → ${segment?.arrival.airport || 'Destination'}`;
    meta = formatIsoDuration(offer.itineraries[0]?.duration || '');
    times = segment ? `${formatTime(segment.departure.time)} – ${formatTime(segment.arrival.time)}` : '';
  } else {
    title = offer.transitDetails[0]?.line || offer.type;
    meta = `${offer.duration} · ${offer.distance}`;
    times = `${offer.departure} – ${offer.arrival}`;
  }

  const kind = offer.type === 'flight' ? 'Flight' : offer.type === 'train' ? 'Rail' : 'Coach';

  return (
    <article className="offer-card flex flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--stone-dark)]">{kind}</p>
        <SourceBadge source={offer.source} />
      </div>
      <h3 className="font-display mt-3 text-2xl leading-tight">{title}</h3>
      <p className="mt-2 text-sm text-[var(--espresso-soft)]">{times}</p>
      <p className="mt-1 text-sm text-[var(--stone-dark)]">{meta}</p>
      <p className="mt-6 font-display text-3xl">
        {currency}
        {Number(price).toFixed(0)}
      </p>
      <div className="mt-auto flex items-center gap-4 pt-6">
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
