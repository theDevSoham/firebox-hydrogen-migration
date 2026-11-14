import {useEffect, useRef} from 'react';
import {Logo} from '~/components/film/brand/Logo';
import {Chip} from '~/components/film/ui/Chip';
import {gsap} from '~/lib/film/gsap';
import {CLIP_CENTRE, CLIP_FULL, getLenis, motionReady} from '~/lib/film/motion';

// S0 · Light the pit: the ~3 s title sequence, once per session. An ember, the tag wiping open,
// THE · FIRE · BOX rising, a flame flaring through, the chip, then the shutter lifts and the nav
// drops in. Any wheel, touch or key finishes it at once; it never blocks the page.
//
// It shows only when the inline script in app/root.tsx (MOTION_FLAGS) set html[data-intro] before first paint.
// If this never runs, a CSS failsafe hides the overlay and shows the nav after 8 s.
//
// The intro runs once per page load, outside React's effect lifecycle: React may hide and
// re-show the tree (Strict Mode in development, Activity under cacheComponents), and an effect
// cleanup must not revert a title sequence that is already playing.

const SKIP_EVENTS = ['wheel', 'touchstart', 'keydown'] as const;

let intro: {skip: () => void} | null = null;

function runIntro(overlay: HTMLElement) {
  const html = document.documentElement;
  const nav = document.querySelector<HTMLElement>('[data-site-nav]');
  if (intro || !nav || !html.hasAttribute('data-intro')) return;

  // JavaScript has taken over: cancel the failsafe.
  overlay.style.animation = 'none';
  nav.style.animation = 'none';
  try {
    sessionStorage.setItem('fb-intro', '1');
  } catch {}

  let timeline: gsap.core.Timeline | null = null;
  const skip = () =>
    timeline && timeline.progress() < 1 && timeline.progress(1);
  intro = {skip};

  const finish = () => {
    SKIP_EVENTS.forEach((type) => window.removeEventListener(type, skip));
    html.removeAttribute('data-intro');
    gsap.set(nav, {clearProps: 'opacity,visibility,transform'});
    getLenis()?.start();
  };

  motionReady().then(() => {
    const q = gsap.utils.selector(overlay);

    const lenis = getLenis();
    lenis?.scrollTo(0, {immediate: true});
    lenis?.stop();
    window.scrollTo(0, 0);
    SKIP_EVENTS.forEach((type) =>
      window.addEventListener(type, skip, {passive: true}),
    );

    gsap.set(nav, {autoAlpha: 0, y: -20});
    timeline = gsap
      .timeline({delay: 0.2, onComplete: finish})
      .fromTo(
        q('.s0-ember'),
        {autoAlpha: 0, scale: 0.6},
        {autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power2.out'},
      )
      .fromTo(
        q('.s0-tag'),
        {clipPath: CLIP_CENTRE},
        {clipPath: CLIP_FULL, duration: 0.7, ease: 'circ.out'},
        0.2,
      )
      .to(q('.s0-ember'), {autoAlpha: 0, duration: 0.3}, 0.45)
      .fromTo(
        q('.s0-tag [data-group]'),
        {yPercent: 110},
        {yPercent: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out'},
        0.5,
      )
      .fromTo(
        q('.s0-flame'),
        {autoAlpha: 0, scaleY: 0.55, transformOrigin: '50% 90%'},
        {autoAlpha: 0.95, scaleY: 1.06, duration: 0.5, ease: 'power2.out'},
        0.7,
      )
      .to(
        q('.s0-flame'),
        {
          scaleY: 0.92,
          scaleX: 1.03,
          duration: 0.18,
          yoyo: true,
          repeat: 4,
          ease: 'power4.inOut',
        },
        1.2,
      )
      .to(
        q('.s0-flame'),
        {autoAlpha: 0, scaleY: 1.2, duration: 0.7, ease: 'power2.out'},
        1.95,
      )
      .fromTo(
        q('.s0-chip [data-chip]'),
        {clipPath: CLIP_CENTRE},
        {clipPath: CLIP_FULL, duration: 0.8, ease: 'circ.out'},
        1.3,
      )
      .to(overlay, {yPercent: -100, duration: 0.9, ease: 'power4.inOut'}, 2.4)
      .to(nav, {autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out'}, 2.9);
    gsap.set(q('.s0-tilt, .s0-chipwrap'), {visibility: 'visible'});
  });
}

export function S0Intro() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) runIntro(ref.current);
  }, []);

  return (
    <div ref={ref} className="s0" aria-hidden="true" data-scene="S0">
      <div className="s0-flame">
        {/* Fixed art in public/ (PORTING-DECISIONS.md · D.2.4). Lazy: the overlay is display: none
            unless the intro plays, so other visits never fetch it. */}
        <img
          src="/brand/s0-flame.jpg"
          alt=""
          width={1221}
          height={768}
          loading="lazy"
          decoding="async"
          className="fb-fill"
        />
      </div>
      <div className="fb-ember s0-ember" />
      <div className="s0-tilt">
        <div className="s0-tag">
          <Logo variant="groups" width="87.5%" alt="" />
        </div>
      </div>
      <div className="s0-chipwrap">
        <Chip className="s0-chip" size="m" tilt={3}>
          Low &amp; slow · wood smoked
        </Chip>
      </div>
      {/* Pointer only: on a keyboard, any key skips. The overlay is hidden from screen readers. */}
      <button
        type="button"
        className="s0-skip"
        tabIndex={-1}
        onClick={() => intro?.skip()}
      >
        Skip intro
      </button>
    </div>
  );
}
