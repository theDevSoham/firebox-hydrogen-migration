import {Suspense} from 'react';
import {Await} from 'react-router';
import {useOptimisticCart} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {BoxIcon} from '~/components/film/ui/icons';
import {useCartUi, useRootCart} from './CartUi';

// The nav's cart: a takeaway box with a count badge (hidden while the box is empty). A real
// link to /cart, so it works before JavaScript; once the film runs it opens the drawer.
// `data-cart-target` is where the add-to-cart film drops the dish (./cartFilm.ts).

export function CartButton() {
  const ui = useCartUi();
  const cart = useRootCart();

  return (
    <a
      href="/cart"
      className="fb-cta fb-cart-button"
      data-cart-target
      onClick={(event) => {
        if (!ui) return;
        event.preventDefault();
        ui.open();
      }}
    >
      <BoxIcon />
      <Suspense fallback={<Count cart={null} />}>
        <Await resolve={cart}>{(resolved) => <Count cart={resolved} />}</Await>
      </Suspense>
    </a>
  );
}

function Count({cart}: {cart: CartApiQueryFragment | null}) {
  const optimistic = useOptimisticCart(cart);
  const count = optimistic?.totalQuantity ?? 0;
  return (
    <>
      <span className="sr-only">
        {count
          ? `Your box, ${count} ${count === 1 ? 'item' : 'items'}`
          : 'Your box, empty'}
      </span>
      {count > 0 && (
        // Keyed by the count, so it pops again whenever the number changes.
        <span key={count} className="fb-cart-badge" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </>
  );
}
