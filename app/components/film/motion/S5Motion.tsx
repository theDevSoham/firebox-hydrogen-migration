import {useRef, type ReactNode} from 'react';
import {gsap} from '~/lib/film/gsap';
import {useSceneMotion} from '~/lib/film/motion';
import {Smoke} from '~/lib/film/smoke';

// S5 · Open the box: pinned without spacing, so S6 slides over it (the spacer after the
// section sets when). The glowing seam is the iris: the lid lifts, the base drops and the
// footage opens between them like a cinema screen. Phones keep this one pin.

export function S5Motion({children}: {children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneMotion(ref, ({d, scope}) => {
    const canvas = scope.querySelector<HTMLCanvasElement>('.s5 .fb-smoke');
    const steam = canvas
      ? new Smoke(canvas, {
          rate: 9,
          rise: 70,
          life: 4,
          size: [18, 54],
          alpha: 0.14,
          source: (w, h) => ({
            x: w * (0.42 + Math.random() * 0.16),
            y: h * 0.62,
            s: 1,
          }),
        })
      : null;
    let steaming = false;
    const setSteam = (on: boolean) => {
      if (on === steaming) return;
      steaming = on;
      if (on) steam?.start();
      else steam?.stop();
    };

    gsap
      .timeline({
        scrollTrigger: {
          trigger: '.s5',
          start: 'top top',
          end: d ? '+=220%' : '+=180%',
          pin: true,
          pinSpacing: false,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (s) => setSteam(s.progress > 0.2 && s.progress < 0.98),
          onLeave: () => setSteam(false),
          onLeaveBack: () => setSteam(false),
        },
      })
      .to('.s5-seam', {autoAlpha: 0, duration: 0.15, ease: 'none'}, 0)
      .fromTo(
        '.s5-reveal',
        {clipPath: 'inset(65.5% 0% 34.5% 0%)'},
        {clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: 'none'},
        0,
      )
      .to('.s5-lid', {yPercent: -75, duration: 0.45, ease: 'none'}, 0)
      .to(
        '.s5-copy',
        {y: () => -innerHeight * 0.75, duration: 0.45, ease: 'none'},
        0,
      )
      .to('.s5-base', {yPercent: 45, duration: 0.45, ease: 'none'}, 0)
      .fromTo(
        '.s5-open',
        {scale: 1.15},
        {scale: 1, duration: 1, ease: 'none'},
        0,
      );

    return () => steam?.destroy();
  });

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
