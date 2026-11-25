# Porting The Firebox (Next.js) → Hydrogen, Shopify-only backend

Source: `../firebox-official` (Next 16, React 19, GSAP + Lenis, MongoDB, Cloudinary, custom admin).
Target: this repo (Hydrogen 2026.4, React Router 7, React 18.3, Tailwind 4).

**Decided:** Shopify is the only backend. MongoDB, Cloudinary, the custom admin, JWT auth and bcrypt are all retired.
Shopify admin is the CMS: **Products and Collections** hold the menu, **Metaobjects** hold page content, drops and settings, and **Files** hold every editable image and video.

Sections A–C are the mapping, for you to check. Section D records the decisions. **Frozen 2026-11-14: every recommendation accepted.**

---

## A. Platform mapping: what replaces what

| Today | Shopify replacement | What you lose | Mitigation |
|---|---|---|---|
| MongoDB `menuItems` | **Products** | Nothing material | — |
| MongoDB `sections` | **Collections** + metafields | Collections have no global order in the Storefront API | Order them with a list field on `site_settings` (see B.2) |
| MongoDB `drops` | **`drop` metaobject** | — | — |
| MongoDB `settings` | **`site_settings` metaobject** (one entry) | — | — |
| MongoDB `content` (page copy + image overrides) | **One metaobject type per scene** (see B.4) | "Store only changed fields / Use original" | The seed script fills every field with the current originals; the code keeps them as a fallback for empty fields |
| Cloudinary `firebox/site/*` (scene art) | **Shopify Files**, referenced from scene metaobjects through `file_reference` fields | — | — |
| Cloudinary `firebox/content/*` (admin uploads) | **Shopify Files** (uploaded in the metaobject editor) | Upload widget with forced-aspect cropping | Upload at the right aspect; each field's description states the shape and minimum size |
| Cloudinary `c_fill,g_auto` (subject-aware crop) | Storefront API `image.url(transform: {maxWidth, maxHeight, crop})` | **No subject-aware crop.** Crop is only CENTER / TOP / BOTTOM / LEFT / RIGHT. | Upload art already cropped to its slot's aspect; use `crop: CENTER` |
| Cloudinary `f_auto` / `q_auto` | Shopify CDN `preferredContentType: WEBP` (or AVIF) + `<Image>` `srcset` | Automatic per-image quality tuning | Shopify's default compression is good for photos |
| Cloudinary video (`s1Smoke`, `s9Smoke`, reels) | `Video` in Files → `sources[]` (HLS + MP4 renditions) | Resizing by URL width | Shopify transcodes to several renditions; pick by `height` |
| "Overwrite at the same public ID" to swap a final asset | Change the file selected in the metaobject field | The image URL changes | Nothing hard-codes URLs, so no code changes |
| Image `alt` on MediaRef | Alt text on the Shopify File itself (`MediaImage.alt`) | — | Decorative slots ignore it in code, as `describe: false` does today |
| Custom admin login, multiple admins, sessions | **Shopify staff accounts** and permissions | "Keep me signed in 45 days" | Shopify handles sessions and 2FA |
| `"use cache"` + `cacheTag` + `updateTag` on save | Hydrogen `storefront.query(..., {cache})` | Instant refresh on save | Short cache, or purge on `metaobjects/update` webhooks (D.3.2) |
| `scripts/seed-*.ts`, `upload-site-media.ts` | One `scripts/shopify-setup.ts` (Admin API): creates definitions, uploads Files, seeds entries | — | Re-runnable; the schema lives in the repo |
| Brand SVGs, textures, logos, favicon (`public/`) | **Stay in the repo** (`public/`) | — | They're design, not content |

---

## B. Content model: field-by-field

Shopify field types used below: `single_line_text_field`, `multi_line_text_field`, `file_reference` (image or video), `list.single_line_text_field`, `list.metaobject_reference`, `list.collection_reference`, `product_reference`, `number_integer`, `money`, `date`, `url`, `color`, `boolean`.
Every metaobject definition is set to **Storefront access: public read**.

### B.1 Menu items → Products

| Today (`MenuItem`) | Shopify | Type / validation |
|---|---|---|
| `name` | Product title | — |
| `description` | Product description | — |
| `section` | Membership in a Collection (B.2) | — |
| `price` | Variant price (INR) | — |
| `unit` (e.g. "per 500 g") | Metafield `firebox.unit` | single line, max 20 |
| `status: live` | Published to the Hydrogen channel, in stock | — |
| `status: soldout` | Published, inventory 0 → `availableForSale: false` | — |
| `status: hidden` | Unpublished from the Hydrogen channel | — |
| `isNew` | Metafield `firebox.is_new` | boolean |
| `image` | Product featured media | — |
| `whatsappMessage` | Metafield `firebox.whatsapp_message` | multi line, max 300 |
| `sortOrder` | Manual sort inside the collection | — |

### B.2 Sections → Collections

| Today (`Section`) | Shopify | Type / validation |
|---|---|---|
| `id` (slug) | Collection handle | — |
| `title` (the swelling word) | Collection title | — |
| `theme` | Not stored: by position (D.7) | `kraft`, `ember`, `night`, `bark`, in that order |
| `order` | `site_settings.menu_sections` | `list.collection_reference` (drag to reorder) |

### B.3 Drops → `drop` metaobject

| Today (`Drop`) | Field key | Type / validation |
|---|---|---|
| `kind` | `kind` | single line, choices: `drop`, `collab` |
| `name` | `name` | single line, max 40 |
| `description` | `description` | single line, max 120, optional |
| `price` | `price` | money (INR), optional |
| `limit` | `limit` | integer, min 1, optional |
| `date` | `date` | date, optional (empty shows "[Date]") |
| `slot` | `slot` | single line, max 20, optional |
| `status: draft` | Metaobject **Draft** status (publishable capability) | Drafts never reach the Storefront API |
| `status: announced / live / soldout / archived` | `status` | single line, choices |
| `isNew` | `is_new` | boolean |
| `image` (poster) | `poster` | file_reference, images only |
| `whatsappMessage` | `whatsapp_message` | multi line, max 300; `{name} {date} {slot} {price}` placeholders as today |
| `guest.name` / `.url` / `.accent` | `guest_name`, `guest_url`, `guest_accent` | single line / url / **color** (collab only) |
| `sortOrder` | `sort_order` | integer |
| (new) | `product` | product_reference, optional: for when drops become purchasable |

### B.4 Page content → one metaobject type per scene

Shopify caps a definition at 40 fields, and the page has ~60 text + 13 media fields, so it's split **one type per scene, one entry each**. That also mirrors the current admin's scene-by-scene editor. Max lengths come straight from `lib/content.ts` and become field validations.

**`scene_pit` (S1, the first screen)**

| Field key | Today | Type / validation |
|---|---|---|
| `headline` | `s1Headline` | single line, max 40 |
| `sub` | `s1Sub` | single line, max 90 |
| `cta` | `s1Cta` | single line, max 30 |
| `note` | `s1Note` | single line, max 60 |
| `art` | `s1Art` (Cloudinary `s1-pit`) | file_reference image. Help text: "Wide ~16:10, ≥1200 px wide" |
| `art_phone` | `s1ArtPhone` (`s1-pit-phone`) | file_reference image. "Tall ~9:20, ≥1200 px high" |
| `smoke` | `s1Smoke` video (canvas stand-in today) | file_reference **video**, optional (empty → canvas smoke) |

**`scene_manifesto` (S2)**

| Field key | Today | Type / validation |
|---|---|---|
| `text` | `s2Text` | multi line, max 160 |
| `chip` | `s2Chip` | single line, max 30 |

**`scene_nine_hours` (S3)**

| Field key | Today | Type / validation |
|---|---|---|
| `kicker` | `s3Kicker` | single line, max 40 |
| `name` | `s3Name` | single line, max 50 |
| `chip` | `s3Chip` | single line, max 30 |
| `raw` | `s3Raw` (`s3-raw`) | file_reference image. "Wide ≥1200, same framing as After" |
| `done` | `s3Done` (`s3-sliced`) | file_reference image. "Wide ≥1200" |

**`scene_box` (S5)**

| Field key | Today | Type / validation |
|---|---|---|
| `scrawl` | `s5Scrawl` | single line, max 30 |
| `line` | `s5Line` | multi line, max 80 (each line = a line break) |
| `sub` | `s5Sub` | single line, max 70 |
| `open` | `s5Open` (`s5-reveal`) | file_reference image. "Wide ≥1200" |
| `closed` | `s5Closed` (`s5-box-closed`) | file_reference image. "≥1000 wide; lid seam at 65.5% height" |

**`scene_drops_heading` (S6; the drops themselves are B.3)**

| Field key | Today | Type / validation |
|---|---|---|
| `title` | `s6Title` | single line, max 16 |
| `sub` | `s6Sub` | single line, max 60 |

**`scene_kolkata` (S7)**: the reels and comments become their own small metaobjects, so they can be added, removed and reordered rather than fixed at 4 + 2.

| Field key | Today | Type / validation |
|---|---|---|
| `word_1` / `word_2` / `word_3` | `s7Word1–3` | single line, max 12 each |
| `meaning` | `s7Meaning` | single line, max 60 |
| `reels` | `s7Reel1–4*` | `list.metaobject_reference` → `reel` |
| `comments` | `s7Quote1–2*` | `list.metaobject_reference` → `comment` |

| `reel` field | Today | Type / validation |
|---|---|---|
| `cover` | `s7ReelN` (`s7-reel-*`) | file_reference image. "Tall 9:16, ≥640 high" |
| `video` | `hasVideo` reel clip | file_reference video, optional |
| `caption` | `s7ReelNCaption` | single line, max 24 |
| `likes` | `s7ReelNLikes` | single line, max 8 |
| `subject` | `s7ReelNSubject` (screen-reader text) | single line, max 80 |
| `instagram_url` | (new) | url, optional |

| `comment` field | Today | Type / validation |
|---|---|---|
| `quote` | `s7QuoteN` | multi line, max 120 |
| `by` | `s7QuoteNBy` | single line, max 40 |
| `cleared` | "Placeholder · needs permission" tag | boolean (false shows the tag) |

**`scene_behind` (S8)**

| Field key | Today | Type / validation |
|---|---|---|
| `title` | `s8Title` | multi line, max 30 |
| `byline` | `s8Byline` | single line, max 50 |
| `story` | `s8Story` | multi line, max 1200 |
| `link_text` | `s8Link` | single line, max 50 |
| `photo` | `s8Photo` (`s8-behind`) | file_reference image. "Wide ≥1200; shown in black and white" |

**`scene_footer` (S9)**

| Field key | Today | Type / validation |
|---|---|---|
| `headline` | `s9Headline` | single line, max 30 |
| `highlight` | `s9Highlight` | single line, max 20 |
| `pickup_label` | `s9PickupLabel` | single line, max 30 |
| `pickup` | `s9Pickup` | single line, max 120 |
| `follow_label` | `s9FollowLabel` | single line, max 30 |
| `fine_print` | `s9Fine` | single line, max 120 |
| `rolling_words` | `s9Machine` (newline-separated) | **`list.single_line_text_field`**, each max 30 |
| `background` | `s9Night` (`s9-night`) | file_reference image. "Wide, dark, ≥1200" |
| `smoke` | `s9Smoke` video | file_reference video, optional |

**Intro (S0)**: `s0Flame` → `scene_intro.flame` (file_reference image), or keep it fixed in `public/` (see D.2.4).

### B.5 Settings → `site_settings` metaobject (single entry, handle `site`)

| Field key | Today | Type / validation |
|---|---|---|
| `whatsapp_number` | `settings.whatsappNumber` | single line, regex `^\+?[0-9 ]{8,16}$` |
| `location_label` | `settings.locationLabel` | single line, max 60 |
| `broadcast_link` | `settings.broadcastLink` | url, optional |
| `instagram` | `settings.instagram` | single line (handle) |
| `menu_sections` | `Section.order` | list.collection_reference |
| `og_image` | Cloudinary `firebox/site/og` | file_reference image, 1200×630 |
| `seo_title` / `seo_description` | `lib/site.ts` constants | single line / multi line |

---

## C. How the site reads it

- **One loader, one query** on the home route: all `scene_*` entries + `site_settings` + published `drop`s + the collections in `menu_sections` with their products. Then a small `toScene()` mapper turns `fields[]` into the same props the scene components take today, so the components barely change.
- **Images:** Hydrogen `<Image data={...} sizes="100vw" />` for single-crop slots; `<picture>` with `art_phone` / `art` for S1.
- **Video:** `<video>` with the MP4 `sources` from Shopify, falling back to today's canvas smoke when the field is empty.
- **Drafts:** draft metaobjects and unpublished products never appear in the Storefront API, so no status filtering is needed for them.

---

## D. Decisions (frozen 2026-11-14)

### D.1 Scope & structure

| # | Decision | Options | Rec. | Why | Your call |
|---|---|---|---|---|---|
| 1.1 | Deploy target | A) Oxygen · B) Vercel/Node · C) Cloudflare | **A** | Included with Shopify, edge-cached, made for Hydrogen | A |
| 1.2 | Skeleton routes (blogs, search, account, policies, collections, products, cart) | A) Keep all · B) Keep cart/products/policies, remove the rest · C) Restyle all | **B** | Checkout later needs cart/products/policies | B |
| 1.3 | Markets / `($locale)` routing | A) Keep · B) Single market en-IN, drop `($locale)` | **B** | One city, one currency | B |
| 1.4 | Who edits content | A) Store owner only · B) Extra staff with "Metaobjects" + "Products" permissions | **B** | Replaces "add or remove admins" | B |

### D.2 Content model choices

| # | Decision | Options | Rec. | Why | Your call |
|---|---|---|---|---|---|
| 2.1 | Page content structure | A) One type per scene (B.4) · B) Generic `scene` type with key/value fields | **A** | Typed fields, real labels and limits in admin; B is a worse editing experience | A |
| 2.2 | Reels & comments in S7 | A) Separate `reel` / `comment` metaobjects (B.4) · B) Fixed 4 reels + 2 comments as flat fields | **A** | Add, reorder or remove without code changes | A |
| 2.3 | Menu "sold out" | A) Inventory 0 · B) A `status` metafield | **A** | Native; also blocks checkout later | A |
| 2.4 | Intro flame (S0) and OG image | A) Editable (metaobject) · B) Fixed in `public/` | **A** for OG, **B** for flame | The flame is part of the motion design | A for OG, B for flame |
| 2.5 | Empty fields | A) Fall back to today's original copy in code · B) Render empty | **A** | The page never breaks if someone clears a field | A |
| 2.6 | Who owns the schema | A) `scripts/shopify-setup.ts` via Admin API, in the repo · B) Clicked together in admin | **A** | Reproducible on a new or dev store | A |

### D.3 Runtime & framework

| # | Decision | Options | Rec. | Why | Your call |
|---|---|---|---|---|---|
| 3.1 | React version | A) Stay on 18.3 · B) Upgrade to 19 | **A** | The film needs nothing from 19; the admin that did is gone | A |
| 3.2 | Cache for CMS reads | A) `CacheShort()` (~1 min) · B) `CacheLong()` + purge on `metaobjects/update` / `products/update` webhooks | **A** now, **B** later | Edits show within a minute with zero plumbing | A now, B later |
| 3.3 | Fonts | A) Self-host all as woff2 · B) Google Fonts links + local Fraunces | **A** | No third-party request; simpler CSP | A |
| 3.4 | Content Security Policy | A) Extend Hydrogen's CSP (fonts, GA, `cdn.shopify.com` media) · B) Loosen | **A** | The pre-paint `MOTION_FLAGS` script uses Hydrogen's nonce | A |
| 3.5 | Smooth scroll | A) Lenis on the film route only · B) Site-wide | **A** | Doesn't fight ScrollRestoration on cart/product pages | A |

### D.4 Commerce

| # | Decision | Options | Rec. | Why | Your call |
|---|---|---|---|---|---|
| 4.1 | Primary call to action | A) WhatsApp pre-order only · B) Shopify checkout · C) WhatsApp now, checkout per drop later | **C** | The port doesn't change the business flow | ~~C~~ **B for the menu** (changed 2026-11-17, see D.6) |
| 4.2 | "Only 20" limit | A) Display only · B) Real inventory on the drop's linked product | **A** now, **B** with checkout | | A now, B with checkout |
| 4.3 | Pick-up | A) Copy only · B) Shopify local pickup (Mukundapur) | **A** now, **B** with checkout | | A now, B with checkout |
| 4.4 | Payments (India) | Shopify Payments / Razorpay / PayU | Decide at checkout time | | Decide at checkout time |

### D.5 Migration & launch

| # | Decision | Options | Rec. | Why | Your call |
|---|---|---|---|---|---|
| 5.1 | Moving current content | A) Script: Mongo + Cloudinary → Shopify (one-off) · B) Seed from `lib/content.ts` originals + `handoff/assets` placeholders | **A** if the live admin has real edits, else **B** | B needs no Mongo or Cloudinary access at all | A if the live admin has real edits, else B |
| 5.2 | Analytics | A) GA4 + WhatsApp click events + Shopify Analytics · B) Shopify only | **A** | Keeps the WhatsApp conversion data | A |
| 5.3 | Domain | A) Switch straight over · B) Run on a subdomain first | **B** | Compare side by side | B |
| 5.4 | Cancel Mongo Atlas / Cloudinary | A) After launch + one week · B) Immediately | **A** | Rollback safety | A |

---

### D.6 Change after the freeze (2026-11-17)

The menu now sells through **Shopify cart + Shopify-hosted checkout** instead of WhatsApp, so orders are managed in the Shopify admin.

- Menu cards: **Add to cart** when in stock; a disabled **Sold out** button (plus "Get the next drop") at inventory 0 (D.2.3); **Ask on WhatsApp** only when the price is 0.
- The nav's WhatsApp button is now the **Cart** button (drawer on the film, `/cart` page without JavaScript). The hero button goes to the menu.
- Checkout is Shopify's own page (`cart.checkoutUrl`); there is no checkout page in this repo. Payment, pickup and taxes are set in the Shopify admin.
- Drops (S6) and the footer number stay on WhatsApp until a drop links a product (B.3 `product`).
- Default country is India (D.1.3), so carts and checkout are in INR.
- Still to settle in the admin: the payment provider (D.4.4: Razorpay / PayU / Cashfree, since Shopify Payments isn't offered in India), local pickup at Mukundapur (D.4.3), and inventory tracking on every product.

### D.7 Change after the freeze (2026-11-25)

The menu is organised by meat, and the home page picks its dishes.

- Menu sections are **Pork, Buff, Chicken**, in that order (`MENU_SEED`). The seven original dishes are in Pork; Chicken and Buff each start with sliders (no art, price or description yet). A section with no dish stays hidden.
- **Belly, Ribs, Pulled pork and Burnt ends are retired.** `npm run shopify:setup` deletes those four collections from the store, once they hold no dishes (`RETIRED_SECTIONS`). It deletes nothing else.
- **Section backgrounds go by position, not by section**: the first section showing is kraft, then ember, night, bark, and round again (`SECTION_THEMES` in `app/lib/film/model.ts`). Reordering the menu keeps that run of colours. The `firebox.theme` collection field is no longer read or seeded; the store may still hold it.
- The **home page (film, S4)** shows only the dishes in Shopify's **Home page** collection (handle `frontpage`), each under its menu section. `/menu` shows the whole menu. While Home page is empty, the film shows the whole menu (D.2.5).

## E. Build order

1. Port the film into Hydrogen with static data shaped exactly like section B (no store needed).
2. `scripts/shopify-setup.ts`: create the definitions in B, upload Files, seed entries and products.
3. Switch the home loader to the Storefront API (section C); delete the static data.
4. CSP, fonts, analytics, meta, domain.
5. Later: checkout for drops (D.4).
