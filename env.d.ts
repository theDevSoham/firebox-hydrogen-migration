/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  /** Variables this storefront adds to Hydrogen's (set them in .env and in the Hydrogen channel). */
  interface Env {
    /** GA4 measurement ID (G-…). Unset: no Google Analytics (app/lib/analytics.ts). */
    PUBLIC_GA_MEASUREMENT_ID?: string;
  }
}
