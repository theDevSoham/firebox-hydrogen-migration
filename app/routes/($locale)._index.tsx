import {useLoaderData} from 'react-router';
import type {Route} from './+types/($locale)._index';
import {Film} from '~/components/film/Film';
import {toFilm} from '~/lib/film/model';
import {STATIC_FILM} from '~/lib/film/static';
import filmStyles from '~/styles/film.css?url';
import antonFont from '~/assets/fonts/anton-latin-400-normal.woff2?url';

// The home page is the film. `handle.film` tells the root layout to drop the skeleton's header,
// footer and stylesheets here (app/root.tsx).
export const handle = {film: true};

export const links: Route.LinksFunction = () => [
  {rel: 'stylesheet', href: filmStyles},
  // Only Anton is preloaded: it sets the S1 headline, the page's largest paint.
  {
    rel: 'preload',
    href: antonFont,
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
];

export const meta: Route.MetaFunction = ({data}) => {
  const title = data?.seo.title ?? 'The Firebox';
  const description = data?.seo.description ?? '';
  const og = data?.seo.ogImage;
  return [
    {title},
    {name: 'description', content: description},
    {name: 'theme-color', content: '#160B06'},
    {name: 'color-scheme', content: 'dark'},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: 'The Firebox'},
    {property: 'og:locale', content: 'en_IN'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    ...(og
      ? [
          {property: 'og:image', content: og.url},
          {property: 'og:image:width', content: String(og.width)},
          {property: 'og:image:height', content: String(og.height)},
        ]
      : []),
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
};

export async function loader(_args: Route.LoaderArgs) {
  // Build order step 1: a static result shaped exactly like FILM_QUERY (~/lib/film/query.ts).
  // Step 3 replaces this line with:
  //   const data = await context.storefront.query(FILM_QUERY, {cache: context.storefront.CacheShort()});
  const data = STATIC_FILM;
  return toFilm(data);
}

export default function Homepage() {
  const film = useLoaderData<typeof loader>();
  return <Film film={film} />;
}
