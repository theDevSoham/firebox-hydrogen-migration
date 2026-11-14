# Giving the setup script access to the store

`npm run shopify:setup` (build order step 2) needs three values in a file called `.env.setup`:

| Value                   | What it is                                               |
| ----------------------- | -------------------------------------------------------- |
| `SHOPIFY_STORE`         | The store's permanent address, `something.myshopify.com` |
| `SHOPIFY_CLIENT_ID`     | The client ID of a small app you create for the script   |
| `SHOPIFY_CLIENT_SECRET` | That app's client secret. Treat it like a password       |

Shopify no longer shows a ready-made access token for this. Instead you create an app in the
**Dev Dashboard**, install it on the store, and the script swaps the app's client ID and secret
for a token that lasts 24 hours, each time it runs. Shopify's guide:
<https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant>

## 1. Find the store's myshopify.com address

In the Shopify admin: **Settings → Domains**. It's the domain ending in `.myshopify.com`. It
never changes, even after you connect your own domain.

## 2. Check that the store is in your Dev Dashboard organization

Open <https://dev.shopify.com/dashboard> with the same Shopify login and look at **Stores** in
the sidebar. Your store must be listed there. The script's sign-in only works when the app and
the store belong to the same organization. If the store isn't listed, or you see more than one
organization (top left), see Troubleshooting below before going further.

## 3. Create the app

In the Dev Dashboard, **Apps → Create app**. Name it something like "Firebox setup".

## 4. Give it access, and release a version

On the app's **Versions** page, create a version:

- **App URL**: leave the default (the app has no pages of its own).
- **Scopes**: add exactly these:
  `write_products`, `write_metaobject_definitions`, `write_metaobjects`, `write_files`,
  `write_publications`
  (each "write" scope includes reading).

Then **Release**.

## 5. Install it on the store

On the app's page, **Install app**, choose your store, and approve the access it asks for.

## 6. Copy the credentials into `.env.setup`

On the app's **Settings** page, copy the **Client ID** and **Client secret**. In the repo:

```bash
cp .env.setup.example .env.setup
```

Then fill in the three values in `.env.setup`. That file is git-ignored; never commit it, and
don't paste the secret into chats, tickets or screenshots. If it ever leaks, rotate it on the
same Settings page.

## 7. Run it

```bash
npm run shopify:setup -- --dry-run
```

This signs in, checks the scopes, and lists what it would create without changing anything.
If that looks right:

```bash
npm run shopify:setup
```

Then check **Content → Metaobjects** and **Products** in the Shopify admin.

## 8. Before the site reads from the store (build order step 3)

- **Store currency.** Prices are in rupees, so the store currency should be INR
  (**Settings → General → Store defaults**). The script warns if it isn't.
- **Hydrogen sales channel and storefront.** The storefront only sees products and collections
  published to its channel. Install the **Hydrogen** channel (Shopify App Store, by Shopify),
  then **create a storefront** in it: installing the channel alone gives the script nothing to
  publish to. Either click **Create storefront** in the channel, or run
  `npx shopify hydrogen link` in this repo and choose to create a new one (that also links the
  repo, which step 3 needs). Then run `npm run shopify:setup -- --publish` once.

## Images

The script uploads no images unless asked. Image fields stay empty and the site shows the
placeholders in `public/placeholders/` until real ones are added, in either of two ways:

- **In the admin**: open an entry under **Content → Metaobjects** (or a product) and upload into
  its image field. Each field's help text gives the shape and minimum size.
- **With the script**: put the files in a folder, named as listed in `IMAGE_SLOTS`
  (`scripts/shopify/content.ts`; rename entries there to match your files), and run
  `npm run shopify:setup -- --images path/to/folder`. It uploads the files it finds and fills
  only the image fields that are still empty.

## Troubleshooting

- **`app_not_installed`**: the client ID and secret are right, but the app isn't installed on
  the store in `SHOPIFY_STORE`. Do step 5. If you did, check that it went to this store (the
  app's page lists its installs) and that a version was released first (step 4).
- **`shop_not_permitted`**: the app and the store aren't in the same organization (step 2). If
  the store isn't under **Stores** in the Dev Dashboard, check you're in the right organization
  (top left). Shopify's notes on this are in the "shop_not_permitted error" section of the
  guide linked above.
- **"The app is missing access scopes"**: add them in a new version (step 4), release it, then
  approve the update on the store (the admin shows a prompt under **Apps**).
- **A definition "can't change a field's type"**: Shopify doesn't allow changing a field's type
  once it exists. The script leaves it alone and says so. Change it by hand in the admin if
  you really need to.

## Re-running

Safe at any time. Definitions are kept in line with `scripts/shopify/schema.ts`. Products,
collections and entries are only created when missing, so edits made in the admin are kept.
`--overwrite` resets them to the repo's originals. Nothing is ever deleted.
