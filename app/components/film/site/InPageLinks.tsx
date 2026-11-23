import {useEffect} from 'react';
import {getLenis, motionOn} from '~/lib/film/motion';

// Same-page links on the film (#menu, #top, #content) and /menu's chips jump here, not through
// the browser.
//
// Why: a plain <a href="#menu"> pushes a history entry with no state. React Router keys saved
// scroll positions by location.key, and every state-less entry gets the key "default", the
// same key as the page you landed on. So it saves "default" = where you are (the hero),
// restores "default" for the new entry, and <ScrollRestoration> scrolls back to the hero right
// after the browser jumped to the menu. The film looks like it reloads. A second click works
// only because the hash no longer changes.
//
// Here: no history entry. Glide there with Lenis (so it stays in sync), put the hash in the address
// bar with replaceState (keeping React Router's state, so its keys stay intact), and move
// focus to the target for keyboard and screen-reader users. Without JavaScript the links are
// ordinary anchors.

export function InPageLinks() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      const hash = link?.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      event.preventDefault();

      // The skip link jumps, as keyboard users expect; the rest glide through the film.
      const instant = target.id === 'content';
      // A tick later, so a drawer closing on the same click has restarted Lenis first: its
      // restart resets Lenis and would cut a glide that had already begun.
      setTimeout(() => glideTo(target, instant), 0);

      window.history.replaceState(window.history.state, '', hash);

      // After the drawer (if any) has closed and handed focus back, so this wins.
      setTimeout(() => {
        if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
        target.focus({preventScroll: true});
      }, 60);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}

/** Ease in and out, so a long run through the pinned scenes starts and lands softly. */
const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;

function glideTo(target: HTMLElement, instant: boolean) {
  // scroll-margin-top keeps a target clear of sticky bars (/menu's chips); the film sets none.
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const y = Math.max(
    0,
    target.getBoundingClientRect().top + window.scrollY - margin,
  );
  const lenis = getLenis();
  if (!lenis) {
    // Without Lenis (/menu): the browser's own smooth scroll, unless motion is off or the
    // visitor asked for less.
    const smooth =
      !instant &&
      motionOn() &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top: y, behavior: smooth ? 'smooth' : 'auto'});
    return;
  }
  // ~0.6 s for a short hop, up to 1.6 s for hero → menu and longer runs.
  const duration = Math.min(
    1.6,
    Math.max(0.6, Math.abs(y - window.scrollY) / 2400),
  );
  lenis.scrollTo(y, {
    immediate: instant,
    duration,
    easing: easeInOutQuart,
    // Only needed if something (the intro) still holds Lenis.
    force: lenis.isStopped,
  });
}
