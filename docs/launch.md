# Putting the site live

Hosting is Oxygen (PORTING-DECISIONS.md · D.1.1), Shopify's hosting for Hydrogen, through the
storefront you created in the **Hydrogen** sales channel. The plan (D.5.3) is to run the new site
on a **subdomain first**, compare it with the current site, then switch the main domain over.
Sources: Shopify's "Hydrogen CI/CD with GitHub", "Manage Oxygen environments and variables"
and "Go live" guides.

## 1. Deploy to Oxygen

Either works:

- **From GitHub (deploys on every push):** push this repo to GitHub, then in the Shopify admin
  open **Hydrogen → your storefront** and connect the repository. Shopify opens a pull request
  that adds a deployment workflow; merge it. The repo's default branch becomes **Production**;
  other branches get preview deployments.
- **From your machine:** `npx shopify hydrogen deploy` (the repo is already linked to the
  storefront).

Each deployment gets a private URL you can open while signed in to the store.

## 2. Set the storefront's variables

Oxygen supplies the storefront's own keys (store domain, Storefront API tokens, storefront ID,
shop ID, session secret). Add these in **Hydrogen → your storefront → Storefront settings →
Environments and variables → Custom variables**:

| Key                         | Value                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `PUBLIC_CHECKOUT_DOMAIN`    | The checkout domain: the `….myshopify.com` address until a domain is connected, then that domain                   |
| `PUBLIC_GA_MEASUREMENT_ID`  | Your GA4 measurement ID, `G-…` (GA4 → Admin → Data streams → Web). Leave it out and no analytics load              |
| `PUBLIC_CLARITY_PROJECT_ID` | Optional. Your Microsoft Clarity project ID (Clarity → Settings → Overview). Leave it out and Clarity doesn't load |

Then redeploy, so the new deployment picks them up. For local development the same keys go in
`.env` (`npx shopify hydrogen env pull` fetches the storefront's own).

## 3. Put it on a subdomain to compare (D.5.3)

1. Choose a subdomain of your domain, e.g. `new.example.in`.
2. **Settings → Domains → Connect existing domain**, enter the subdomain and follow Shopify's
   prompts for the DNS record to add at your domain provider (for a subdomain, a CNAME).
3. Make production public: **Hydrogen → your storefront → Storefront settings → Environments and
   variables → Production → URL privacy → Public**.
4. Back in **Settings → Domains**, set the subdomain's **Target** to the production Hydrogen
   storefront.

The current site keeps running on the main domain meanwhile.

## 4. Switch the main domain (after comparing)

Shopify's go-live guide: at your DNS provider, point the root domain at Shopify (an A record
`23.227.38.65`, an AAAA record `2620:0127:f00f:5::`, and `www` as a CNAME to
`shops.myshopify.com`, removing other A/AAAA records for the root), connect it under
**Settings → Domains**, and set its **Target** to the production Hydrogen storefront, as
**Primary**. Update `PUBLIC_CHECKOUT_DOMAIN` if checkout moves to the new domain.

Keep MongoDB Atlas and Cloudinary for a week after the switch, as a way back (D.5.4).

## Analytics

With `PUBLIC_GA_MEASUREMENT_ID` set, GA4 records page views and a `whatsapp_click` event, with
the item name in an `item` parameter, on every order button. Register `item` as an event-scoped
custom dimension in GA4 to report on it. Shopify's own analytics run regardless. The site's
security policy only allows Google's hosts when the ID is set (`app/entry.server.tsx`).

With `PUBLIC_CLARITY_PROJECT_ID` set, Microsoft Clarity records sessions and heatmaps; its hosts
are likewise only allowed while the ID is set. The floating button's clicks report as
`whatsapp_click` with `item` = `float`.

## Sharing image

`npm run og:image` draws `public/brand/og.png` (1200 × 630). The site uses it unless **Content →
Metaobjects → Site settings → Sharing image** has an image; to make it editable there, upload it
in the admin or run `npm run shopify:setup -- --images public/brand`.
