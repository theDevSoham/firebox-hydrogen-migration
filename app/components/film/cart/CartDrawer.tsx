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

  // Lenis restarts here, on the state change, not in the dialog's close event: that event can
  // arrive late or not at all (a background tab), which left the page unable to scroll. Only on
  // an open → closed change, so it never starts Lenis while the intro holds it.
  const wasOpen = useRef(false);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      getLenis()?.stop();
    } else if (wasOpen.current) {
      if (dialog.open) dialog.close();
      getLenis()?.start();
    }
    wasOpen.current = isOpen;
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
      // Escape closes the dialog natively; this brings the state in line.
      onClose={() => ui?.close()}
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
