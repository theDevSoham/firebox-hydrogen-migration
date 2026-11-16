// The store's content model: PORTING-DECISIONS.md section B, as Shopify definitions.
// scripts/shopify-setup.ts creates these, and on later runs brings them in line with this file
// (names, help text, limits, new fields). It never deletes a field or changes a field's type:
// Shopify doesn't allow that once entries exist, so the script reports it instead.
//
// Everything is merchant-owned (plain type names, namespace "firebox"), so staff edit it in the
// Shopify admin and it doesn't depend on the setup app staying installed. Every definition is
// readable by the storefront.

export type Validation = {name: string; value: string};

export type FieldDef = {
  key: string;
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  validations?: Validation[];
  /** list.metaobject_reference: the metaobject type it points at (resolved to an id at run time). */
  references?: string;
};

export type MetafieldDef = FieldDef & {
  namespace: 'firebox';
  ownerType: 'PRODUCT' | 'COLLECTION';
};

export type MetaobjectDef = {
  type: string;
  name: string;
  description: string;
  displayNameKey?: string;
  /** Draft / Active status, so drafts never reach the storefront (B.3). */
  publishable?: boolean;
  fields: FieldDef[];
};

const max = (n: number): Validation => ({name: 'max', value: String(n)});
const min = (n: number): Validation => ({name: 'min', value: String(n)});
const choices = (...values: string[]): Validation => ({
  name: 'choices',
  value: JSON.stringify(values),
});
const images: Validation = {
  name: 'file_type_options',
  value: JSON.stringify(['Image']),
};
const videos: Validation = {
  name: 'file_type_options',
  value: JSON.stringify(['Video']),
};

const text = (
  key: string,
  name: string,
  limit: number,
  description?: string,
): FieldDef => ({
  key,
  name,
  type: 'single_line_text_field',
  description,
  validations: [max(limit)],
});
const lines = (
  key: string,
  name: string,
  limit: number,
  description?: string,
): FieldDef => ({
  key,
  name,
  type: 'multi_line_text_field',
  description,
  validations: [max(limit)],
});
const image = (key: string, name: string, description: string): FieldDef => ({
  key,
  name,
  type: 'file_reference',
  description,
  validations: [images],
});
const video = (key: string, name: string, description: string): FieldDef => ({
  key,
  name,
  type: 'file_reference',
  description,
  validations: [videos],
});

const EMPTY_FALLS_BACK = 'Left empty, the site shows the original.';

// ---------- B.1 / B.2 · metafields on products and collections ----------

export const METAFIELD_DEFINITIONS: MetafieldDef[] = [
  {
    namespace: 'firebox',
    ownerType: 'PRODUCT',
    ...text(
      'unit',
      'Unit',
      20,
      'Shown under the dish, e.g. "350 g", "4 pcs", "Whole rack".',
    ),
  },
  {
    namespace: 'firebox',
    ownerType: 'PRODUCT',
    key: 'is_new',
    name: 'New',
    type: 'boolean',
    description: 'Shows the NEW seal on the dish card.',
  },
  {
    namespace: 'firebox',
    ownerType: 'PRODUCT',
    ...lines(
      'whatsapp_message',
      'WhatsApp message',
      300,
      'Pre-filled when someone taps Order. Can use {name}, {price}.',
    ),
  },
  {
    namespace: 'firebox',
    ownerType: 'COLLECTION',
    key: 'theme',
    name: 'Chapter colour',
    type: 'single_line_text_field',
    description: 'The colour of this menu chapter on the site.',
    validations: [choices('ember', 'night', 'kraft', 'bark')],
  },
];

// ---------- B.3–B.5 · metaobjects, in the order they must be created ----------

export const METAOBJECT_DEFINITIONS: MetaobjectDef[] = [
  {
    type: 'reel',
    name: 'Reel',
    description:
      'An Instagram reel in the "Ki bolchhe Kolkata?" pile (scene 7).',
    displayNameKey: 'caption',
    fields: [
      image(
        'cover',
        'Cover',
        'Tall 9:16, at least 640 px high. Empty: the site shows its placeholder.',
      ),
      video(
        'video',
        'Clip',
        'Optional. Plays muted when tapped; without it the cover slowly zooms.',
      ),
      text('caption', 'Caption', 24),
      text('likes', 'Likes', 8, 'As shown on Instagram, e.g. "4.3K".'),
      text('subject', 'What it shows', 80, 'Read out by screen readers.'),
      {
        key: 'instagram_url',
        name: 'Instagram link',
        type: 'url',
        description: 'Optional.',
      },
    ],
  },
  {
    type: 'comment',
    name: 'Comment',
    description: 'A customer comment in the scene 7 pile.',
    displayNameKey: 'by',
    fields: [
      {...lines('quote', 'Quote', 120), required: true},
      text('by', 'Who said it', 40),
      {
        key: 'cleared',
        name: 'Permission to quote',
        type: 'boolean',
        description:
          'Until this is on, the card says "Placeholder · needs permission".',
      },
    ],
  },
  {
    type: 'drop',
    name: 'Drop',
    description:
      'A limited drop or collab night on the "Only 20" wall (scene 6). Drafts never show.',
    displayNameKey: 'name',
    publishable: true,
    fields: [
      {...text('name', 'Name', 40), required: true},
      {
        key: 'kind',
        name: 'Kind',
        type: 'single_line_text_field',
        required: true,
        description: '"collab" adds the guest fields and the guest colour.',
        validations: [choices('drop', 'collab')],
      },
      {
        key: 'status',
        name: 'Status',
        type: 'single_line_text_field',
        required: true,
        description:
          'live: pre-orders open · announced: shown as next · soldout: stamped · archived: hidden.',
        validations: [choices('announced', 'live', 'soldout', 'archived')],
      },
      text('description', 'Line', 120, 'Optional, one line.'),
      {
        key: 'price',
        name: 'Price',
        type: 'money',
        description: 'In rupees. Empty shows [Price].',
      },
      {
        key: 'limit',
        name: 'How many',
        type: 'number_integer',
        description: 'Shown as "Only 20".',
        validations: [min(1)],
      },
      {
        key: 'date',
        name: 'Date',
        type: 'date',
        description: 'Empty shows [Date].',
      },
      text('slot', 'Time slot', 20, 'e.g. "7–9 pm". Empty shows [Slot].'),
      {key: 'is_new', name: 'New', type: 'boolean'},
      image(
        'poster',
        'Poster',
        'Portrait 4:5, at least 800 px wide. Without one, the name is set in big type.',
      ),
      lines(
        'whatsapp_message',
        'WhatsApp message',
        300,
        'Pre-filled on Pre-order. Can use {name}, {date}, {slot}, {price}.',
      ),
      text('guest_name', 'Guest kitchen', 40, 'Collabs only.'),
      {
        key: 'guest_url',
        name: 'Guest link',
        type: 'url',
        description: 'Collabs only.',
      },
      {
        key: 'guest_accent',
        name: 'Guest colour',
        type: 'color',
        description: 'Collabs only: the card’s top edge.',
      },
      {
        key: 'sort_order',
        name: 'Order',
        type: 'number_integer',
        description: 'Lower first, among live and announced drops.',
      },
      {
        key: 'product',
        name: 'Product',
        type: 'product_reference',
        description: 'Optional, for when drops can be bought online.',
      },
    ],
  },
  {
    type: 'scene_pit',
    name: 'Scene 1 · The pit',
    description:
      'The first screen: the rooftop art, the headline and the pre-order button. ' +
      EMPTY_FALLS_BACK,
    fields: [
      text('headline', 'Headline', 40),
      text('sub', 'Line under the headline', 90),
      text('cta', 'Button', 30, 'Scrolls down to the menu.'),
      text('note', 'Small print beside the button', 60),
      image(
        'art',
        'Art, tablets and computers',
        'Wide, about 16:10, at least 1200 px wide. Fills the first screen.',
      ),
      image(
        'art_phone',
        'Art, phones',
        'Tall, about 9:20, at least 1200 px high. Shares the description above.',
      ),
      video(
        'smoke',
        'Smoke video',
        'Optional. Empty: the drawn smoke plays instead.',
      ),
    ],
  },
  {
    type: 'scene_manifesto',
    name: 'Scene 2 · Manifesto',
    description:
      'The big paragraph that heats from ash to cream. ' + EMPTY_FALLS_BACK,
    fields: [lines('text', 'Manifesto', 160), text('chip', 'Sticker', 30)],
  },
  {
    type: 'scene_nine_hours',
    name: 'Scene 3 · Nine hours',
    description:
      'The clock scene. The clock counts on its own. ' + EMPTY_FALLS_BACK,
    fields: [
      text('kicker', 'Above the clock', 40),
      text('name', 'Under the clock', 50),
      text('chip', 'Sticker', 30),
      image(
        'raw',
        'Before: raw',
        'Wide, at least 1200 px. Fades into "After", so keep the same framing.',
      ),
      image('done', 'After: sliced', 'Wide, at least 1200 px.'),
    ],
  },
  {
    type: 'scene_box',
    name: 'Scene 5 · Open the box',
    description: 'The box that opens. ' + EMPTY_FALLS_BACK,
    fields: [
      text('scrawl', 'Scrawl on the kraft paper', 30),
      lines(
        'line',
        'Big line',
        80,
        'Each new line starts a new line on the site.',
      ),
      text('sub', 'Small line', 70),
      image('open', 'Open box', 'Wide, at least 1200 px. Fills the screen.'),
      image(
        'closed',
        'Closed box',
        'At least 1000 px wide. The lid lifts along a line 65.5% of the way down: keep the seam there.',
      ),
    ],
  },
  {
    type: 'scene_drops_heading',
    name: 'Scene 6 · Only 20',
    description:
      'The heading over the drops. The drops themselves are Drop entries. ' +
      EMPTY_FALLS_BACK,
    fields: [
      text('title', 'Heading', 16),
      text('sub', 'Line under the heading', 60),
    ],
  },
  {
    type: 'scene_kolkata',
    name: 'Scene 7 · Ki bolchhe Kolkata?',
    description:
      'Three giant words over a pile of reels and comments. ' +
      EMPTY_FALLS_BACK,
    fields: [
      text('word_1', 'Giant word 1', 12),
      text('word_2', 'Giant word 2', 12),
      text('word_3', 'Giant word 3', 12),
      text(
        'meaning',
        'What the words mean',
        60,
        'Read out by screen readers after the three words.',
      ),
      {
        key: 'reels',
        name: 'Reels',
        type: 'list.metaobject_reference',
        description: 'Drag to reorder. The first four take the designed spots.',
        references: 'reel',
      },
      {
        key: 'comments',
        name: 'Comments',
        type: 'list.metaobject_reference',
        description: 'Drag to reorder. The first two take the designed spots.',
        references: 'comment',
      },
    ],
  },
  {
    type: 'scene_behind',
    name: 'Scene 8 · Behind the pit',
    description: 'The black-and-white story scene. ' + EMPTY_FALLS_BACK,
    fields: [
      lines(
        'title',
        'Heading',
        30,
        'Each new line starts a new line on the site.',
      ),
      text('byline', 'Byline', 50),
      lines('story', 'Story', 1200),
      text('link_text', 'Instagram link text', 50),
      image(
        'photo',
        'Photo',
        'Wide, at least 1200 px. Shown in black and white.',
      ),
    ],
  },
  {
    type: 'scene_footer',
    name: 'Scene 9 · Footer',
    description:
      'The end card. The number and the location are in Site settings. ' +
      EMPTY_FALLS_BACK,
    fields: [
      text('headline', 'Headline', 30),
      text('highlight', 'Headline, highlighted end', 20),
      text('pickup_label', 'Pick-up heading', 30),
      text('pickup', 'Pick-up text', 120, 'Follows the location.'),
      text('follow_label', 'Instagram heading', 30),
      text('fine_print', 'Fine print', 120),
      {
        key: 'rolling_words',
        name: 'Rolling words',
        type: 'list.single_line_text_field',
        description: 'They roll past one at a time along the bottom.',
        validations: [max(30)],
      },
      image(
        'background',
        'Background',
        'Wide and dark, at least 1200 px. Sits under the smoke.',
      ),
      video(
        'smoke',
        'Smoke video',
        'Optional. Empty: the drawn smoke plays instead.',
      ),
    ],
  },
  {
    type: 'site_settings',
    name: 'Site settings',
    description:
      'One entry (handle "site"): contact details, the menu order and search/sharing text.',
    fields: [
      {
        key: 'whatsapp_number',
        name: 'WhatsApp number',
        type: 'single_line_text_field',
        description:
          'With country code, e.g. 919830346470. The only number the site shows.',
        validations: [{name: 'regex', value: '^\\+?[0-9 ]{8,16}$'}],
      },
      text(
        'location_label',
        'Location',
        60,
        'Never more precise than the area, e.g. "Mukundapur, Kolkata".',
      ),
      {
        key: 'broadcast_link',
        name: 'Drops list link',
        type: 'url',
        description:
          'WhatsApp broadcast or community link for "Get the next drop". Empty: opens a chat instead.',
      },
      text('instagram', 'Instagram handle', 30, 'Without the @.'),
      {
        key: 'menu_sections',
        name: 'Menu chapters',
        type: 'list.collection_reference',
        description:
          'The collections shown in "The cuts", in this order. Drag to reorder.',
      },
      image(
        'og_image',
        'Sharing image',
        '1200 × 630, shown when the site is shared.',
      ),
      text('seo_title', 'Search title', 80),
      lines('seo_description', 'Search description', 200),
    ],
  },
];

/** Every access scope the setup app needs (docs/shopify-access.md). */
export const REQUIRED_SCOPES = [
  'write_products',
  'write_metaobject_definitions',
  'write_metaobjects',
  'write_files',
  'write_publications',
];
