import type {FilmFileFragment, FilmQuery} from 'storefrontapi.generated';
import {ORIGINALS, type ArtOriginal} from './originals';

// toFilm(): the FILM_QUERY result → the props the scenes take (PORTING-DECISIONS.md · C).
// Empty text falls back to its original; empty art falls back to the placeholder (D.2.5).
// Decorative slots drop the file's alt text, as `describe: false` did in firebox-official.

export type FilmImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};
export type FilmVideo = {
  sources: {url: string; mimeType: string; width: number; height: number}[];
  poster: FilmImage | null;
};

export type SectionTheme = 'ember' | 'night' | 'kraft' | 'bark';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  /** Whole rupees, shown as 549/-. Null (a 0 price in Shopify): still to come from the client. */
  price: number | null;
  unit: string;
  soldOut: boolean;
  isNew: boolean;
  image: FilmImage | null;
  whatsappMessage: string;
};

export type MenuChapter = {
  id: string;
  title: string;
  theme: SectionTheme;
  items: MenuItem[];
};

export type DropStatus = 'announced' | 'live' | 'soldout';

export type Drop = {
  id: string;
  kind: 'drop' | 'collab';
  name: string;
  description: string | null;
  price: number | null;
  limit: number | null;
  /** YYYY-MM-DD, shown in Kolkata time. Null: shows [Date]. */
  date: string | null;
  /** Empty: shows [Slot]. */
  slot: string;
  status: DropStatus;
  isNew: boolean;
  image: FilmImage | null;
  /** {name} {date} {slot} {price} are filled in at render time. */
  whatsappMessage: string;
  guest: {name: string; url: string; accent: string} | null;
  sortOrder: number;
};

export type Settings = {
  whatsappNumber: string;
  locationLabel: string;
  broadcastLink: string;
  instagram: string;
};

export type Reel = {
  id: string;
  cover: FilmImage;
  video: FilmVideo | null;
  caption: string;
  likes: string;
  subject: string;
};

export type Comment = {id: string; quote: string; by: string; cleared: boolean};

export type Film = ReturnType<typeof toFilm>;

type Value = {value?: string | null} | null | undefined;

function text(field: Value, original: string): string {
  const value = field?.value?.trim();
  return value ? field!.value! : original;
}

function optional(field: Value): string | null {
  return field?.value?.trim() ? field.value : null;
}

function number(field: Value): number | null {
  const n = Number(field?.value);
  return field?.value && Number.isFinite(n) ? n : null;
}

function money(field: Value): number | null {
  if (!field?.value) return null;
  try {
    const amount = Number(
      (JSON.parse(field.value) as {amount?: string}).amount,
    );
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  } catch {
    return null;
  }
}

function list(field: Value): string[] {
  if (!field?.value) return [];
  try {
    const items = JSON.parse(field.value) as unknown;
    return Array.isArray(items)
      ? items.filter(
          (s): s is string => typeof s === 'string' && s.trim() !== '',
        )
      : [];
  } catch {
    return [];
  }
}

type File = FilmFileFragment | null | undefined;

function image(field: File, describe = true): FilmImage | null {
  const ref = field?.reference;
  if (ref?.__typename !== 'MediaImage' || !ref.image) return null;
  const {url, width, height, altText} = ref.image;
  return {
    url,
    width: width ?? 0,
    height: height ?? 0,
    alt: describe ? (altText ?? '') : '',
  };
}

/** An image slot that always has art: the file, or the original placeholder. */
function art(field: File, original: ArtOriginal, describe = true): FilmImage {
  return (
    image(field, describe) ?? {...original, alt: describe ? original.alt : ''}
  );
}

function video(field: File): FilmVideo | null {
  const ref = field?.reference;
  if (ref?.__typename !== 'Video' || !ref.sources.length) return null;
  const poster = ref.previewImage;
  return {
    sources: ref.sources.map(({url, mimeType, width, height}) => ({
      url,
      mimeType,
      width,
      height,
    })),
    poster: poster
      ? {
          url: poster.url,
          width: poster.width ?? 0,
          height: poster.height ?? 0,
          alt: '',
        }
      : null,
  };
}

const THEMES: SectionTheme[] = ['ember', 'night', 'kraft', 'bark'];
const DROP_RANK: Record<DropStatus, number> = {
  live: 0,
  announced: 1,
  soldout: 2,
};

function toMenu(settings: FilmQuery['settings']): MenuChapter[] {
  const sections = settings?.menu_sections?.references?.nodes ?? [];
  return sections
    .filter((node) => 'handle' in node)
    .map((section) => {
      const theme = section.theme?.value as SectionTheme | undefined;
      return {
        id: section.handle,
        title: section.title,
        theme: theme && THEMES.includes(theme) ? theme : 'night',
        items: section.products.nodes.map((p): MenuItem => ({
          id: p.handle,
          name: p.title,
          description: p.description,
          price: Number(p.priceRange.minVariantPrice.amount) || null,
          unit: p.unit?.value ?? '',
          soldOut: !p.availableForSale,
          isNew: p.isNew?.value === 'true',
          image: p.featuredImage
            ? {
                url: p.featuredImage.url,
                width: p.featuredImage.width ?? 0,
                height: p.featuredImage.height ?? 0,
                alt: p.featuredImage.altText ?? p.title,
              }
            : null,
          whatsappMessage:
            p.whatsappMessage?.value ||
            `Hi Firebox! I'd like to pre-order ${p.title} × 1.`,
        })),
      };
    })
    .filter((chapter) => chapter.items.length > 0);
}

/** Live first, then announced, then sold out (newest first). Archived never shows; drafts never arrive. */
function toDrops(nodes: NonNullable<FilmQuery['drops']>['nodes']): Drop[] {
  return nodes
    .map((d): Drop | null => {
      const status = d.status?.value as DropStatus | 'archived' | undefined;
      if (!status || !(status in DROP_RANK)) return null;
      const kind = d.kind?.value === 'collab' ? 'collab' : 'drop';
      return {
        id: d.handle,
        kind,
        name: text(d.name, 'Untitled drop'),
        description: optional(d.description),
        price: money(d.price),
        limit: number(d.limit),
        date: optional(d.date),
        slot: optional(d.slot) ?? '',
        status: status as DropStatus,
        isNew: d.is_new?.value === 'true',
        image: image(d.poster),
        whatsappMessage: text(
          d.whatsapp_message,
          "Hi Firebox! I'd like to pre-order {name} × 1 for {date}.",
        ),
        guest:
          kind === 'collab'
            ? {
                name: text(d.guest_name, '[Guest]'),
                url: optional(d.guest_url) ?? '',
                accent: optional(d.guest_accent) ?? '#E0B482',
              }
            : null,
        sortOrder: number(d.sort_order) ?? 0,
      };
    })
    .filter((d): d is Drop => d !== null)
    .sort((a, b) => {
      const rank = DROP_RANK[a.status] - DROP_RANK[b.status];
      if (rank) return rank;
      if (a.status === 'soldout')
        return (b.date ?? '').localeCompare(a.date ?? '');
      return a.sortOrder - b.sortOrder;
    });
}

export function toFilm(data: FilmQuery) {
  const o = ORIGINALS;
  const {
    settings,
    pit,
    manifesto,
    nineHours,
    box,
    dropsHeading,
    kolkata,
    behind,
    footer,
  } = data;

  const pitArt = art(pit?.art, o.scene_pit.art);
  const reels = (kolkata?.reels?.references?.nodes ?? []).filter(
    (n) => 'cover' in n,
  );
  const comments = (kolkata?.comments?.references?.nodes ?? []).filter(
    (n) => 'quote' in n,
  );
  const rollingWords = list(footer?.rolling_words);

  return {
    settings: {
      whatsappNumber: text(
        settings?.whatsapp_number,
        o.site_settings.whatsapp_number,
      ).replace(/\D/g, ''),
      locationLabel: text(
        settings?.location_label,
        o.site_settings.location_label,
      ),
      broadcastLink: optional(settings?.broadcast_link) ?? '',
      instagram: text(settings?.instagram, o.site_settings.instagram).replace(
        /^@/,
        '',
      ),
    } satisfies Settings,
    seo: {
      title: text(settings?.seo_title, o.site_settings.seo_title),
      description: text(
        settings?.seo_description,
        o.site_settings.seo_description,
      ),
      ogImage: image(settings?.og_image),
    },
    menu: toMenu(settings),
    drops: toDrops(data.drops?.nodes ?? []),

    pit: {
      headline: text(pit?.headline, o.scene_pit.headline),
      sub: text(pit?.sub, o.scene_pit.sub),
      cta: text(pit?.cta, o.scene_pit.cta),
      note: text(pit?.note, o.scene_pit.note),
      art: pitArt,
      // Shares the wide art's description.
      artPhone: {
        ...art(pit?.art_phone, o.scene_pit.art_phone),
        alt: pitArt.alt,
      },
      smoke: video(pit?.smoke),
    },
    manifesto: {
      text: text(manifesto?.text, o.scene_manifesto.text),
      chip: text(manifesto?.chip, o.scene_manifesto.chip),
    },
    nineHours: {
      kicker: text(nineHours?.kicker, o.scene_nine_hours.kicker),
      name: text(nineHours?.name, o.scene_nine_hours.name),
      chip: text(nineHours?.chip, o.scene_nine_hours.chip),
      raw: art(nineHours?.raw, o.scene_nine_hours.raw, false),
      done: art(nineHours?.done, o.scene_nine_hours.done),
    },
    box: {
      scrawl: text(box?.scrawl, o.scene_box.scrawl),
      line: text(box?.line, o.scene_box.line),
      sub: text(box?.sub, o.scene_box.sub),
      open: art(box?.open, o.scene_box.open),
      closed: art(box?.closed, o.scene_box.closed, false),
    },
    dropsHeading: {
      title: text(dropsHeading?.title, o.scene_drops_heading.title),
      sub: text(dropsHeading?.sub, o.scene_drops_heading.sub),
    },
    kolkata: {
      words: [
        text(kolkata?.word_1, o.scene_kolkata.word_1),
        text(kolkata?.word_2, o.scene_kolkata.word_2),
        text(kolkata?.word_3, o.scene_kolkata.word_3),
      ] as const,
      meaning: text(kolkata?.meaning, o.scene_kolkata.meaning),
      reels:
        (reels.length ? reels : null)?.map((r, i): Reel => {
          const fallback =
            o.scene_kolkata.reels[i % o.scene_kolkata.reels.length];
          return {
            id: r.handle,
            cover: art(r.cover, fallback.cover, false),
            video: video(r.video),
            caption: text(r.caption, ''),
            likes: text(r.likes, ''),
            subject: text(r.subject, ''),
          };
        }) ??
        o.scene_kolkata.reels.map((r) => ({
          id: r.handle,
          cover: {...r.cover, alt: ''},
          video: null,
          caption: r.caption,
          likes: r.likes,
          subject: r.subject,
        })),
      comments:
        (comments.length ? comments : null)?.map((c): Comment => ({
          id: c.handle,
          quote: text(c.quote, ''),
          by: text(c.by, ''),
          cleared: c.cleared?.value === 'true',
        })) ?? o.scene_kolkata.comments.map((c) => ({...c, id: c.handle})),
    },
    behind: {
      title: text(behind?.title, o.scene_behind.title),
      byline: text(behind?.byline, o.scene_behind.byline),
      story: text(behind?.story, o.scene_behind.story),
      linkText: text(behind?.link_text, o.scene_behind.link_text),
      photo: art(behind?.photo, o.scene_behind.photo),
    },
    footer: {
      headline: text(footer?.headline, o.scene_footer.headline),
      highlight: text(footer?.highlight, o.scene_footer.highlight),
      pickupLabel: text(footer?.pickup_label, o.scene_footer.pickup_label),
      pickup: text(footer?.pickup, o.scene_footer.pickup),
      followLabel: text(footer?.follow_label, o.scene_footer.follow_label),
      finePrint: text(footer?.fine_print, o.scene_footer.fine_print),
      rollingWords: rollingWords.length
        ? rollingWords
        : [...o.scene_footer.rolling_words],
      background: art(footer?.background, o.scene_footer.background, false),
      smoke: video(footer?.smoke),
    },
  };
}
