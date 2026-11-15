import {useEffect} from 'react';
import {Script} from '@shopify/hydrogen';
import {installGtag} from '~/lib/analytics';

/**
 * Loads GA4 when a measurement ID is set (app/lib/analytics.ts). gtag.js loads async, so it
 * never holds up the film; Hydrogen's <Script> carries the CSP nonce.
 */
export function GoogleAnalytics({id}: {id: string | null}) {
  useEffect(() => {
    if (id) installGtag(id);
  }, [id]);

  if (!id) return null;
  return (
    <Script
      async
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
    />
  );
}
