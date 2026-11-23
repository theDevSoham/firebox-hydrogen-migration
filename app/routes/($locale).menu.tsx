import {useLoaderData} from 'react-router';
import type {Route} from './+types/($locale).menu';
import {MenuPage} from '~/components/film/menu/MenuPage';
import {toMenuPage} from '~/lib/film/model';
import {MENU_QUERY} from '~/lib/film/query';
import filmStyles from '~/styles/film.css?url';

// /menu: the menu on its own, quick to load and scan (no film). `handle.film` drops the
// skeleton's chrome and styles, as on the home and cart pages (app/root.tsx).
export const handle = {film: true};

export const links: Route.LinksFunction = () => [
  {rel: 'stylesheet', href: filmStyles},
];

export const meta: Route.MetaFunction = ({data}) => {
  const title = 'Menu · The Firebox';
  if (!data) return [{title}];
  const chapters = data.menu.map((category) => category.title).join(', ');
  const description = `${chapters ? `${chapters}. ` : ''}Low & slow, wood smoked barbeque from The Firebox, ${data.settings.locationLabel}. Add to your box and check out online.`;
  return [
    {title},
    {name: 'description', content: description},
    {name: 'theme-color', content: '#160B06'},
    {name: 'color-scheme', content: 'dark'},
    {tagName: 'link', rel: 'canonical', href: data.url},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: 'The Firebox'},
    {property: 'og:url', content: data.url},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:image', content: `${data.origin}/brand/og.png`},
  ];
};

export async function loader({context, request}: Route.LoaderArgs) {
  // The film's menu fragments and mapping (PORTING-DECISIONS.md · C), in a query of its own.
  // Short cache, as on the home page, so admin edits show within about a minute (D.3.2).
  const data = await context.storefront.query(MENU_QUERY, {
    cache: context.storefront.CacheShort(),
  });
  const {origin, pathname} = new URL(request.url);
  return {...toMenuPage(data), origin, url: `${origin}${pathname}`};
}

export default function Menu() {
  const {menu, settings} = useLoaderData<typeof loader>();
  return <MenuPage categories={menu} settings={settings} />;
}
