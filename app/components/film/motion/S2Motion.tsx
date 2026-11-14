import {useRef, type ReactNode} from 'react';
import {gsap, SplitText} from '~/lib/film/gsap';
import {CLIP_FULL, CLIP_LEFT, token, useSceneMotion} from '~/lib/film/motion';

// S2 · Ash to ember: the manifesto's words heat from ash to amber to cream as you scroll,
// and cool again going back. The chip wipes on from the left once.

export function S2Motion({children}: {children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneMotion(ref, ({d}) => {
    // Words only, as inline spans, so the paragraph reads the same without SplitText's aria-label
    // (which isn't allowed on a <p>).
    const {words} = SplitText.create('.s2-text', {
      type: 'words',
      tag: 'span',
      aria: 'none',
    });
    gsap.set(words, {color: token('--fb-ash')});
    gsap
      .timeline({
        scrollTrigger: {
          trigger: '.s2',
          start: d ? 'top 75%' : 'top 85%',
          end: 'bottom 60%',
          scrub: 0.8,
        },
      })
      .to(
        words,
        {color: token('--fb-amber'), duration: 1, stagger: 1, ease: 'none'},
        0,
      )
      .to(
        words,
        {color: token('--fb-cream'), duration: 1, stagger: 1, ease: 'none'},
        1.5,
      );

    gsap.fromTo(
      '.s2-chip [data-chip]',
      {clipPath: CLIP_LEFT},
      {
        clipPath: CLIP_FULL,
        duration: 1,
        ease: 'circ.out',
        scrollTrigger: {
          trigger: '.s2',
          start: 'top 40%',
          toggleActions: 'play none none none',
        },
      },
    );
  });

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
