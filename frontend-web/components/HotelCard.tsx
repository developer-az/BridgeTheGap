import { HotelOffer } from '@/types';
import { SourceBadge } from './ui';
import { formatMoney, hotelPerNight } from '@/lib/travel-rank';

export function HotelCard({
  offer,
  selected,
  badge,
  onSelect,
}: {
  offer: HotelOffer;
  selected?: boolean;
  badge?: string;
  onSelect?: () => void;
}) {
  return (
    <article
      className={`offer-card flex flex-col p-5 transition-[border-color,box-shadow] duration-200 ${
        selected ? 'border-[var(--espresso)] shadow-[0_12px_28px_rgba(28,25,23,0.08)]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--stone-dark)]">Hotel</p>
          {badge && (
            <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-[var(--live)]">{badge}</p>
          )}
        </div>
        <SourceBadge source={offer.source} />
      </div>
      <h3 className="font-display mt-3 text-2xl leading-tight">{offer.name}</h3>
      {offer.address && <p className="mt-2 text-sm text-[var(--espresso-soft)]">{offer.address}</p>}
      <p className="mt-1 text-sm text-[var(--stone-dark)]">
        {offer.checkIn} → {offer.checkOut} · {offer.nights} night{offer.nights === 1 ? '' : 's'}
        {offer.rating ? ` · ${offer.rating.toFixed(1)}★` : ''}
      </p>
      <p className="mt-6 font-display text-3xl">
        {formatMoney(hotelPerNight(offer), offer.price.currency)}/night
      </p>
      <p className="mt-1 text-sm text-[var(--stone-dark)]">
        {formatMoney(Number(offer.price.total), offer.price.currency)} total
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
        {offer.bookUrl && (
          <a
            href={offer.bookUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[0.7rem] uppercase tracking-[0.16em] underline decoration-[var(--stone)] underline-offset-4 hover:text-[var(--oxblood)]"
          >
            Open hotels
          </a>
        )}
      </div>
    </article>
  );
}
