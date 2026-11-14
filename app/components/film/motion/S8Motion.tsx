import {useRef, type ReactNode} from 'react';
import {gsap, SplitText} from '~/lib/film/gsap';
import {primeTransforms, useSceneMotion} from '~/lib/film/motion';

// S8 · Behind the Pit: the colour drains out of the art as it rises; the title lines lift out
// of their masks and the lower third follows. The lower third fades with opacity, not
// visibility, so screen readers can reach it before it plays.

export function S8Motion({children}: {children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneMotion(ref, ({d}) => {
    gsap.fromTo(
      '.s8-art img',
      {filter: 'grayscale(0) contrast(1)'},
      {
        filter: 'grayscale(1) contrast(1.15)',
        ease: 'none',
        scrollTrigger: {
          trigger: '.s8',
          start: 'top 80%',
          end: d ? 'top 20%' : 'top 0%',
          scrub: 0.8,
        },
      },
    );

    const title = SplitText.create('.s8-title', {type: 'lines', mask: 'lines'});
    primeTransforms(title.lines, '.s8-lower > *');
    gsap.from(title.lines, {
      yPercent: 100,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {trigger: '.s8', start: 'top 45%'},
    });
    gsap.from('.s8-lower > *', {
      y: 24,
      opacity: 0,
      stagger: 0.08,
      duration: 0.6,
      delay: 0.3,
      ease: 'power2.out',
      scrollTrigger: {trigger: '.s8', start: 'top 45%'},
    });
  });

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
