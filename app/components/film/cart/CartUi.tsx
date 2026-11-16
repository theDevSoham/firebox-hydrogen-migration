import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';

// The film's cart state: whether the drawer is open, and the last dish added (for the
// "In the box" chip). The nav button, every "Add to cart", the chip and the drawer share it.
// Outside a provider (no JavaScript yet, or /cart) the nav button falls back to its link.

type Added = {name: string; at: number};

type CartUi = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  added: Added | null;
  announce: (name: string) => void;
  dismiss: () => void;
};

const CartUiContext = createContext<CartUi | null>(null);

export function CartUiProvider({children}: {children: ReactNode}) {
  const [isOpen, setOpen] = useState(false);
  const [added, setAdded] = useState<Added | null>(null);
  const value = useMemo(
    () => ({
      isOpen,
      open: () => {
        setAdded(null);
        setOpen(true);
      },
      close: () => setOpen(false),
      added,
      announce: (name: string) => setAdded({name, at: Date.now()}),
      dismiss: () => setAdded(null),
    }),
    [isOpen, added],
  );
  return (
    <CartUiContext.Provider value={value}>{children}</CartUiContext.Provider>
  );
}

export function useCartUi(): CartUi | null {
  return useContext(CartUiContext);
}

/** The cart from the root loader: a promise, settled again after every cart action. */
export function useRootCart() {
  return useRouteLoaderData<RootLoader>('root')?.cart ?? null;
}
