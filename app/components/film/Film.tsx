import {CartDrawer} from '~/components/film/cart/CartDrawer';
import {CartToast} from '~/components/film/cart/CartToast';
import {CartUiProvider} from '~/components/film/cart/CartUi';
import {ThemeController} from '~/components/film/site/ThemeController';
import {WhatsAppTracker} from '~/components/film/site/WhatsAppTracker';
import {S0Intro} from '~/components/film/motion/S0Intro';
import {SmoothScroll} from '~/components/film/motion/SmoothScroll';
import {S1Pit} from '~/components/film/scenes/S1Pit';
import {S2Manifesto} from '~/components/film/scenes/S2Manifesto';
import {S3NineHours} from '~/components/film/scenes/S3NineHours';
import {S4Cuts} from '~/components/film/scenes/S4Cuts';
import {S5Box} from '~/components/film/scenes/S5Box';
import {S6Drops} from '~/components/film/scenes/S6Drops';
import {S7Kolkata} from '~/components/film/scenes/S7Kolkata';
import {S8Behind} from '~/components/film/scenes/S8Behind';
import {S9Footer} from '~/components/film/scenes/S9Footer';
import {InPageLinks} from '~/components/film/site/InPageLinks';
import {SiteNav} from '~/components/film/site/SiteNav';
import {JOIN_LIST_MESSAGE, waLink} from '~/lib/film/format';
import type {Film as FilmData} from '~/lib/film/model';

// The film. Every scene renders its end frame, which is the complete page with no JavaScript
// (handoff/06); motion only adds start states.

export function Film({film}: {film: FilmData}) {
  const {settings} = film;
  const nextDropHref =
    settings.broadcastLink ||
    waLink(settings.whatsappNumber, JOIN_LIST_MESSAGE);

  return (
    <CartUiProvider>
      <a className="fb-skip" href="#content">
        Skip to content
      </a>
      {/* Without JavaScript the nav can't follow the chapters, so its button keeps a cream edge on every ground. */}
      <noscript>
        <style>
          {'.fb-nav .fb-cta { box-shadow: inset 0 0 0 2px var(--fb-cream); }'}
        </style>
      </noscript>
      <SmoothScroll />
      <InPageLinks />
      <SiteNav />
      <S0Intro />
      <ThemeController />
      <WhatsAppTracker />
      <main id="content" tabIndex={-1}>
        <S1Pit pit={film.pit} />
        <S2Manifesto manifesto={film.manifesto} />
        <S3NineHours nineHours={film.nineHours} />
        <S4Cuts
          chapters={film.menu}
          whatsappNumber={settings.whatsappNumber}
          nextDropHref={nextDropHref}
        />
        <S5Box box={film.box} />
        <S6Drops
          heading={film.dropsHeading}
          drops={film.drops}
          whatsappNumber={settings.whatsappNumber}
          nextDropHref={nextDropHref}
        />
        <S7Kolkata kolkata={film.kolkata} instagram={settings.instagram} />
        <S8Behind behind={film.behind} instagram={settings.instagram} />
      </main>
      <S9Footer footer={film.footer} settings={settings} />
      <CartToast />
      <CartDrawer />
    </CartUiProvider>
  );
}
