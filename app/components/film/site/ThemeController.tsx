import {ScrollTrigger, useGSAP} from '~/lib/film/gsap';

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

export function ThemeController() {
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
