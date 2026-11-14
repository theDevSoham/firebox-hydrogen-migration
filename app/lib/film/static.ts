import type {FilmQuery} from 'storefrontapi.generated';
import {ORIGINALS, type ArtOriginal} from './originals';
import {
  DROP_MESSAGE,
  DROPS_SEED,
  MENU_SEED,
  type DropSeed,
  type ProductSeed,
} from './seed';

// The film's data as the Storefront API will return it for FILM_QUERY (./query.ts), with no
// store behind it: build order step 1. Every value is in Shopify's wire format (metaobject
// values are strings; money and lists are JSON; booleans are "true"/"false"), so step 3 only
// swaps this for `storefront.query(FILM_QUERY)`. The menu and drops come from ./seed.ts.

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

const o = ORIGINALS;

// ---------- B.1 / B.2 · Products in Collections ----------

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

const MENU_SECTIONS = MENU_SEED.map((section) => ({
  id: `gid://shopify/Collection/static-${section.handle}`,
  handle: section.handle,
  title: section.title,
  theme: v(section.theme),
  products: {nodes: section.products.map(product)},
}));

// ---------- B.3 · Drops ----------

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

const DROPS = DROPS_SEED.map(drop);

// ---------- the whole query result ----------

export const STATIC_FILM: FilmQuery = {
  settings: {
    whatsapp_number: v(o.site_settings.whatsapp_number),
    location_label: v(o.site_settings.location_label),
    broadcast_link: v(o.site_settings.broadcast_link),
    instagram: v(o.site_settings.instagram),
    menu_sections: {references: {nodes: MENU_SECTIONS}},
    og_image: null,
    seo_title: v(o.site_settings.seo_title),
    seo_description: v(o.site_settings.seo_description),
  },
  pit: {
    headline: v(o.scene_pit.headline),
    sub: v(o.scene_pit.sub),
    cta: v(o.scene_pit.cta),
    note: v(o.scene_pit.note),
    art: file(o.scene_pit.art),
    art_phone: file(o.scene_pit.art_phone),
    smoke: null,
  },
  manifesto: {text: v(o.scene_manifesto.text), chip: v(o.scene_manifesto.chip)},
  nineHours: {
    kicker: v(o.scene_nine_hours.kicker),
    name: v(o.scene_nine_hours.name),
    chip: v(o.scene_nine_hours.chip),
    raw: file(o.scene_nine_hours.raw),
    done: file(o.scene_nine_hours.done),
  },
  box: {
    scrawl: v(o.scene_box.scrawl),
    line: v(o.scene_box.line),
    sub: v(o.scene_box.sub),
    open: file(o.scene_box.open),
    closed: file(o.scene_box.closed),
  },
  dropsHeading: {
    title: v(o.scene_drops_heading.title),
    sub: v(o.scene_drops_heading.sub),
  },
  kolkata: {
    word_1: v(o.scene_kolkata.word_1),
    word_2: v(o.scene_kolkata.word_2),
    word_3: v(o.scene_kolkata.word_3),
    meaning: v(o.scene_kolkata.meaning),
    reels: {
      references: {
        nodes: o.scene_kolkata.reels.map((reel) => ({
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
        nodes: o.scene_kolkata.comments.map((comment) => ({
          handle: comment.handle,
          quote: v(comment.quote),
          by: v(comment.by),
          cleared: bool(comment.cleared),
        })),
      },
    },
  },
  behind: {
    title: v(o.scene_behind.title),
    byline: v(o.scene_behind.byline),
    story: v(o.scene_behind.story),
    link_text: v(o.scene_behind.link_text),
    photo: file(o.scene_behind.photo),
  },
  footer: {
    headline: v(o.scene_footer.headline),
    highlight: v(o.scene_footer.highlight),
    pickup_label: v(o.scene_footer.pickup_label),
    pickup: v(o.scene_footer.pickup),
    follow_label: v(o.scene_footer.follow_label),
    fine_print: v(o.scene_footer.fine_print),
    rolling_words: v(JSON.stringify(o.scene_footer.rolling_words)),
    background: file(o.scene_footer.background),
    smoke: null,
  },
  drops: {nodes: DROPS},
};
