import {useEffect} from 'react';
import {ScrollTrigger, useGSAP} from '~/lib/film/gsap';
import {filmReady} from '~/lib/film/motion';

// Hard, reversible colour cut per chapter: when a [data-theme] block reaches the nav band,
// the nav takes its theme and the browser bar its colour (handoff/05-motion-spec.md).
// Runs with reduced motion too: the cut is a state change, not an animation.

const BAR: Record<string, string> = {
  night: '#160B06',
  ember: '#B11E24',
  red: '#DC3232',
  light: '#FEF2DA',
  kraft: '#E0B482',
  bark: '#924018',
  bw: '#2A2624',
};

/**
 * The nav's other logos (SiteNav fetches only the one the page opens on). Fetched once the film
 * is up and the browser is idle, so the first colour cut doesn't show an empty logo.
 */
const OTHER_LOGOS = ['/brand/logo-normal.svg', '/brand/logo-mono-cream.svg'];

export function ThemeController() {
  useEffect(() => {
    let cancelled = false;
    void filmReady().then(() => {
      const warm = () => {
        if (cancelled) return;
        for (const src of OTHER_LOGOS) new Image().src = src;
      };
      if (typeof requestIdleCallback === 'function')
        requestIdleCallback(warm, {timeout: 3000});
      else setTimeout(warm, 1500);
    });
    return () => void (cancelled = true);
  }, []);

  useGSAP(() => {
    const nav = document.querySelector<HTMLElement>('[data-site-nav]');
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!nav) return;

    const setTheme = (theme: string) => {
      if (nav.dataset.theme === theme) return;
      nav.dataset.theme = theme;
      meta?.setAttribute('content', BAR[theme] ?? BAR.night);
    };

    document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 60px',
        end: 'bottom 60px',
        refreshPriority: -1,
        onToggle: (self) =>
          self.isActive && setTheme(el.dataset.theme ?? 'night'),
      });
    });
  });

  return null;
}
