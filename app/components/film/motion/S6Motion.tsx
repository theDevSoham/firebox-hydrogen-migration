import {useRef, type ReactNode} from 'react';
import {gsap, SplitText} from '~/lib/film/gsap';
import {getLenis, primeTransforms, useSceneMotion} from '~/lib/film/motion';

// S6 · Only 20: the title rises out of word masks; on desktop the poster row drifts sideways
// with the scroll, on phones it's a native swipe row. Each SOLD OUT stamp lands once.

export function S6Motion({children}: {children: ReactNode}) {
  const ref = useRef<HTMLDivElement>(null);

  useSceneMotion(ref, ({d, scope}) => {
    const title = SplitText.create('.s6-title', {
      type: 'words,chars',
      mask: 'words',
    });
    primeTransforms(title.chars, '.fb-poster > .fb-stamp', '.s6-row');
    gsap.from(title.chars, {
      yPercent: 100,
      stagger: 0.02,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {trigger: '.s6', start: 'top 60%'},
    });

    // Stamps are centred with xPercent/yPercent here; under motion CSS leaves their transform alone.
    const stamps = Array.from(
      scope.querySelectorAll<HTMLElement>('.fb-poster > .fb-stamp'),
    ).map((stamp) => {
      gsap.set(stamp, {xPercent: -50, yPercent: -50, rotate: -14});
      const land = gsap.fromTo(
        stamp,
        {autoAlpha: 0, scale: 1.6, rotate: -24},
        {
          autoAlpha: 1,
          scale: 1,
          rotate: -14,
          duration: 0.35,
          ease: 'power2.out',
          paused: true,
        },
      );
      return {card: stamp.parentElement!, land, done: false};
    });
    const stampIt = (o: (typeof stamps)[number]) => {
      if (o.done) return;
      o.done = true;
      o.land.play();
    };

    if (d) {
      const row = scope.querySelector<HTMLElement>('.s6-row')!;
      // A stamp lands when its card's centre passes 75% of the width while the card is in the middle band.
      const check = () =>
        stamps.forEach((o) => {
          const r = o.card.getBoundingClientRect();
          if (
            r.top < innerHeight * 0.7 &&
            r.bottom > innerHeight * 0.25 &&
            r.left + r.width / 2 < innerWidth * 0.75
          )
            stampIt(o);
        });
      const startX = () => innerWidth * 0.12;
      const endX = () => -(row.scrollWidth - innerWidth * 0.9);
      const drift = gsap.fromTo(
        row,
        {x: startX},
        {
          x: endX,
          ease: 'none',
          scrollTrigger: {
            trigger: row,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: check,
          },
        },
      );

      // Keyboard: the drift is tied to the scroll, so it can carry a focused poster off screen.
      // While focus is inside the row, bring the row into view and hold it with the focused poster
      // centred; the drift picks up again from the scroll position when focus leaves.
      // The hold is applied to the row's wrapper, so the drift tween on the row itself is untouched.
      const st = drift.scrollTrigger!;
      const holder = scope.querySelector<HTMLElement>('.s6-scroller')!;
      let holding = false;
      const onFocusIn = (event: FocusEvent) => {
        const card = (event.target as Element).closest<HTMLElement>(
          '.fb-poster',
        );
        if (!card) return;
        if (!holding) {
          holding = true;
          st.disable(false);
        }
        const navH =
          document.querySelector<HTMLElement>('[data-site-nav]')
            ?.offsetHeight ?? 84;
        const y = Math.max(
          0,
          row.getBoundingClientRect().top + window.scrollY - navH - 16,
        );
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(y, {immediate: true});
        else window.scrollTo(0, y);
        const wantX = gsap.utils.clamp(
          endX(),
          startX(),
          innerWidth / 2 - (card.offsetLeft + card.offsetWidth / 2),
        );
        gsap.to(holder, {
          x: wantX - Number(gsap.getProperty(row, 'x')),
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true,
        });
      };
      const onFocusOut = (event: FocusEvent) => {
        if (row.contains(event.relatedTarget as Node | null)) return;
        gsap.to(holder, {
          x: 0,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true,
        });
        holding = false;
        st.enable();
      };
      row.addEventListener('focusin', onFocusIn);
      row.addEventListener('focusout', onFocusOut);
      return () => {
        row.removeEventListener('focusin', onFocusIn);
        row.removeEventListener('focusout', onFocusOut);
      };
    }

    // Phones: a stamp lands when its card is at least 60% visible inside the swipe row.
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) =>
            e.isIntersecting &&
            stamps.forEach((o) => o.card === e.target && stampIt(o)),
        ),
      {root: scope.querySelector('.s6-scroller'), threshold: 0.6},
    );
    stamps.forEach((o) => io.observe(o.card));
    return () => io.disconnect();
  });

  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
