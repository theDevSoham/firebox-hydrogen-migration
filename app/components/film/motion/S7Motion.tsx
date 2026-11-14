import {useRef, type ReactNode} from 'react';
import {gsap} from '~/lib/film/gsap';
import {primeTransforms, useSceneMotion} from '~/lib/film/motion';

// S7 · Ki bolchhe Kolkata? Three planes: the words shear sideways, the reels and quotes rise
// into a scrapbook pile (pinned on desktop), the paper stays still. Tilts are fixed per card;
// motion is only vertical. A reel straightens and lifts on hover or focus.

const SHEAR = {
  d: [
    ['s7-w1', 70],
    ['s7-w2', 25],
    ['s7-w3', -50],
  ],
  m: [
    ['s7-w1', 30],
    ['s7-w2', -18],
    ['s7-w3', -30],
  ],
} as const;

export function S7Motion({children}: {children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneMotion(ref, ({d, scope}) => {
    const pile = Array.from(
      scope.querySelectorAll<HTMLElement>('.s7-pile > *'),
    );
    primeTransforms(pile, '.s7-w');

    if (!d) {
      SHEAR.m.forEach(([word, x]) =>
        gsap.fromTo(
          `.${word}`,
          {xPercent: 0},
          {
            xPercent: x,
            ease: 'none',
            scrollTrigger: {
              trigger: `.${word}`,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        ),
      );
      pile.forEach((card) =>
        gsap.from(card, {
          y: 120,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {trigger: card, start: 'top 95%'},
        }),
      );
      return;
    }

    gsap.set(pile, {
      rotate: (_i: number, el: HTMLElement) => Number(el.dataset.r),
    });
    gsap
      .timeline({
        scrollTrigger: {
          trigger: '.s7',
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      })
      .from(pile, {yPercent: 150, stagger: 0.2, ease: 'power2.out'});
    SHEAR.d.forEach(([word, x]) =>
      gsap.fromTo(
        `.${word}`,
        {xPercent: 0},
        {
          xPercent: x,
          ease: 'none',
          scrollTrigger: {
            trigger: '.s7',
            start: 'top bottom',
            end: '+=230%',
            scrub: true,
          },
        },
      ),
    );

    const reels = Array.from(scope.querySelectorAll<HTMLElement>('.fb-reel'));
    const lift = (e: Event) =>
      gsap.to(e.currentTarget as HTMLElement, {
        rotate: 0,
        scale: 1.04,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    const settle = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      if (el === document.activeElement && e.type === 'mouseleave') return;
      gsap.to(el, {
        rotate: Number(el.dataset.r),
        scale: 1,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };
    reels.forEach((reel) => {
      reel.addEventListener('mouseenter', lift);
      reel.addEventListener('focus', lift);
      reel.addEventListener('mouseleave', settle);
      reel.addEventListener('blur', settle);
    });
    return () =>
      reels.forEach((reel) => {
        reel.removeEventListener('mouseenter', lift);
        reel.removeEventListener('focus', lift);
        reel.removeEventListener('mouseleave', settle);
        reel.removeEventListener('blur', settle);
      });
  });

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
