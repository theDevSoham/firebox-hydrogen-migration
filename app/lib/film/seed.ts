import {PLACEHOLDER_ART, type ArtOriginal} from './originals';

// The menu and drops the store starts with: firebox-official lib/seed.ts, moved onto
// Products/Collections (PORTING-DECISIONS.md · B.1–B.2) and `drop` metaobjects (B.3).
// scripts/shopify-setup.ts seeds the store from them. [Bracketed] facts stay placeholders until the client confirms them.

export type ProductSeed = {
  handle: string;
  title: string;
  description: string;
  /** Rupees. Null: not confirmed yet (the variant is saved at 0, which the site shows as [Price]). */
  price: number | null;
  /** `firebox.unit`, e.g. "350 g". */
  unit: string;
  /** Also in the Home page collection (HOME_COLLECTION): one of the dishes the film shows. */
  home?: boolean;
  soldOut?: boolean;
  isNew?: boolean;
  image: ArtOriginal | null;
  whatsappMessage: string;
};

export type SectionSeed = {
  handle: string;
  /** The swelling word. */
  title: string;
  products: ProductSeed[];
};

/**
 * The film (home page) shows the dishes in this collection and nothing else, each under its menu
 * section; /menu shows the whole menu. Only while it is empty or missing does the film show the
 * whole menu too (D.2.5). It is Shopify's built-in "Home page" collection.
 */
export const HOME_COLLECTION = {handle: 'frontpage', title: 'Home page'};

/**
 * Sections the menu no longer uses (D.7). The setup script deletes these collections from the
 * store, and only while they hold no products.
 */
export const RETIRED_SECTIONS = ['belly', 'ribs', 'pulled', 'burnt'];

/**
 * In menu order (`site_settings.menu_sections`); products in collection order. A section with no
 * dishes stays hidden on the site until it has one. Background colours go by position, not by
 * section (model.ts SECTION_THEMES).
 */
export const MENU_SEED: SectionSeed[] = [
  {
    handle: 'pork',
    title: 'Pork',
    products: [
      {
        handle: 'brisket-style-belly',
        title: 'Brisket-style belly',
        description:
          'Smoked like a brisket for about nine hours. Special-only, and it usually sells out.',
        price: null,
        unit: '9 hrs',
        home: true,
        image: PLACEHOLDER_ART.belly,
        whatsappMessage:
          "Hi Firebox! When's the next brisket-style belly drop?",
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
    ],
  },
  {
    handle: 'buff',
    title: 'Buff',
    products: [
      {
        handle: 'buff-sliders',
        title: 'Buff sliders',
        description: '[Description]',
        price: null,
        unit: '2 pcs',
        home: true,
        image: null,
        whatsappMessage: "Hi Firebox! I'd like to pre-order Buff Sliders × 1.",
      },
    ],
  },
  {
    handle: 'chicken',
    title: 'Chicken',
    products: [
      {
        handle: 'chicken-sliders',
        title: 'Chicken sliders',
        description: '[Description]',
        price: null,
        unit: '2 pcs',
        home: true,
        image: null,
        whatsappMessage:
          "Hi Firebox! I'd like to pre-order Chicken Sliders × 1.",
      },
    ],
  },
];

export const DROP_MESSAGE =
  "Hi Firebox! I'd like to pre-order {name} × 1 for {date}.";

export type DropSeed = {
  handle: string;
  kind: 'drop' | 'collab';
  name: string;
  description?: string;
  /** Rupees. */
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

export const DROPS_SEED: DropSeed[] = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];
