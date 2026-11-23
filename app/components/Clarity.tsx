import {useEffect} from 'react';
import {Script} from '@shopify/hydrogen';
import {installClarity} from '~/lib/analytics';

/**
 * Loads Microsoft Clarity when a project ID is set (app/lib/analytics.ts), like GoogleAnalytics:
 * the standard snippet's queue, then the tag, async, so it never holds up the film. Hydrogen's
 * <Script> carries the CSP nonce; the tag then loads clarity.js from *.clarity.ms, which the
 * policy allows only while the ID is set.
 */
export function Clarity({id}: {id: string | null}) {
  useEffect(() => {
    if (id) installClarity();
  }, [id]);

  if (!id) return null;
  return (
    <Script
      async
      src={`https://www.clarity.ms/tag/${encodeURIComponent(id)}`}
    />
  );
}
