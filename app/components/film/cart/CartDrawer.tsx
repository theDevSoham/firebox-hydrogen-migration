import {Suspense, useEffect, useRef} from 'react';
import {Await} from 'react-router';
import {CrossIcon} from '~/components/film/ui/icons';
import {getLenis} from '~/lib/film/motion';
import {CartContents} from './CartContents';
import {useCartUi, useRootCart} from './CartUi';

// The cart drawer on the film. A modal <dialog>: it traps focus, Escape closes it, and the
// page behind is inert. Lenis stops while it's open so the wheel scrolls the cart, not the film.

export function CartDrawer() {
  const ui = useCartUi();
  const cart = useRootCart();
  const ref = useRef<HTMLDialogElement>(null);
  const isOpen = ui?.isOpen ?? false;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      getLenis()?.stop();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    // The click handler only catches clicks on the backdrop; keyboard users close it with
    // Escape (native to a modal dialog) or the close (×) button.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className="fb-cart fb-cart--drawer"
      aria-labelledby="fb-cart-title"
      data-lenis-prevent
      // Escape, the close button and a click on the backdrop all end here.
      onClose={() => {
        getLenis()?.start();
        ui?.close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) ui?.close();
      }}
    >
      <div className="fb-cart__panel">
        <header className="fb-cart__head">
          <h2 id="fb-cart-title" className="fb-anton fb-cart__title">
            Your box
          </h2>
          <button
            type="button"
            className="fb-cart__close"
            aria-label="Close cart"
            title="Close"
            onClick={() => ui?.close()}
          >
            <CrossIcon />
          </button>
        </header>
        <Suspense fallback={<p className="fb-cart__loading">Loading…</p>}>
          <Await resolve={cart}>
            {(resolved) => (
              <CartContents
                cart={resolved}
                onBrowse={{href: '#menu', onClick: () => ui?.close()}}
              />
            )}
          </Await>
        </Suspense>
      </div>
    </dialog>
  );
}
