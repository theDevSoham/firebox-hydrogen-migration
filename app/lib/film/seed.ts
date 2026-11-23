import {PLACEHOLDER_ART, type ArtOriginal} from './originals';

// The menu and drops the store starts with: firebox-official lib/seed.ts, moved onto
// Products/Collections (PORTING-DECISIONS.md · B.1–B.2) and `drop` metaobjects (B.3).
// scripts/shopify-setup.ts seeds the store from them. [Bracketed] facts stay placeholders until the client confirms them.

export type SectionTheme = 'ember' | 'night' | 'kraft' | 'bark';

export type ProductSeed = {
  handle: string;
  title: string;
  description: string;
  /** Rupees. Null: not confirmed yet (the variant is saved at 0, which the site shows as [Price]). */
  price: number | null;
  /** `firebox.unit`, e.g. "350 g". */
  unit: string;
  soldOut?: boolean;
  isNew?: boolean;
  image: ArtOriginal | null;
  whatsappMessage: string;
};

export type SectionSeed = {
  handle: string;
  /** The swelling word. */
  title: string;
  theme: SectionTheme;
  products: ProductSeed[];
};

export type GroupSeed = {
  handle: string;
  title: string;
  theme: SectionTheme;
  /** Handles of the sub-collections under it (`firebox.subsections`), in order. */
  sections: string[];
};

/**
 * The menu's chapters (sub-collections), in order under Pork; products in collection order.
 * Every chapter the original site had is a pork cut.
 */
export const MENU_SEED: SectionSeed[] = [
  {
    handle: 'belly',
    title: 'Belly',
    theme: 'ember',
    products: [
      {
        handle: 'brisket-style-belly',
        title: 'Brisket-style belly',
        description:
          'Smoked like a brisket for about nine hours. Special-only, and it usually sells out.',
        price: null,
        unit: '9 hrs',
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
    ],
  },
  {
    handle: 'ribs',
    title: 'Ribs',
    theme: 'night',
    products: [
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
    ],
  },
  {
    handle: 'pulled',
    title: 'Pulled pork',
    theme: 'kraft',
    products: [
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
    ],
  },
  {
    handle: 'burnt',
    title: 'Burnt ends',
    theme: 'bark',
    products: [
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
];

/**
 * The top level of the menu, in order (`site_settings.menu_sections`). Chicken and Buff start
 * with no sub-collections and stay off the site until some with dishes are added in the admin.
 */
export const MENU_GROUPS: GroupSeed[] = [
  {handle: 'chicken', title: 'Chicken', theme: 'ember', sections: []},
  {
    handle: 'pork',
    title: 'Pork',
    theme: 'night',
    sections: MENU_SEED.map((section) => section.handle),
  },
  {handle: 'buff', title: 'Buff', theme: 'bark', sections: []},
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
