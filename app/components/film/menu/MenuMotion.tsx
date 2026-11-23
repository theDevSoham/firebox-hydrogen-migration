import {useEffect} from 'react';
import {motionOn} from '~/lib/film/motion';

// /menu's JavaScript, all of it. No GSAP, no Lenis: the motion itself is CSS (film.css · /menu).
//
// 1. The active chapter. One IntersectionObserver follows how much of each chapter is on screen
//    below the sticky bars; the one showing most marks its chip (aria-current, the ember
//    underline), scrolls the chip into view in its row, and sets main[data-theme], which the
//    background colour follows.
// 2. Reveals. Cards and sub-collection headings (and, where scroll-driven animations aren't supported, chapter titles) get
//    .is-in as they come into view, a few at a time, numbered with --i for the stagger. Whatever
//    is already on screen (or above it) when this runs is marked first, so nothing that's
//    painted blinks out; only then does main[data-reveal] switch the hidden start states on.
//
// Without JavaScript neither runs and the page is complete as served.

const STEPS = Array.from({length: 41}, (_, i) => i / 40);

export function MenuMotion() {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>('main.mn');
    if (!main) return;
    const sections = [
      ...main.querySelectorAll<HTMLElement>('[data-mn-section]'),
    ];
    const row = main.querySelector<HTMLElement>('.mn-chips ul');
    const chips = new Map(
      [...main.querySelectorAll<HTMLAnchorElement>('[data-chip]')].map(
        (chip) => [chip.dataset.chip, chip],
      ),
    );
    const calm = () =>
      !motionOn() ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- 1. the active chapter ----------
    let current: HTMLElement | null = null;
    const setActive = (section: HTMLElement) => {
      if (section === current) return;
      current = section;
      main.dataset.theme = section.dataset.theme ?? 'night';
      for (const [id, chip] of chips) {
        if (id === section.id) chip.setAttribute('aria-current', 'true');
        else chip.removeAttribute('aria-current');
      }
      const chip = chips.get(section.id);
      if (row && chip && row.scrollWidth > row.clientWidth) {
        row.scrollTo({
          left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2,
          behavior: calm() ? 'auto' : 'smooth',
        });
      }
    };

    // Below the nav and the chips, which stick over the top of the page.
    const bars =
      (document.querySelector<HTMLElement>('[data-site-nav]')?.offsetHeight ??
        0) + (row?.closest<HTMLElement>('.mn-chips')?.offsetHeight ?? 0);
    const shown = new Map<Element, number>();
    const active = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          shown.set(
            entry.target,
            entry.isIntersecting ? entry.intersectionRect.height : 0,
          );
        let best: HTMLElement | null = null;
        let most = 0;
        for (const section of sections) {
          const height = shown.get(section) ?? 0;
          if (height > most) [best, most] = [section, height];
        }
        if (best) setActive(best);
      },
      {rootMargin: `-${Math.round(bars)}px 0px 0px 0px`, threshold: STEPS},
    );
    sections.forEach((section) => active.observe(section));

    // ---------- 2. reveals ----------
    const scrollDriven =
      typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');
    const targets = [
      ...main.querySelectorAll<HTMLElement>('[data-mn-card], [data-mn-rise]'),
      ...(scrollDriven ? [] : main.querySelectorAll<HTMLElement>('.mn-title')),
    ];
    const reveal = new IntersectionObserver(
      (entries) => {
        let i = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          // Cards in the same batch rise one after another, up to six steps.
          if (el.dataset.mnCard !== undefined)
            el.style.setProperty('--i', String(Math.min(i++, 5)));
          el.classList.add('is-in');
          reveal.unobserve(el);
        }
      },
      {rootMargin: '0px 0px -8% 0px'},
    );
    const fold = window.innerHeight;
    for (const el of targets) {
      if (el.getBoundingClientRect().top < fold) el.classList.add('is-in');
      else reveal.observe(el);
    }
    main.dataset.reveal = '';

    return () => {
      active.disconnect();
      reveal.disconnect();
      delete main.dataset.reveal;
    };
  }, []);

  return null;
}
