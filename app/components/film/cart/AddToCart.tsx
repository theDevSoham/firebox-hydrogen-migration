import {useEffect, useRef} from 'react';
import type {FetcherWithComponents} from 'react-router';
import {CartForm} from '@shopify/hydrogen';
import {trackCommerce} from '~/lib/analytics';
import type {MenuItem} from '~/lib/film/model';
import {playAddFilm} from './cartFilm';
import {useCartUi} from './CartUi';

// "Add to cart" on a menu card: adds one of the item's variant through the /cart action and
// plays the add film (the dish drops into the nav's box) with the "In the box" chip. The drawer
// stays shut; the badge and drawer show the line straight away (useOptimisticCart reads the
// selectedVariant below) while Shopify confirms it.

export function AddToCart({item}: {item: MenuItem & {variantId: string}}) {
  const ui = useCartUi();
  const selectedVariant = {
    id: item.variantId,
    title: 'Default Title',
    availableForSale: true,
    price: {amount: String(item.price ?? 0), currencyCode: 'INR'},
    image: item.image
      ? {
          url: item.image.url,
          altText: item.image.alt,
          width: item.image.width,
          height: item.image.height,
        }
      : null,
    product: {title: item.name, handle: item.id},
    selectedOptions: [],
  };

  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{
        lines: [{merchandiseId: item.variantId, quantity: 1, selectedVariant}],
      }}
    >
      {(fetcher: FetcherWithComponents<unknown>) => (
        <AddButton
          fetcher={fetcher}
          name={item.name}
          onAdd={(button) => {
            playAddFilm(button.closest('.fb-card'));
            ui?.announce(item.name);
            trackCommerce('add_to_cart', {
              value: item.price ?? 0,
              items: [
                {
                  item_id: item.id,
                  item_name: item.name,
                  price: item.price ?? undefined,
                  quantity: 1,
                },
              ],
            });
          }}
        />
      )}
    </CartForm>
  );
}

function AddButton({
  fetcher,
  name,
  onAdd,
}: {
  fetcher: FetcherWithComponents<unknown>;
  name: string;
  onAdd: (button: HTMLButtonElement) => void;
}) {
  const busy = fetcher.state !== 'idle';
  const ref = useRef<HTMLButtonElement>(null);
  // Play once the request is on its way, so a double click doesn't play it twice.
  const wasBusy = useRef(false);
  useEffect(() => {
    if (busy && !wasBusy.current && ref.current) onAdd(ref.current);
    wasBusy.current = busy;
  }, [busy, onAdd]);

  return (
    <button
      ref={ref}
      type="submit"
      className="fb-cta fb-cta--s fb-add"
      disabled={busy}
      aria-busy={busy || undefined}
    >
      {busy ? 'Adding…' : 'Add to cart'}
      <span className="sr-only">: {name}</span>
    </button>
  );
}
