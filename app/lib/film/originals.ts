// Today's original copy and art for every scene field (from firebox-official lib/content.ts and
// lib/media.ts). Two jobs: scripts/shopify-setup.ts seeds the store from them, and ./model.ts
// falls back to them whenever a field in Shopify is empty (PORTING-DECISIONS.md · D.2.5), so the
// page never breaks if someone clears one. The art lives in public/placeholders/.
//
// Keys are the metaobject field keys from section B.4.

export type ArtOriginal = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

const art = (
  file: string,
  width: number,
  height: number,
  alt = '',
): ArtOriginal => ({
  url: `/placeholders/${file}`,
  width,
  height,
  alt,
});

const PIT_ALT =
  'Painted concept art: a kettle grill and an offset smoker on a Kolkata rooftop at dusk, smoke rising into a peach sky';

export const ORIGINALS = {
  scene_pit: {
    headline: 'Off a rooftop pit.',
    sub: 'Kolkata’s first low & slow, wood smoked barbeque.',
    cta: 'Pre-order on WhatsApp',
    note: 'Pre-order only · pick up in Mukundapur',
    art: art('ca-01-pit-dusk.jpg', 1221, 768, PIT_ALT),
    art_phone: art('ca-01b-pit-dusk-mobile.jpg', 613, 1376, PIT_ALT),
  },
  scene_manifesto: {
    text: 'Time is the ingredient. Nine hours over wood. Butchered in-house. Only twenty a drop.',
    chip: 'Straight off the pit',
  },
  scene_nine_hours: {
    kicker: 'Over wood, low & slow',
    name: 'Brisket-style pork belly.',
    chip: 'Often sold out',
    raw: art('ca-03-raw-MOCK.jpg', 1221, 768),
    done: art(
      'ca-03-slice.jpg',
      1221,
      768,
      'Painted concept art: brisket-style pork belly sliced on a board, with black-pepper bark and a pink smoke ring',
    ),
  },
  scene_box: {
    scrawl: 'pulled pork · 24 hrs',
    line: 'Packed by hand.\nSealed with tape.',
    sub: 'Pick up in Mukundapur, or book your own ride',
    open: art(
      'ca-08-box-open.jpg',
      1221,
      768,
      'Painted concept art: an opened kraft box with pulled pork in a bun, steam rising',
    ),
    closed: art('ca-08b-box-closed.jpg', 1024, 869),
  },
  scene_drops_heading: {
    title: 'Only 20.',
    sub: 'Then sold out. Pre-order on WhatsApp.',
  },
  scene_kolkata: {
    word_1: 'Ki',
    word_2: 'Bolchhe',
    word_3: 'Kolkata?',
    meaning: 'What’s Kolkata saying?',
    reels: [
      {
        handle: 'belly',
        cover: art('reel-belly.jpg', 361, 640),
        caption: 'Belly, 9 hrs',
        likes: '4.3K',
        subject: 'brisket-style belly being sliced',
      },
      {
        handle: 'ribs',
        cover: art('reel-ribs.jpg', 361, 640),
        caption: 'Whole racks',
        likes: '780',
        subject: 'whole pork spare ribs',
      },
      {
        handle: 'flambe',
        cover: art('reel-flambe.jpg', 361, 640),
        caption: 'Rum flambé',
        likes: '273',
        subject: 'burnt ends flambéed in dark rum',
      },
      {
        handle: 'burger',
        cover: art('reel-burger.jpg', 360, 640),
        caption: 'Buff burger',
        likes: '605',
        subject: 'smoked buff cheeseburger at the grill',
      },
    ],
    comments: [
      {
        handle: 'best-chef',
        quote: '“The best chef in all of Kolkata.”',
        by: 'IG comment · ribs reel',
        cleared: false,
      },
      {
        handle: 'every-week',
        quote: '“I can’t be ordering from you every week.”',
        by: 'A repeat customer · IG',
        cleared: false,
      },
    ],
  },
  scene_behind: {
    title: 'Behind\nthe pit',
    byline: 'Hreed Gupta · chef & owner',
    story:
      '[Origin story in Hreed’s words: when the pit was first lit, and why it’s called The Firebox.]',
    link_text: 'Watch Behind the Pit on Instagram',
    photo: art(
      'ca-10-behind-the-pit.jpg',
      1221,
      768,
      'Painted concept art: two figures sit by a glowing kettle grill on a rooftop terrace at night',
    ),
  },
  scene_footer: {
    headline: 'Pre-order on',
    highlight: 'WhatsApp.',
    pickup_label: 'Pick up',
    pickup: 'Or book your own Uber or Porter.',
    follow_label: 'Follow the smoke',
    fine_print: 'Illustrations are concept art, placeholders until the shoot.',
    rolling_words: [
      'Low & slow',
      'Nine hours',
      'Wood smoked',
      'Only 20',
      'In-house',
    ],
    background: art('ca-01-night-MOCK.jpg', 1221, 768),
  },
  site_settings: {
    whatsapp_number: '919830346470',
    location_label: 'Mukundapur, Kolkata',
    broadcast_link: '',
    instagram: 'thefireboxkolkata',
    seo_title:
      'The Firebox · Low & slow, wood smoked barbeque · Mukundapur, Kolkata',
    seo_description:
      "Kolkata's first low & slow, wood smoked barbeque, off a rooftop pit in Mukundapur. Nine hours over wood. Only twenty a drop. Pre-order on WhatsApp.",
  },
} as const;

/** The original art, for the seed script and for the static film. */
export const PLACEHOLDER_ART = {
  belly: art(
    'ca-03-slice.jpg',
    1221,
    768,
    'Brisket-style pork belly, sliced (concept art)',
  ),
  ribs: art(
    'ca-04-ribs-raw.jpg',
    814,
    1018,
    'Two whole racks of pork spare ribs held over an offset smoker (concept art)',
  ),
  pulledPork: art(
    'ca-08-box-open.jpg',
    1221,
    768,
    'Pulled pork in a bun, in an open kraft box (concept art)',
  ),
  burntEnds: art(
    'ca-02-flambe.jpg',
    1221,
    768,
    'Pork belly burnt ends being flambéed in dark rum (concept art)',
  ),
  sandwich4: art(
    'ca-05-sandwich-of-the-day-4.jpg',
    832,
    1040,
    'Sandwich of the Day #4 (concept art)',
  ),
  bigBuffon: art(
    'ca-07-buff-burger.jpg',
    832,
    1040,
    'The Big Buffon burger (concept art)',
  ),
} as const;
