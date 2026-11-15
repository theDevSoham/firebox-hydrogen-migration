import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';
import {GA_CSP, gaMeasurementId} from '~/lib/analytics';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  // Hydrogen's policy (PORTING-DECISIONS.md · D.3.4), plus Shopify's performance-metrics endpoint
  // (Hydrogen's analytics report to it; the default policy doesn't list it) and Google Analytics'
  // hosts only when a measurement ID is set. Fonts, scripts and the smoke worker are same-origin.
  const ga = gaMeasurementId(context.env) ? GA_CSP : null;
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    connectSrc: [
      "'self'",
      'https://otlp-http-production.shopifysvc.com',
      ...(ga?.connectSrc ?? []),
    ],
    ...(ga && {
      scriptSrc: ["'self'", 'https://cdn.shopify.com', ...ga.scriptSrc],
      imgSrc: ["'self'", 'https://cdn.shopify.com', 'data:', ...ga.imgSrc],
    }),
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
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
