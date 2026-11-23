// Google Analytics 4 (PORTING-DECISIONS.md · D.5.2): page views, plus the one metric that matters,
// a `whatsapp_click` event with the item name (register `item` as a custom dimension in GA4 to
// report on it). Shopify's own analytics run alongside, from Analytics.Provider in app/root.tsx.
//
// Off until PUBLIC_GA_MEASUREMENT_ID (G-…) is set: no script loads and the security policy
// doesn't allow Google's hosts.

/** The measurement ID, if it's a valid one. */
export function gaMeasurementId(env: {
  PUBLIC_GA_MEASUREMENT_ID?: string;
}): string | null {
  const id = env.PUBLIC_GA_MEASUREMENT_ID?.trim() ?? '';
  return /^G-[A-Z0-9]+$/.test(id) ? id : null;
}

/** Hosts GA4 needs, for the Content Security Policy (app/entry.server.tsx). */
export const GA_CSP = {
  scriptSrc: ['https://www.googletagmanager.com'],
  connectSrc: [
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
  ],
  imgSrc: [
    'https://www.googletagmanager.com',
    'https://*.google-analytics.com',
  ],
};

// Microsoft Clarity (session recordings and heatmaps), the same way: off until
// PUBLIC_CLARITY_PROJECT_ID is set, and its hosts are only allowed when it's on.

/** The Clarity project ID, if it looks like one (lower-case letters and digits). */
export function clarityProjectId(env: {
  PUBLIC_CLARITY_PROJECT_ID?: string;
}): string | null {
  const id = env.PUBLIC_CLARITY_PROJECT_ID?.trim() ?? '';
  return /^[a-z0-9]{6,20}$/i.test(id) ? id : null;
}

/** Hosts Clarity needs, for the Content Security Policy (app/entry.server.tsx). */
export const CLARITY_CSP = {
  scriptSrc: ['https://www.clarity.ms', 'https://*.clarity.ms'],
  connectSrc: ['https://*.clarity.ms'],
  imgSrc: ['https://*.clarity.ms', 'https://c.bing.com'],
};

export type CspHosts = {
  scriptSrc: string[];
  connectSrc: string[];
  imgSrc: string[];
};

/** The extra hosts for whichever of GA and Clarity are switched on (none: every list empty). */
export function analyticsCsp(env: {
  PUBLIC_GA_MEASUREMENT_ID?: string;
  PUBLIC_CLARITY_PROJECT_ID?: string;
}): CspHosts {
  const on = [
    gaMeasurementId(env) ? GA_CSP : null,
    clarityProjectId(env) ? CLARITY_CSP : null,
  ].filter((hosts): hosts is CspHosts => hosts !== null);
  return {
    scriptSrc: on.flatMap((hosts) => hosts.scriptSrc),
    connectSrc: on.flatMap((hosts) => hosts.connectSrc),
    imgSrc: on.flatMap((hosts) => hosts.imgSrc),
  };
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ((...args: unknown[]) => void) & {q?: unknown[]};
  }
}

/**
 * A GA4 ecommerce event (`add_to_cart`, `begin_checkout`), in INR. Shopify's own analytics see
 * the same cart changes through Analytics.Provider. Without a measurement ID it's only logged in dev.
 */
export function trackCommerce(
  event: 'add_to_cart' | 'begin_checkout',
  params: {
    value: number;
    items: {
      item_id: string;
      item_name: string;
      price?: number;
      quantity: number;
    }[];
  },
) {
  // eslint-disable-next-line no-console -- dev-only trace, to see events without GA
  if (import.meta.env.DEV) console.debug(`[analytics] ${event}`, params);
  window.gtag?.('event', event, {currency: 'INR', ...params});
}

/** gtag's queue: calls made before gtag.js loads wait in dataLayer and run once it arrives. */
export function installGtag(id: string) {
  if (window.gtag) return;
  window.dataLayer ??= [];
  window.gtag = function gtag() {
    // gtag.js reads Arguments objects from the queue, not arrays.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id);
}

/** Clarity's queue, as in its standard snippet: calls made before the tag loads wait in clarity.q. */
export function installClarity() {
  if (window.clarity) return;
  const queue: NonNullable<Window['clarity']> = function clarity() {
    // Clarity reads Arguments objects from the queue, as gtag does.
    // eslint-disable-next-line prefer-rest-params
    (queue.q ??= []).push(arguments);
  };
  window.clarity = queue;
}
