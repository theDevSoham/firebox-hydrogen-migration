import type {FilmQuery} from 'storefrontapi.generated';
import {ORIGINALS, PLACEHOLDER_ART, type ArtOriginal} from './originals';

// The film's data as the Storefront API will return it for FILM_QUERY (./query.ts), with no
// store behind it: build order step 1. Every value is in Shopify's wire format (metaobject
// values are strings; money and lists are JSON; booleans are "true"/"false"), so step 3 only
// swaps this for `storefront.query(FILM_QUERY)`. The menu and drops are firebox-official
// lib/seed.ts, moved onto Products/Collections (B.1–B.2) and `drop` metaobjects (B.3).

type Field = {value: string} | null;

const v = (value: string | null | undefined): Field =>
  value == null || value === '' ? null : {value};
const bool = (value: boolean): Field => ({value: String(value)});
const int = (value: number | null): Field =>
  value == null ? null : {value: String(value)};
const money = (amount: number | null): Field =>
  amount == null
    ? null
    : {
        value: JSON.stringify({
          amount: amount.toFixed(2),
          currency_code: 'INR',
        }),
      };

const image = (a: ArtOriginal) => ({
  url: a.url,
  width: a.width,
  height: a.height,
  altText: a.alt || null,
});

/** A file_reference field holding an image (MediaImage). */
const file = (a: ArtOriginal | null) =>
  a ? {reference: {__typename: 'MediaImage' as const, image: image(a)}} : null;

const {
  scene_pit,
  scene_manifesto,
  scene_nine_hours,
  scene_box,
  scene_drops_heading,
  scene_kolkata,
  scene_behind,
  scene_footer,
  site_settings,
} = ORIGINALS;

// ---------- B.1 / B.2 · Products in Collections ----------

type ProductSeed = {
  handle: string;
  title: string;
  description: string;
  /** Rupees. Null: the client hasn't confirmed it (the variant stays at 0 until they do). */
  price: number | null;
  unit: string;
  soldOut?: boolean;
  isNew?: boolean;
  image: ArtOriginal | null;
  whatsappMessage: string;
};

const product = (p: ProductSeed) => ({
  id: `gid://shopify/Product/static-${p.handle}`,
  handle: p.handle,
  title: p.title,
  description: p.description,
  availableForSale: !p.soldOut,
  featuredImage: p.image ? image(p.image) : null,
  priceRange: {
    minVariantPrice: {
      amount: (p.price ?? 0).toFixed(1),
      currencyCode: 'INR' as const,
    },
  },
  unit: v(p.unit),
  isNew: bool(Boolean(p.isNew)),
  whatsappMessage: v(p.whatsappMessage),
});

const collection = (
  handle: string,
  title: string,
  theme: 'ember' | 'night' | 'kraft' | 'bark',
  products: ProductSeed[],
) => ({
  id: `gid://shopify/Collection/static-${handle}`,
  handle,
  title,
  theme: v(theme),
  products: {nodes: products.map(product)},
});

const MENU_SECTIONS = [
  collection('belly', 'Belly', 'ember', [
    {
      handle: 'brisket-style-belly',
      title: 'Brisket-style belly',
      description:
        'Smoked like a brisket for about nine hours. Special-only, and it usually sells out.',
      price: null,
      unit: '9 hrs',
      image: PLACEHOLDER_ART.belly,
      whatsappMessage: "Hi Firebox! When's the next brisket-style belly drop?",
    },
    {
      handle: 'the-imposter',
      title: 'The Imposter',
      description:
        'Our bestseller: brisket-style pork belly in panini-style ciabatta, house BBQ sauce, pickled onions.',
      price: 549,
      unit: 'Sandwich of the Day',
      image: null,
      whatsappMessage: "Hi Firebox! I'd like to pre-order The Imposter × 1.",
    },
  ]),
  collection('ribs', 'Ribs', 'night', [
    {
      handle: 'whole-rib-racks',
      title: 'Whole rib racks',
      description:
        'Butchered in-house. Whole racks, wood-smoked, wrapped, finished with house BBQ sauce and honey.',
      price: null,
      unit: 'Whole rack',
      image: PLACEHOLDER_ART.ribs,
      whatsappMessage:
        "Hi Firebox! I'd like to pre-order a whole rack of ribs.",
    },
    {
      handle: 'smoked-fried-ribs',
      title: 'Smoked & fried ribs',
      description:
        'Pork back ribs smoked low & slow, then fried and tossed in BBQ sauce.',
      price: 369,
      unit: '4 pcs',
      image: null,
      whatsappMessage:
        "Hi Firebox! I'd like to pre-order Smoked & Fried Ribs × 1.",
    },
  ]),
  collection('pulled', 'Pulled pork', 'kraft', [
    {
      handle: 'smoked-pulled-pork',
      title: 'Smoked pulled pork',
      description: 'Our bestseller. Pork shoulder, 24 hours over wood.',
      price: 699,
      unit: '350 g',
      image: PLACEHOLDER_ART.pulledPork,
      whatsappMessage:
        "Hi Firebox! I'd like to pre-order Smoked Pulled Pork (350 g) × 1.",
    },
    {
      handle: 'pulled-pork-sliders',
      title: 'Pulled pork sliders',
      description: 'Potato brioche, toum, pickled onions.',
      price: 649,
      unit: '2 pcs',
      image: null,
      whatsappMessage:
        "Hi Firebox! I'd like to pre-order Pulled Pork Sliders × 1.",
    },
  ]),
  collection('burnt', 'Burnt ends', 'bark', [
    {
      handle: 'spiked-burnt-ends',
      title: 'Spiked burnt ends',
      description:
        'Pork belly cubes, smoked low & slow, finished in a sweet, sticky dark-rum glaze.',
      price: 699,
      unit: '10 pcs',
      isNew: true,
      image: PLACEHOLDER_ART.burntEnds,
      whatsappMessage:
        "Hi Firebox! I'd like to pre-order Spiked Burnt Ends × 1.",
    },
  ]),
];

// ---------- B.3 · Drops ----------

const DROP_MESSAGE = "Hi Firebox! I'd like to pre-order {name} × 1 for {date}.";

type DropSeed = {
  handle: string;
  kind: 'drop' | 'collab';
  name: string;
  description?: string;
  price: number | null;
  limit: number | null;
  /** YYYY-MM-DD (a `date` field). */
  date: string | null;
  slot: string;
  status: 'announced' | 'live' | 'soldout' | 'archived';
  poster: ArtOriginal | null;
  guest?: {name: string; url: string; accent: string};
  sortOrder: number;
};

const drop = (d: DropSeed) => ({
  handle: d.handle,
  kind: v(d.kind),
  name: v(d.name),
  description: v(d.description),
  price: money(d.price),
  limit: int(d.limit),
  date: v(d.date),
  slot: v(d.slot),
  status: v(d.status),
  is_new: bool(false),
  poster: file(d.poster),
  whatsapp_message: v(DROP_MESSAGE),
  guest_name: v(d.guest?.name),
  guest_url: v(d.guest?.url),
  guest_accent: v(d.guest?.accent),
  sort_order: int(d.sortOrder),
});

const DROPS = [
  drop({
    handle: 'sandwich-of-the-day-4',
    kind: 'drop',
    name: 'Sandwich of the Day #4',
    price: 549,
    limit: 20,
    date: null,
    slot: '',
    status: 'live',
    poster: PLACEHOLDER_ART.sandwich4,
    sortOrder: 1,
  }),
  drop({
    handle: 'collab-night',
    kind: 'collab',
    name: 'The Firebox × [Guest]',
    price: null,
    limit: null,
    date: null,
    slot: '',
    status: 'announced',
    poster: null,
    guest: {name: '[Guest]', url: '', accent: '#E0B482'},
    sortOrder: 2,
  }),
  drop({
    handle: 'philly-cheesesteak',
    kind: 'drop',
    name: 'Philly Cheesesteak',
    description: '16-hr buff tallow',
    price: 549,
    limit: 20,
    date: '2026-10-28',
    slot: '7–9 pm',
    status: 'soldout',
    poster: null,
    sortOrder: 3,
  }),
  drop({
    handle: 'the-big-buffon',
    kind: 'drop',
    name: 'The Big Buffon',
    price: 499,
    limit: 20,
    date: '2026-10-11',
    slot: '7 pm',
    status: 'soldout',
    poster: PLACEHOLDER_ART.bigBuffon,
    sortOrder: 4,
  }),
];

// ---------- the whole query result ----------

export const STATIC_FILM: FilmQuery = {
  settings: {
    whatsapp_number: v(site_settings.whatsapp_number),
    location_label: v(site_settings.location_label),
    broadcast_link: v(site_settings.broadcast_link),
    instagram: v(site_settings.instagram),
    menu_sections: {references: {nodes: MENU_SECTIONS}},
    og_image: null,
    seo_title: v(site_settings.seo_title),
    seo_description: v(site_settings.seo_description),
  },
  pit: {
    headline: v(scene_pit.headline),
    sub: v(scene_pit.sub),
    cta: v(scene_pit.cta),
    note: v(scene_pit.note),
    art: file(scene_pit.art),
    art_phone: file(scene_pit.art_phone),
    smoke: null,
  },
  manifesto: {text: v(scene_manifesto.text), chip: v(scene_manifesto.chip)},
  nineHours: {
    kicker: v(scene_nine_hours.kicker),
    name: v(scene_nine_hours.name),
    chip: v(scene_nine_hours.chip),
    raw: file(scene_nine_hours.raw),
    done: file(scene_nine_hours.done),
  },
  box: {
    scrawl: v(scene_box.scrawl),
    line: v(scene_box.line),
    sub: v(scene_box.sub),
    open: file(scene_box.open),
    closed: file(scene_box.closed),
  },
  dropsHeading: {
    title: v(scene_drops_heading.title),
    sub: v(scene_drops_heading.sub),
  },
  kolkata: {
    word_1: v(scene_kolkata.word_1),
    word_2: v(scene_kolkata.word_2),
    word_3: v(scene_kolkata.word_3),
    meaning: v(scene_kolkata.meaning),
    reels: {
      references: {
        nodes: scene_kolkata.reels.map((reel) => ({
          handle: reel.handle,
          cover: file(reel.cover),
          video: null,
          caption: v(reel.caption),
          likes: v(reel.likes),
          subject: v(reel.subject),
          instagram_url: null,
        })),
      },
    },
    comments: {
      references: {
        nodes: scene_kolkata.comments.map((comment) => ({
          handle: comment.handle,
          quote: v(comment.quote),
          by: v(comment.by),
          cleared: bool(comment.cleared),
        })),
      },
    },
  },
  behind: {
    title: v(scene_behind.title),
    byline: v(scene_behind.byline),
    story: v(scene_behind.story),
    link_text: v(scene_behind.link_text),
    photo: file(scene_behind.photo),
  },
  footer: {
    headline: v(scene_footer.headline),
    highlight: v(scene_footer.highlight),
    pickup_label: v(scene_footer.pickup_label),
    pickup: v(scene_footer.pickup),
    follow_label: v(scene_footer.follow_label),
    fine_print: v(scene_footer.fine_print),
    rolling_words: v(JSON.stringify(scene_footer.rolling_words)),
    background: file(scene_footer.background),
    smoke: null,
  },
  drops: {nodes: DROPS},
};
