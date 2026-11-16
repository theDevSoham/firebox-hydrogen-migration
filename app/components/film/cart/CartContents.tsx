import {
  CartForm,
  Money,
  useOptimisticCart,
  type OptimisticCartLine,
} from '@shopify/hydrogen';
import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useRef} from 'react';
import {BinIcon, EmptyBoxArt} from '~/components/film/ui/icons';
import {trackCommerce} from '~/lib/analytics';
import {playRemoveFilm} from './cartFilm';

// The cart in the film's look: lines with quantity, the subtotal, and the button to Shopify's
// checkout. The drawer and the /cart page both render it. Checkout itself is Shopify-hosted:
// payment, pickup and the order all happen there, and the order lands in the Shopify admin.

type Cart = CartApiQueryFragment | null;

export function CartContents({
  cart: original,
  onBrowse,
}: {
  cart: Cart;
  /** Where "Back to the menu" goes: closes the drawer, or links home from /cart. */
  onBrowse: {href: string; onClick?: () => void};
}) {
  const cart = useOptimisticCart(original);
  const lines = (cart?.lines?.nodes ?? []).filter(
    (line) =>
      !('parentRelationship' in line && line.parentRelationship?.parent),
  );

  if (!lines.length) {
    return (
      <div className="fb-cart__empty">
        <EmptyBoxArt />
        <p className="fb-fraunces">Nothing in the box yet.</p>
        <p className="fb-cart__empty-sub">
          The pit&rsquo;s going. Pick a cut off the menu.
        </p>
        <a
          className="fb-cta fb-cta--secondary"
          href={onBrowse.href}
          onClick={onBrowse.onClick}
        >
          Back to the menu
        </a>
      </div>
    );
  }

  const pending = lines.some((line) => line.isOptimistic);

  return (
    <>
      <ul className="fb-cart__lines" aria-label="In your cart">
        {lines.map((line) => (
          <CartLine key={line.id} line={line} />
        ))}
      </ul>
      <div className="fb-cart__foot">
        <dl className="fb-cart__total">
          <dt className="fb-yanone">Subtotal</dt>
          <dd className="fb-anton">
            {cart?.cost?.subtotalAmount ? (
              <Money
                as="span"
                data={cart.cost.subtotalAmount}
                withoutTrailingZeros
              />
            ) : (
              '–'
            )}
          </dd>
        </dl>
        <p className="fb-cart__note">
          Pickup, payment and taxes are sorted at checkout.
        </p>
        {cart?.checkoutUrl && (
          <a
            className="fb-cta fb-cta--l fb-cart__checkout"
            href={cart.checkoutUrl}
            aria-disabled={pending || undefined}
            onClick={(event) => {
              // A line still on its way isn't in Shopify's cart yet.
              if (pending) return event.preventDefault();
              trackCommerce('begin_checkout', {
                value: Number(cart.cost?.subtotalAmount?.amount ?? 0),
                items: lines.map((line) => ({
                  item_id: line.merchandise.product.handle,
                  item_name: line.merchandise.product.title,
                  price: Number(line.cost?.amountPerQuantity?.amount ?? 0),
                  quantity: line.quantity,
                })),
              });
            }}
          >
            Checkout
          </a>
        )}
      </div>
    </>
  );
}

type Line = OptimisticCartLine<CartApiQueryFragment>;

function CartLine({line}: {line: Line}) {
  const {id, quantity, isOptimistic, merchandise} = line;
  const name = merchandise.product.title;
  const image = merchandise.image;

  return (
    <li className="fb-cart__line" data-pending={isOptimistic ? '' : undefined}>
      <div className="fb-cart__thumb">
        {image?.url ? (
          <img
            src={`${image.url}${image.url.includes('?') ? '&' : '?'}width=160&height=200&crop=center`}
            alt=""
            width={80}
            height={100}
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="fb-cart__info">
        <p className="fb-anton fb-cart__name">{name}</p>
        {line.cost?.totalAmount && (
          <p className="fb-anton fb-cart__price">
            <Money
              as="span"
              data={line.cost.totalAmount}
              withoutTrailingZeros
            />
          </p>
        )}
        {!merchandise.availableForSale && (
          <p className="fb-yanone fb-cart__warn">Sold out since you added it</p>
        )}
        <div className="fb-cart__qty">
          <UpdateLine lines={[{id, quantity: quantity - 1}]}>
            <button
              type="submit"
              aria-label={`One fewer ${name}`}
              disabled={quantity <= 1 || !!isOptimistic}
            >
              −
            </button>
          </UpdateLine>
          <span aria-live="polite" aria-label={`Quantity ${quantity}`}>
            {quantity}
          </span>
          <UpdateLine lines={[{id, quantity: quantity + 1}]}>
            <button
              type="submit"
              aria-label={`One more ${name}`}
              disabled={!!isOptimistic}
            >
              +
            </button>
          </UpdateLine>
          <RemoveLine id={id} name={name} disabled={!!isOptimistic} />
        </div>
      </div>
    </li>
  );
}

/**
 * The dustbin. Plays the remove film first (the dish drops into the bin, the line folds away),
 * then submits, so the optimistic cart doesn't pull the line out mid-film. Without JavaScript
 * it's a plain submit button.
 */
function RemoveLine({
  id,
  name,
  disabled,
}: {
  id: string;
  name: string;
  disabled: boolean;
}) {
  const playing = useRef(false);
  return (
    <CartForm
      fetcherKey={updateKey([id])}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds: [id]}}
    >
      <button
        type="submit"
        className="fb-cart__remove"
        aria-label={`Remove ${name}`}
        title="Remove"
        disabled={disabled}
        onClick={(event) => {
          const button = event.currentTarget;
          const line = button.closest<HTMLElement>('.fb-cart__line');
          const form = button.form;
          if (!line || !form) return;
          event.preventDefault();
          if (playing.current) return;
          playing.current = true;
          playRemoveFilm(line, button, () => form.requestSubmit());
        }}
      >
        <BinIcon />
      </button>
    </CartForm>
  );
}

function UpdateLine({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  return (
    <CartForm
      fetcherKey={updateKey(lines.map((line) => line.id))}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

/** Rapid +/− on one line cancel each other, so only the last one runs. */
function updateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
