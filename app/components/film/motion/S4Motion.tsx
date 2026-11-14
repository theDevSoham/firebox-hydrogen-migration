import {useRef, type ReactNode} from 'react';
import {gsap, ScrollTrigger, SplitText} from '~/lib/film/gsap';
import {useSceneMotion} from '~/lib/film/motion';

// S4 · The cuts: each chapter title swells letter by letter under the nav while its cards
// pass beneath; on desktop the card images drift inside their frames.

export function S4Motion({children}: {children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneMotion(ref, ({d, scope}) => {
    const navH = () =>
      document.querySelector<HTMLElement>('[data-site-nav]')?.offsetHeight ??
      84;
    const resets: (() => void)[] = [];

    scope.querySelectorAll<HTMLElement>('.s4-chapter').forEach((chapter) => {
      const title = chapter.querySelector<HTMLElement>('.s4-swell');
      if (!title) return;
      // The full size comes from CSS (it allows for long titles); the swell starts at 6vw (phone 9vw).
      // Both are measured once per refresh, not once per letter: each read (font size, viewport
      // width) after a letter's size had been written forced a style recalc and layout.
      let fullSize = 0;
      let startSize = 0;
      const full = () =>
        (fullSize ||= parseFloat(getComputedStyle(title).fontSize));
      const start = () =>
        (startSize ||= Math.min(innerWidth * (d ? 0.06 : 0.09), full()));
      resets.push(() => (fullSize = startSize = 0));
      const {chars} = SplitText.create(title, {type: 'words,chars'});

      gsap.fromTo(
        chars,
        {fontSize: start},
        {
          fontSize: full,
          stagger: 0.03,
          ease: 'power4.inOut',
          scrollTrigger: {
            trigger: chapter,
            start: d ? () => `top ${navH()}px` : 'top 90%',
            end: d ? () => `+=${innerHeight * 0.45}` : 'top 25%',
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        },
      );

      if (d) {
        chapter
          .querySelectorAll<HTMLElement>('[data-parallax]')
          .forEach((img) => {
            gsap.fromTo(
              img,
              {yPercent: 6},
              {
                yPercent: -6,
                ease: 'none',
                scrollTrigger: {
                  trigger: img.parentElement,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 0.6,
                },
              },
            );
          });
      }
    });

    const reset = () => resets.forEach((r) => r());
    ScrollTrigger.addEventListener('refreshInit', reset);
    return () => ScrollTrigger.removeEventListener('refreshInit', reset);
  });

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
