import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useLocation,
  useMatches,
  useRouteLoaderData,
} from 'react-router';
import type {Route} from './+types/root';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import waFloatStyles from '~/styles/wa-float.css?url';
import tailwindCss from './styles/tailwind.css?url';
import {PageLayout} from './components/PageLayout';
import {GoogleAnalytics} from './components/GoogleAnalytics';
import {Clarity} from './components/Clarity';
import {WhatsAppFloat} from './components/film/site/WhatsAppFloat';
import {WhatsAppTracker} from './components/film/site/WhatsAppTracker';
import {clarityProjectId, gaMeasurementId} from '~/lib/analytics';
import {toWhatsAppFloat} from '~/lib/film/model';
import {SITE_SETTINGS_QUERY} from '~/lib/film/query';

export type RootLoader = typeof loader;

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/png', href: '/icon.png'},
    {rel: 'apple-touch-icon', href: '/apple-icon.png'},
    {rel: 'manifest', href: '/manifest.webmanifest'},
  ];
}

export async function loader(args: Route.LoaderArgs) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    gaMeasurementId: gaMeasurementId(env),
    clarityProjectId: clarityProjectId(env),
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: Route.LoaderArgs) {
  const {storefront} = context;

  const [header, siteSettings] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        headerMenuHandle: 'main-menu', // Adjust to your header menu handle
      },
    }),
    // The few Site settings every page shows (the floating WhatsApp button). Short cache, so the
    // admin toggle shows within a minute (D.3.2). A failure only hides the button.
    storefront
      .query(SITE_SETTINGS_QUERY, {cache: storefront.CacheShort()})
      .catch((error: Error) => {
        console.error(error);
        return null;
      }),
  ]);

  return {header, whatsappFloat: toWhatsAppFloat(siteSettings)};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: Route.LoaderArgs) {
  const {storefront, customerAccount, cart} = context;

  // defer the footer query (below the fold)
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        footerMenuHandle: 'footer', // Adjust to your footer menu handle
      },
    })
    .catch((error: Error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });
  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
  };
}

/**
 * Runs before first paint. data-motion marks that motion will run, which is whenever JavaScript
 * does: the film plays for every visitor, whatever their reduced-motion setting (the client's
 * call). Without JavaScript the static film stands. data-intro says S0 should play: home page,
 * no deep link, not yet seen this session. Inline, so it carries Hydrogen's CSP nonce (D.3.4).
 */
const MOTION_FLAGS = `(function(){var d=document.documentElement;d.setAttribute("data-motion","");try{if(location.pathname==="/"&&!location.hash&&!sessionStorage.getItem("fb-intro"))d.setAttribute("data-intro","")}catch(e){}})()`;

/** Routes with `handle.film` (the home page) render without the skeleton's chrome and styles. */
function useIsFilm() {
  return useMatches().some(
    (match) => (match.handle as {film?: boolean} | undefined)?.film,
  );
}

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const isFilm = useIsFilm();

  return (
    // The pre-paint script adds data-motion / data-intro before hydration.
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,viewport-fit=cover"
        />
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{__html: MOTION_FLAGS}}
        />
        <link rel="stylesheet" href={tailwindCss}></link>
        <link rel="stylesheet" href={waFloatStyles}></link>
        {isFilm ? null : (
          <>
            <link rel="stylesheet" href={resetStyles}></link>
            <link rel="stylesheet" href={appStyles}></link>
          </>
        )}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData<RootLoader>('root');
  const isFilm = useIsFilm();
  // The floating WhatsApp button stays off the cart page, as it does while the drawer is open.
  const isCart = /^(\/[a-z]{2}-[a-z]{2})?\/cart(\/|$)/i.test(
    useLocation().pathname,
  );

  if (!data) {
    return <Outlet />;
  }

  return (
    <Analytics.Provider
      cart={data.cart}
      shop={data.shop}
      consent={data.consent}
    >
      {isFilm ? (
        <Outlet />
      ) : (
        <PageLayout {...data}>
          <Outlet />
        </PageLayout>
      )}
      {data.whatsappFloat && !isCart && (
        <WhatsAppFloat href={data.whatsappFloat.href} />
      )}
      <WhatsAppTracker />
      <GoogleAnalytics id={data.gaMeasurementId} />
      <Clarity id={data.clarityProjectId} />
    </Analytics.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="route-error">
      <h1>Oops</h1>
      <h2>{errorStatus}</h2>
      {errorMessage && (
        <fieldset>
          <pre>{errorMessage}</pre>
        </fieldset>
      )}
    </div>
  );
}
