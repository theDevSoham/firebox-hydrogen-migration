import {useRef, type ReactNode} from 'react';
import {gsap, ScrollTrigger, SplitText} from '~/lib/film/gsap';
import {
  CLIP_CENTRE,
  CLIP_FULL,
  liteOn,
  primeTransforms,
  useSceneMotion,
} from '~/lib/film/motion';
import {coverPoint, Smoke} from '~/lib/film/smoke';

// S9 · Find the smoke: the bookend of S0. One ember, the headline rising, the chip, the details,
// the FIRE / BOX floor letters, then the word machine stepping every 2 s. Plays once when the
// end card comes in; the smoke curl bursts once on enter, never on page load.

export function S9Motion({children}: {children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneMotion(ref, ({scope}) => {
    const headline = SplitText.create('.s9-h', {
      type: 'words,chars',
      mask: 'words',
    });
    primeTransforms(
      headline.chars,
      '.s9-row, .s9-info > div, .s9-fine',
      '.s9-fl img',
      '.s9-machine',
      '.s9-ember',
      '[data-machine]',
    );

    const column = scope.querySelector<HTMLElement>('[data-machine]')!;
    const steps = column.children.length; // the first word repeats at the end, so the loop resets invisibly
    let index = 0;
    let next: gsap.core.Tween | null = null;
    const step = () => {
      index += 1;
      gsap.to(column, {
        yPercent: -(100 / steps) * index,
        duration: 0.5,
        ease: 'power4.inOut',
        onComplete: () => {
          if (index === steps - 1) {
            index = 0;
            gsap.set(column, {yPercent: 0});
          }
        },
      });
      next = gsap.delayedCall(2, step);
    };

    const canvas = scope.querySelector<HTMLCanvasElement>('.s9 .fb-smoke');
    const night = scope.querySelector<HTMLImageElement>('.s9-night');
    const smoke =
      canvas && night && !liteOn()
        ? new Smoke(canvas, {
            rate: 10,
            rise: 80,
            life: 5,
            size: [20, 56],
            alpha: 0.13,
            source: (w, h) => {
              const nw = night.naturalWidth || 1221;
              const nh = night.naturalHeight || 768;
              return coverPoint(nw, nh, nw * 0.6634, nh * 0.6354, w, h);
            },
          })
        : null;

    const endCard = gsap
      .timeline({paused: true})
      .fromTo(
        '.s9-ember',
        {autoAlpha: 0, scale: 0.6},
        {autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power2.out'},
      )
      .from(
        headline.chars,
        {yPercent: 100, stagger: 0.02, duration: 0.7, ease: 'power2.out'},
        0.3,
      )
      .to('.s9-ember', {autoAlpha: 0, duration: 0.3}, 0.55)
      .fromTo(
        '.s9-chip [data-chip]',
        {clipPath: CLIP_CENTRE},
        {clipPath: CLIP_FULL, duration: 1, ease: 'circ.out'},
        '-=.3',
      )
      .from(
        '.s9-row, .s9-info > div, .s9-fine',
        {y: 24, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power2.out'},
        '<.2',
      )
      .from(
        '.s9-fl img',
        {yPercent: 100, stagger: 0.1, duration: 0.8, ease: 'power2.out'},
        '<',
      )
      .from(
        '.s9-machine',
        {yPercent: 60, opacity: 0, duration: 0.6, ease: 'power2.out'},
        '<.15',
      )
      .add(() => {
        smoke?.burst(2.4);
        next ??= gsap.delayedCall(2, step);
      }, 0.4);

    ScrollTrigger.create({
      trigger: '.s9',
      start: 'top 60%',
      once: true,
      onEnter: () => void endCard.play(),
    });

    return () => {
      next?.kill();
      smoke?.destroy();
    };
  });

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
