import {useRef, type ReactNode} from 'react';
import {gsap, ScrollTrigger} from '~/lib/film/gsap';
import {useSceneMotion} from '~/lib/film/motion';
import {coverPoint, Smoke} from '~/lib/film/smoke';

// S1 · The pit: the postcard tilts, shrinks and sinks while S2 slides over it; smoke rises
// from the smoker while the scene is on screen.

// Where the smoker's chimney sits in each placeholder painting, as a fraction of the image.
const CHIMNEY = {
  landscape: [0.6634, 0.6354],
  portrait: [0.8157, 0.798],
} as const;

export function S1Motion({children}: {children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneMotion(ref, ({d, scope}) => {
    gsap.to('.s1-card', {
      rotate: d ? 6 : 4,
      scale: d ? 0.9 : 0.92,
      yPercent: d ? 30 : 20,
      ease: 'none',
      scrollTrigger: {
        trigger: '.s1',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.8,
      },
    });

    const canvas = scope.querySelector<HTMLCanvasElement>('.s1 .fb-smoke');
    const img = scope.querySelector<HTMLImageElement>('.s1-card img');
    if (!canvas || !img) return;
    const smoke = new Smoke(canvas, {
      rate: 7,
      rise: 62,
      alpha: 0.16,
      source: (w, h) => {
        const nw = img.naturalWidth || 1221;
        const nh = img.naturalHeight || 768;
        const [fx, fy] = nw < nh ? CHIMNEY.portrait : CHIMNEY.landscape;
        return coverPoint(nw, nh, nw * fx, nh * fy, w, h);
      },
    });
    ScrollTrigger.create({
      trigger: '.s1',
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? smoke.start() : smoke.stop()),
    });
    return () => smoke.destroy();
  });

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
