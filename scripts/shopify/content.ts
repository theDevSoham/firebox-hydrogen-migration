// The content the store starts with: the film's original copy (app/lib/film/originals.ts) and the
// menu and drops (app/lib/film/seed.ts), as Shopify entries. Same source as the static site, so
// switching the site to Shopify (build order step 3) shows no visible change.
//
// Images are opt-in. Every image slot is listed in IMAGE_SLOTS with the filename it expects; the
// setup script uploads them only when run with `--images <folder>`, and only the files it finds
// there. Without it, image fields stay empty and the site shows the placeholders in public/.

import {ORIGINALS, type ArtOriginal} from '../../app/lib/film/originals';
import {
  DROP_MESSAGE,
  DROPS_SEED,
  MENU_SEED,
  type ProductSeed,
} from '../../app/lib/film/seed';

// ---------- images ----------

export type ImageSlot = {
  /** e.g. "scene_pit.art", "product:the-imposter", "drop:the-big-buffon", "reel:belly". */
  slot: string;
  /** The filename looked for in the `--images` folder. */
  file: string;
  alt: string;
};

const fileOf = (art: ArtOriginal) =>
  art.url.slice(art.url.lastIndexOf('/') + 1);
const slot = (
  name: string,
  art: ArtOriginal | null,
  alt = art?.alt ?? '',
): ImageSlot[] => (art ? [{slot: name, file: fileOf(art), alt}] : []);

const o = ORIGINALS;
const PIT_ALT = o.scene_pit.art.alt;

/**
 * Every image the store's content points at. Rename a `file` here to upload a different file
 * into that slot. Slots that share a file share one upload (and its alt text: Shopify keeps alt
 * text on the file).
 */
export const IMAGE_SLOTS: ImageSlot[] = [
  ...slot('scene_pit.art', o.scene_pit.art),
  ...slot('scene_pit.art_phone', o.scene_pit.art_phone, PIT_ALT),
  ...slot('scene_nine_hours.raw', o.scene_nine_hours.raw),
  ...slot('scene_nine_hours.done', o.scene_nine_hours.done),
  ...slot('scene_box.open', o.scene_box.open),
  ...slot('scene_box.closed', o.scene_box.closed),
  ...slot('scene_behind.photo', o.scene_behind.photo),
  ...slot('scene_footer.background', o.scene_footer.background),
  ...o.scene_kolkata.reels.flatMap((reel) =>
    slot(`reel:${reel.handle}`, reel.cover),
  ),
  ...MENU_SEED.flatMap((section) =>
    section.products.flatMap((p) => slot(`product:${p.handle}`, p.image)),
  ),
  ...DROPS_SEED.flatMap((drop) => slot(`drop:${drop.handle}`, drop.poster)), // Drawn by `npm run og:image` into public/brand/: upload with --images public/brand.
  {
    slot: 'site_settings.og_image',
    file: 'og.png',
    alt: 'The Firebox: low & slow, wood smoked',
  },
];

// ---------- products and collections (B.1, B.2) ----------

export type CollectionEntry = {
  handle: string;
  title: string;
  theme: string;
  productHandles: string[];
};

export const COLLECTIONS: CollectionEntry[] = MENU_SEED.map((section) => ({
  handle: section.handle,
  title: section.title,
  theme: section.theme,
  productHandles: section.products.map((p) => p.handle),
}));

export const PRODUCTS: (ProductSeed & {collection: string})[] =
  MENU_SEED.flatMap((section) =>
    section.products.map((p) => ({...p, collection: section.handle})),
  );

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** productSet input for a seed product. A missing price is saved as 0, which the site shows as [Price]. */
export function productInput(
  p: ProductSeed,
  refs: {collectionId?: string; imageId?: string},
) {
  return {
    title: p.title,
    handle: p.handle,
    descriptionHtml: `<p>${escapeHtml(p.description)}</p>`,
    status: 'ACTIVE',
    ...(refs.collectionId ? {collections: [refs.collectionId]} : {}),
    productOptions: [{name: 'Title', values: [{name: 'Default Title'}]}],
    variants: [
      {
        optionValues: [{optionName: 'Title', name: 'Default Title'}],
        price: (p.price ?? 0).toFixed(2),
        inventoryPolicy: 'DENY',
        // Untracked, so always available. To mark a dish sold out (D.2.3), turn on inventory
        // tracking for it in the admin and set the quantity to 0.
        inventoryItem: {tracked: false},
      },
    ],
    metafields: [
      {
        namespace: 'firebox',
        key: 'unit',
        type: 'single_line_text_field',
        value: p.unit,
      },
      {
        namespace: 'firebox',
        key: 'is_new',
        type: 'boolean',
        value: String(Boolean(p.isNew)),
      },
      {
        namespace: 'firebox',
        key: 'whatsapp_message',
        type: 'multi_line_text_field',
        value: p.whatsappMessage,
      },
    ].filter((m) => m.value !== ''),
    ...(refs.imageId ? {files: [{id: refs.imageId}]} : {}),
  };
}

// ---------- metaobject entries (B.3–B.5) ----------

export type Entry = {
  type: string;
  handle: string;
  fields: {key: string; value: string}[];
  /** For publishable types: the entry's status. */
  publish?: 'ACTIVE' | 'DRAFT';
};

export type Refs = {
  /** MediaImage id for an image slot, if it was uploaded. */
  image: (slot: string) => string | undefined;
  metaobject: (type: string, handle: string) => string | undefined;
  collection: (handle: string) => string | undefined;
};

type Value = string | number | boolean | null | undefined;

/** Builds a field list, dropping empty values (an empty field is "not set" in Shopify). */
function fields(values: Record<string, Value>): Entry['fields'] {
  return Object.entries(values)
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    )
    .map(([key, value]) => ({key, value: String(value)}));
}

const json = (value: unknown) => JSON.stringify(value);
const ids = (list: (string | undefined)[]) => {
  const found = list.filter((id): id is string => Boolean(id));
  return found.length ? json(found) : undefined;
};

const money = (rupees: number | null) =>
  rupees == null
    ? undefined
    : json({amount: rupees.toFixed(2), currency_code: 'INR'});

/** In creation order: every entry only points at entries above it. */
export function entries(refs: Refs): Entry[] {
  const k = o.scene_kolkata;
  return [
    ...k.reels.map((reel) => ({
      type: 'reel',
      handle: reel.handle,
      fields: fields({
        cover: refs.image(`reel:${reel.handle}`),
        caption: reel.caption,
        likes: reel.likes,
        subject: reel.subject,
      }),
    })),
    ...k.comments.map((comment) => ({
      type: 'comment',
      handle: comment.handle,
      fields: fields({
        quote: comment.quote,
        by: comment.by,
        cleared: comment.cleared,
      }),
    })),
    ...DROPS_SEED.map((d): Entry => ({
      type: 'drop',
      handle: d.handle,
      publish: 'ACTIVE',
      fields: fields({
        name: d.name,
        kind: d.kind,
        status: d.status,
        description: d.description,
        price: money(d.price),
        limit: d.limit,
        date: d.date,
        slot: d.slot,
        is_new: false,
        poster: refs.image(`drop:${d.handle}`),
        whatsapp_message: DROP_MESSAGE,
        guest_name: d.guest?.name,
        guest_url: d.guest?.url,
        guest_accent: d.guest?.accent,
        sort_order: d.sortOrder,
      }),
    })),
    {
      type: 'scene_pit',
      handle: 'home',
      fields: fields({
        headline: o.scene_pit.headline,
        sub: o.scene_pit.sub,
        cta: o.scene_pit.cta,
        note: o.scene_pit.note,
        art: refs.image('scene_pit.art'),
        art_phone: refs.image('scene_pit.art_phone'),
      }),
    },
    {
      type: 'scene_manifesto',
      handle: 'home',
      fields: fields({...o.scene_manifesto}),
    },
    {
      type: 'scene_nine_hours',
      handle: 'home',
      fields: fields({
        kicker: o.scene_nine_hours.kicker,
        name: o.scene_nine_hours.name,
        chip: o.scene_nine_hours.chip,
        raw: refs.image('scene_nine_hours.raw'),
        done: refs.image('scene_nine_hours.done'),
      }),
    },
    {
      type: 'scene_box',
      handle: 'home',
      fields: fields({
        scrawl: o.scene_box.scrawl,
        line: o.scene_box.line,
        sub: o.scene_box.sub,
        open: refs.image('scene_box.open'),
        closed: refs.image('scene_box.closed'),
      }),
    },
    {
      type: 'scene_drops_heading',
      handle: 'home',
      fields: fields({...o.scene_drops_heading}),
    },
    {
      type: 'scene_kolkata',
      handle: 'home',
      fields: fields({
        word_1: k.word_1,
        word_2: k.word_2,
        word_3: k.word_3,
        meaning: k.meaning,
        reels: ids(k.reels.map((r) => refs.metaobject('reel', r.handle))),
        comments: ids(
          k.comments.map((c) => refs.metaobject('comment', c.handle)),
        ),
      }),
    },
    {
      type: 'scene_behind',
      handle: 'home',
      fields: fields({
        title: o.scene_behind.title,
        byline: o.scene_behind.byline,
        story: o.scene_behind.story,
        link_text: o.scene_behind.link_text,
        photo: refs.image('scene_behind.photo'),
      }),
    },
    {
      type: 'scene_footer',
      handle: 'home',
      fields: fields({
        headline: o.scene_footer.headline,
        highlight: o.scene_footer.highlight,
        pickup_label: o.scene_footer.pickup_label,
        pickup: o.scene_footer.pickup,
        follow_label: o.scene_footer.follow_label,
        fine_print: o.scene_footer.fine_print,
        rolling_words: json(o.scene_footer.rolling_words),
        background: refs.image('scene_footer.background'),
      }),
    },
    {
      type: 'site_settings',
      handle: 'site',
      fields: fields({
        whatsapp_number: o.site_settings.whatsapp_number,
        location_label: o.site_settings.location_label,
        broadcast_link: o.site_settings.broadcast_link,
        instagram: o.site_settings.instagram,
        menu_sections: ids(COLLECTIONS.map((c) => refs.collection(c.handle))),
        og_image: refs.image('site_settings.og_image'),
        seo_title: o.site_settings.seo_title,
        seo_description: o.site_settings.seo_description,
      }),
    },
  ];
}
