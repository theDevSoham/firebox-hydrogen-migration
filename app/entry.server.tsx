import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';
import {analyticsCsp} from '~/lib/analytics';

/** Same-origin scripts and Shopify's CDN: what script-src / img-src start from when we set them. */
const SCRIPT_SRC = ["'self'", 'https://cdn.shopify.com'];
const IMG_SRC = ["'self'", 'https://cdn.shopify.com', 'data:'];

/** A domain as Hydrogen's policy wants it: no protocol, no path (it adds https:// itself). */
const bareDomain = (value: string | undefined) =>
  value?.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  // Hydrogen's policy (PORTING-DECISIONS.md · D.3.4), plus Shopify's performance-metrics endpoint
  // (Hydrogen's analytics report to it; the default policy doesn't list it) and the hosts of
  // whichever of Google Analytics and Microsoft Clarity have an ID set (app/lib/analytics.ts).
  // Hydrogen merges connect-src with its defaults itself; script-src and img-src have no
  // defaults of their own (they fall back to default-src), so they're only set, from the lists
  // above, when an integration needs them. Neither set: the policy is Hydrogen's, unchanged.
  // Fonts, scripts and the smoke worker are same-origin.
  const extra = analyticsCsp(context.env);
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    connectSrc: [
      "'self'",
      'https://otlp-http-production.shopifysvc.com',
      ...extra.connectSrc,
    ],
    ...(extra.scriptSrc.length > 0 && {
      scriptSrc: [...SCRIPT_SRC, ...extra.scriptSrc],
    }),
    ...(extra.imgSrc.length > 0 && {imgSrc: [...IMG_SRC, ...extra.imgSrc]}),
    shop: {
      checkoutDomain: bareDomain(context.env.PUBLIC_CHECKOUT_DOMAIN),
      storeDomain: bareDomain(context.env.PUBLIC_STORE_DOMAIN),
    },
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
