import {useEffect} from 'react';
import {trackWhatsAppClick} from '~/lib/film/format';

// One listener for every order link: each Cta that opens WhatsApp carries data-wa-item.
// Clicks, middle-clicks and keyboard activation all arrive here.

export function WhatsAppTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        'a[data-wa-item]',
      );
      if (link) trackWhatsAppClick(link.dataset.waItem ?? '');
    };
    document.addEventListener('click', onClick, {capture: true});
    document.addEventListener('auxclick', onClick, {capture: true});
    return () => {
      document.removeEventListener('click', onClick, {capture: true});
      document.removeEventListener('auxclick', onClick, {capture: true});
    };
  }, []);

  return null;
}
