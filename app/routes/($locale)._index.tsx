import {useLoaderData} from 'react-router';
import type {Route} from './+types/($locale)._index';
import {Film} from '~/components/film/Film';
import {toFilm} from '~/lib/film/model';
import {FILM_QUERY} from '~/lib/film/query';
import filmStyles from '~/styles/film.css?url';
import antonFont from '~/assets/fonts/anton-latin-400-normal.woff2?url';
import frauncesFont from '~/assets/fonts/fraunces-300-soft100-wonk1.woff2?url';
import yanoneFont from '~/assets/fonts/yanone-kaffeesatz-latin-wght-normal.woff2?url';

// The home page is the film. `handle.film` tells the root layout to drop the skeleton's header,
// footer and stylesheets here (app/root.tsx).
export const handle = {film: true};

export const links: Route.LinksFunction = () => [
  {rel: 'stylesheet', href: filmStyles},
  // The three faces on the first screen (headline, the line under it, buttons and chips),
  // fetched with the stylesheet instead of after it. Jost and Permanent Marker come later.
  ...[antonFont, yanoneFont, frauncesFont].map((href) => ({
    rel: 'preload',
    href,
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous' as const,
  })),
];

export const meta: Route.MetaFunction = ({data}) => {
  if (!data) return [{title: 'The Firebox'}];
  const {title, description} = data.seo;
  // The Sharing image from Site settings, else the one drawn by `npm run og:image`.
  const og = data.seo.ogImage ?? {
    url: `${data.origin}/brand/og.png`,
    width: 1200,
    height: 630,
    alt: '',
  };
  return [
    {title},
    {name: 'description', content: description},
    {name: 'theme-color', content: '#160B06'},
    {name: 'color-scheme', content: 'dark'},
    {tagName: 'link', rel: 'canonical', href: data.url},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: 'The Firebox'},
    {property: 'og:locale', content: 'en_IN'},
    {property: 'og:url', content: data.url},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:image', content: og.url},
    {property: 'og:image:width', content: String(og.width)},
    {property: 'og:image:height', content: String(og.height)},
    {
      property: 'og:image:alt',
      content: og.alt || 'The Firebox: low & slow, wood smoked',
    },
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
    {name: 'twitter:image', content: og.url},
  ];
};

export async function loader({context, request}: Route.LoaderArgs) {
  // Everything the film shows, in one Storefront API query (PORTING-DECISIONS.md · C). Short
  // cache, so edits in the Shopify admin show within about a minute (D.3.2).
  const data = await context.storefront.query(FILM_QUERY, {
    cache: context.storefront.CacheShort(),
  });
  const {origin, pathname} = new URL(request.url);
  // Absolute URLs for the sharing tags.
  return {...toFilm(data), origin, url: `${origin}${pathname}`};
}

export default function Homepage() {
  const film = useLoaderData<typeof loader>();
  return <Film film={film} />;
}
