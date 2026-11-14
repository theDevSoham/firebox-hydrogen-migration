import {Img} from '~/components/film/media/Img';
import {Cta} from '~/components/film/ui/Cta';
import {formatPrice, renderMessage, waLink} from '~/lib/film/format';
import type {MenuItem} from '~/lib/film/model';
import {NewSeal} from './NewSeal';
import {SoldOutStamp} from './SoldOutStamp';

// Menu item card in S4, option A: night card (handoff/04-components.md · DishCard).

type DishCardProps = {
  item: MenuItem;
  whatsappNumber: string;
  /** Where "Get the next drop" goes when the item is sold out. */
  nextDropHref: string;
};

export function DishCard({item, whatsappNumber, nextDropHref}: DishCardProps) {
  const soldOut = item.soldOut;
  const price = soldOut ? null : (formatPrice(item.price) ?? 'Ask on WhatsApp');

  return (
    <article className="fb-card" data-status={soldOut ? 'soldout' : 'live'}>
      <div className="fb-card__img">
        {item.image ? (
          <Img
            image={item.image}
            alt={item.image.alt}
            width={1200}
            height={1500}
            aspect={4 / 5}
            sizes="(max-width: 767px) 92vw, 360px"
            data-parallax
          />
        ) : (
          <div className="fb-card__none">Art: {item.name} · 4:5</div>
        )}
        {item.isNew && <NewSeal id={item.id} />}
        {item.image && <div className="fb-card__edge" aria-hidden="true" />}
      </div>
      {soldOut && (
        <div className="fb-card__seam">
          <SoldOutStamp />
        </div>
      )}
      <div className="fb-card__body">
        <div className="fb-card__top">
          <h3 className="fb-card__name">
            {item.name}
            {soldOut && <span className="sr-only"> · sold out</span>}
          </h3>
          {price && <span className="fb-card__price">{price}</span>}
        </div>
        <p className="fb-card__desc">{item.description}</p>
        <div className="fb-card__foot">
          <span className="fb-card__meta">{item.unit}</span>
          {soldOut ? (
            <Cta
              href={nextDropHref}
              variant="text"
              glyph={false}
              item={item.name}
              context={item.name}
            >
              Get the next drop
            </Cta>
          ) : (
            <Cta
              href={waLink(
                whatsappNumber,
                renderMessage(item.whatsappMessage, item),
              )}
              variant="text"
              glyph={false}
              item={item.name}
              context={item.name}
            >
              Order on WhatsApp
            </Cta>
          )}
        </div>
      </div>
    </article>
  );
}
