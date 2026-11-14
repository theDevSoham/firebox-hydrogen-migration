import {useRef, type ReactNode} from 'react';
import {gsap} from '~/lib/film/gsap';
import {CLIP_CENTRE, CLIP_FULL, useSceneMotion} from '~/lib/film/motion';

// S3 · Nine hours: the held shot. The barked frame rises over the raw one behind an ember
// line while the clock counts to 9:00 in 15-minute steps. Pinned on desktop; on phones the
// swap scrubs while the art crosses the screen.

export function S3Motion({children}: {children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneMotion(ref, ({d, scope}) => {
    const art = scope.querySelector<HTMLElement>('.s3-art')!;
    const clock = scope.querySelector<HTMLElement>('.s3-time')!;
    const ticks = Array.from(
      scope.querySelectorAll<HTMLElement>('.s3-ticks li'),
    );
    const chip = gsap.fromTo(
      '.s3-chip [data-chip]',
      {clipPath: CLIP_CENTRE},
      {clipPath: CLIP_FULL, duration: 0.8, ease: 'circ.out', paused: true},
    );

    // Runs on every scroll update, but only touches the DOM when the time moves on a step:
    // rewriting the same text each frame cost a layout per frame on slow phones.
    let shown = -1;
    const setClock = (p: number) => {
      const mins = Math.round(p * 36) * 15;
      if (mins !== shown) {
        shown = mins;
        const h = Math.floor(mins / 60);
        clock.textContent = `${h}:${String(mins % 60).padStart(2, '0')}`;
        clock.classList.toggle('is-running', mins < 540);
        ticks.forEach((li) =>
          li.classList.toggle('is-on', Number(li.dataset.h) <= h),
        );
      }
      if (p > 0.95) chip.play();
      else if (p < 0.9) chip.reverse();
    };
    setClock(0);

    gsap
      .timeline({
        scrollTrigger: d
          ? {
              trigger: '.s3',
              start: 'top top',
              end: '+=150%',
              pin: true,
              scrub: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (s) => setClock(s.progress),
            }
          : {
              trigger: '.s3-art',
              start: 'top 80%',
              end: 'bottom 40%',
              scrub: 0.6,
              invalidateOnRefresh: true,
              onUpdate: (s) => setClock(s.progress),
            },
      })
      .fromTo(
        '.s3-done',
        {clipPath: 'inset(100% 0% 0% 0%)'},
        {clipPath: 'inset(0% 0% 0% 0%)', ease: 'none'},
        0,
      )
      // The line rides the edge of the reveal, bottom to top of the art. Moved by transform, not
      // `top`, so it doesn't lay out the page every frame.
      .fromTo('.s3-line', {y: () => art.offsetHeight}, {y: 0, ease: 'none'}, 0);

    return () => {
      clock.textContent = '9:00';
      clock.classList.remove('is-running');
      ticks.forEach((li) => li.classList.remove('is-on'));
    };
  });

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
