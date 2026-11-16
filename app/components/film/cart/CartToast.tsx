import {useEffect} from 'react';
import {Arrowhead} from '~/components/film/ui/icons';
import {useCartUi} from './CartUi';

// "In the box": the tilted chip that wipes in under the nav after a dish lands in the box,
// with the way into the drawer. It stays 4 s (a new dish restarts the clock) and doesn't take
// focus; screen readers hear it through the status region.

const SHOW_MS = 4000;

export function CartToast() {
  const ui = useCartUi();
  const added = ui?.added ?? null;

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => ui?.dismiss(), SHOW_MS);
    return () => clearTimeout(timer);
  }, [added, ui]);

  return (
    <div className="fb-added" role="status">
      {added && (
        // Keyed by time, so a second dish replays the wipe.
        <div key={added.at} className="fb-added__chip">
          <span className="fb-yanone fb-added__kicker">In the box</span>
          <span className="fb-anton fb-added__name">{added.name}</span>
          <button
            type="button"
            className="fb-cta fb-cta--text fb-added__view"
            onClick={() => ui?.open()}
          >
            <span className="fb-cta__label">View box</span>
            <Arrowhead />
          </button>
        </div>
      )}
    </div>
  );
}
