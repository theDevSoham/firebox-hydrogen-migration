import {Logo} from '~/components/film/brand/Logo';
import {Cta} from '~/components/film/ui/Cta';
import {waLink} from '~/lib/film/format';

// Fixed bar: logo plus one CTA (handoff/04-components.md · SiteNav).
// The chapter theme lives in data-theme; ThemeController changes it while scrolling,
// and CSS picks the logo and CTA colourway for it.

export type NavTheme =
  'night' | 'ember' | 'red' | 'light' | 'kraft' | 'bark' | 'bw';

const TAG_W = 'clamp(90px, 7.5vw, 108px)';
const LOGO_W = 'clamp(112px, 9.2vw, 132px)';

export function SiteNav({
  whatsappNumber,
  theme = 'night',
}: {
  whatsappNumber: string;
  theme?: NavTheme;
}) {
  return (
    <header className="fb-nav" data-theme={theme} data-site-nav>
      <a
        className="fb-nav__home"
        href="#top"
        aria-label="The Firebox, back to the top"
      >
        <span data-logo="tag">
          <Logo variant="tag" width={TAG_W} alt="" />
        </span>
        <span data-logo="normal">
          <Logo variant="normal" width={LOGO_W} alt="" fetchPriority="low" />
        </span>
        <span data-logo="reversed">
          <Logo variant="reversed" width={LOGO_W} alt="" />
        </span>
        <span data-logo="mono-cream">
          <Logo
            variant="mono-cream"
            width={LOGO_W}
            alt=""
            fetchPriority="low"
          />
        </span>
      </a>
      <Cta href={waLink(whatsappNumber)} item="Nav · Pre-order">
        <span className="hidden md:inline">Pre-order on WhatsApp</span>
        <span className="md:hidden">Pre-order</span>
      </Cta>
    </header>
  );
}
