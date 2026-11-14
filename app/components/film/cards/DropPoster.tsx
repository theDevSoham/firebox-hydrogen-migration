import type {CSSProperties} from 'react';
import {Img} from '~/components/film/media/Img';
import {Cta} from '~/components/film/ui/Cta';
import {
  formatDropDate,
  formatLimit,
  formatPrice,
  formatSlot,
  renderMessage,
  waLink,
} from '~/lib/film/format';
import type {Drop} from '~/lib/film/model';
import {SoldOutStamp} from './SoldOutStamp';

// S6 poster (handoff/04-components.md · DropPoster): live · next/guest · soldout,
// type-only when a drop has no image. The "join" slot is JoinPoster below.

function longestWord(name: string) {
  return Math.max(...name.split(/\s+/).map((w) => w.length));
}

export function DropPoster({
  drop,
  whatsappNumber,
}: {
  drop: Drop;
  whatsappNumber: string;
}) {
  const kind =
    drop.status === 'live'
      ? 'live'
      : drop.status === 'soldout'
        ? 'soldout'
        : 'next';
  const price = formatPrice(drop.price);
  const when = `${formatDropDate(drop.date)} · ${formatSlot(drop.slot)}`;
  const typeOnly = !drop.image && drop.kind !== 'collab';
  const style = drop.guest
    ? ({'--fb-guest': drop.guest.accent} as CSSProperties)
    : undefined;
  const details = [
    formatLimit(drop.limit),
    kind === 'soldout' ? drop.description : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className="fb-poster" data-kind={kind} style={style}>
      {drop.image ? (
        <div className="fb-poster__media">
          <Img
            image={drop.image}
            alt={drop.image.alt}
            fill
            aspect={7 / 4} // the top 46% of a 4:5 poster
            sizes="(max-width: 767px) 78vw, 360px"
            className="fb-fill"
          />
        </div>
      ) : typeOnly ? (
        <div
          className="fb-poster__type"
          style={{'--chars': longestWord(drop.name)} as CSSProperties}
          aria-hidden="true"
        >
          {drop.name}
        </div>
      ) : (
        <div className="fb-poster__art">Art from the guest kitchen</div>
      )}

      <div className="fb-poster__body">
        {kind === 'live' && (
          <span className="fb-poster__meta" data-hot>
            Pre-orders open · {when}
          </span>
        )}
        {kind === 'next' && (
          <span className="fb-poster__meta" data-hot>
            Next{drop.kind === 'collab' && ' · collab night'}
          </span>
        )}
        {kind === 'soldout' && <span className="fb-poster__meta">{when}</span>}
        {typeOnly && kind === 'soldout' && (
          <span className="fb-poster__meta">{details}</span>
        )}

        <h3 className={typeOnly ? 'sr-only' : 'fb-poster__name'}>
          {drop.name}
          {kind === 'soldout' && <span className="sr-only"> · sold out</span>}
        </h3>

        <div className="fb-poster__foot">
          {kind === 'next' ? (
            <span className="fb-poster__meta">
              {formatDropDate(drop.date)} · only {drop.limit ?? '[N]'}
            </span>
          ) : (
            !(typeOnly && kind === 'soldout') && (
              <span className="fb-poster__meta">{details}</span>
            )
          )}
          {price && (
            <span className="fb-poster__price">
              {kind === 'soldout' ? <s>{price}</s> : price}
            </span>
          )}
        </div>

        {kind === 'live' && (
          <Cta
            href={waLink(
              whatsappNumber,
              renderMessage(drop.whatsappMessage, drop),
            )}
            variant="on-red"
            size="s"
            glyph={false}
            item={drop.name}
            context={drop.name}
          >
            Pre-order
          </Cta>
        )}
      </div>

      {kind === 'soldout' && <SoldOutStamp />}
    </li>
  );
}

export function JoinPoster({href}: {href: string}) {
  return (
    <li className="fb-poster" data-kind="join">
      <span className="fb-yanone fb-poster__join">
        Get the next drop
        <br />
        on WhatsApp
      </span>
      <Cta
        href={href}
        variant="on-red"
        size="s"
        glyph={false}
        item="Join the list"
      >
        Join the list
      </Cta>
    </li>
  );
}
