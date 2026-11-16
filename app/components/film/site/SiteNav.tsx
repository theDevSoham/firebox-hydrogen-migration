import {Logo} from '~/components/film/brand/Logo';
import {CartButton} from '~/components/film/cart/CartButton';

// Fixed bar: logo plus the cart button (handoff/04-components.md · SiteNav).
// The chapter theme lives in data-theme; ThemeController changes it while scrolling,
// and CSS picks the logo and CTA colourway for it.

export type NavTheme =
  'night' | 'ember' | 'red' | 'light' | 'kraft' | 'bark' | 'bw';

const TAG_W = 'clamp(90px, 7.5vw, 108px)';
const LOGO_W = 'clamp(112px, 9.2vw, 132px)';

export function SiteNav({
  theme = 'night',
  home = '#top',
}: {
  theme?: NavTheme;
  /** The logo's link: the top of the film, or the home page from /cart. */
  home?: string;
}) {
  return (
    <header className="fb-nav" data-theme={theme} data-site-nav>
      <a
        className="fb-nav__home"
        href={home}
        aria-label={
          home === '#top' ? 'The Firebox, back to the top' : 'The Firebox, home'
        }
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
      <CartButton />
    </header>
  );
}
