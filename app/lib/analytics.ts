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

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
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
