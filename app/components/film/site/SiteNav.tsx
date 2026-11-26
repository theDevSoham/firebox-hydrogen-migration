import {Logo} from '~/components/film/brand/Logo';
import {CartButton} from '~/components/film/cart/CartButton';

// Fixed bar: logo, the Menu link and the cart button (handoff/04-components.md · SiteNav).
// Menu is a plain link to /menu, a page load like the cart's: the film's in-page links
// (#menu, InPageLinks) are a separate thing and unaffected.
// The chapter theme lives in data-theme; ThemeController changes it while scrolling,
// and CSS picks the logo and CTA colourway for it.

export type NavTheme =
  'night' | 'ember' | 'red' | 'light' | 'kraft' | 'bark' | 'bw';

const TAG_W = 'clamp(90px, 7.5vw, 108px)';
const LOGO_W = 'clamp(112px, 9.2vw, 132px)';

/** The nav's logos, one per ground (film.css shows the one for data-theme). */
const NAV_LOGOS = ['tag', 'normal', 'reversed', 'mono-cream'] as const;
const FIRST_LOGO: Record<NavTheme, (typeof NAV_LOGOS)[number]> = {
  night: 'tag',
  bark: 'tag',
  light: 'normal',
  kraft: 'normal',
  ember: 'reversed',
  red: 'reversed',
  bw: 'mono-cream',
};

export function SiteNav({
  theme = 'night',
  home = '#top',
  current,
}: {
  theme?: NavTheme;
  /** The logo's link: the top of the film, or the home page from /cart. */
  home?: string;
  /** The page this nav sits on, when the nav links to it. */
  current?: 'menu';
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
        {NAV_LOGOS.map((variant) => (
          <span key={variant} data-logo={variant}>
            <Logo
              variant={variant}
              width={variant === 'tag' ? TAG_W : LOGO_W}
              alt=""
              // Only the one this page opens on is fetched now; the others stay hidden until
              // their chapter (ThemeController warms them once the page is up).
              lazy={variant !== FIRST_LOGO[theme]}
            />
          </span>
        ))}
      </a>
      <div className="fb-nav__end">
        <a
          className="fb-nav__link"
          href="/menu"
          aria-current={current === 'menu' ? 'page' : undefined}
        >
          <span>Menu</span>
        </a>
        <CartButton />
      </div>
    </header>
  );
}
