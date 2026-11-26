import {useEffect, useRef} from 'react';
import {Logo} from '~/components/film/brand/Logo';
import {Chip} from '~/components/film/ui/Chip';
import {gsap} from '~/lib/film/gsap';
import {
  CLIP_CENTRE,
  CLIP_FULL,
  filmReady,
  getLenis,
  isFilmReady,
  liteOn,
} from '~/lib/film/motion';

// S0 · Light the pit: the ~3 s title sequence, once per session. An ember, the tag wiping open,
// THE · FIRE · BOX rising, a flame flaring through, the chip, then the shutter lifts and the nav
// drops in.
//
// It is also the film's curtain. The page behind it is still loading its fonts and art and
// setting its scenes up, and all of that moves things; the shutter only lifts once that is done
// (filmReady in lib/film/motion.ts), so the first thing a visitor sees of the film is the film,
// already still. On a fast connection that is before the titles end and nothing changes. On a
// slow one the titles hold on their last frame and the button reads "Loading…" until it is.
//
// Skip (the button, or any wheel, touch or key) leaves the way the titles end: they stop where
// they are, the shutter lifts and the nav drops in. That is when the film is ready. Before that
// the skip is remembered: the button reads "Loading…" and the shutter lifts the moment the film
// is ready. It never waits longer than filmReady's cap.
//
// It shows only when the inline script in app/root.tsx (MOTION_FLAGS) set html[data-intro] before
// first paint. Until this script runs, the ember glows on its own (CSS) and the button reads
// "Loading…". If this never runs, a CSS failsafe hides the overlay and shows the nav after 12 s;
// if it only arrives after that, the titles are skipped, never played over a page already in use.
//
// The intro runs once per page load, outside React's effect lifecycle: React may hide and
// re-show the tree (Strict Mode in development, Activity under cacheComponents), and an effect
// cleanup must not revert a title sequence that is already playing.

const SKIP_EVENTS = ['wheel', 'touchstart', 'keydown'] as const;

/** film.css · S0: the failsafe's delay, less a margin. Past this the page is already showing. */
const FAILSAFE_MS = 11500;
/** How long the titles wait for the logo's three layers before starting without them. */
const LOGO_CAP_MS = 1500;

let intro: {skip: () => void} | null = null;

/** The tag's three layers, loaded, so the titles don't rise as empty boxes. */
function logoLoaded(overlay: HTMLElement): Promise<void> {
  const layers = [...overlay.querySelectorAll<HTMLImageElement>('.s0-tag img')];
  // They are lazy so that visits without the intro never fetch them. It is playing: fetch them
  // now, and the flame with them, whatever the browser's lazy-loading makes of a covered page.
  for (const img of overlay.querySelectorAll('img')) img.loading = 'eager';
  return Promise.race([
    Promise.all(
      layers.map((img) =>
        img.complete
          ? undefined
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), {once: true});
              img.addEventListener('error', () => resolve(), {once: true});
            }),
      ),
    ).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, LOGO_CAP_MS)),
  ]);
}

function runIntro(overlay: HTMLElement) {
  const html = document.documentElement;
  const nav = document.querySelector<HTMLElement>('[data-site-nav]');
  if (intro || !nav || !html.hasAttribute('data-intro')) return;

  try {
    sessionStorage.setItem('fb-intro', '1');
  } catch {
    // Storage blocked (private mode): the intro just plays again next visit.
  }

  // Too late: the failsafe has shown the page (or is about to). Leave it be.
  if (performance.now() > FAILSAFE_MS) {
    html.removeAttribute('data-intro');
    return;
  }

  // JavaScript has taken over: cancel the failsafe, and the ember's waiting glow.
  overlay.style.animation = 'none';
  nav.style.animation = 'none';
  overlay.setAttribute('data-live', '');

  const button = overlay.querySelector<HTMLButtonElement>('.s0-skip');
  const busy = (on: boolean) => button?.toggleAttribute('data-busy', on);
  busy(false);

  const q = gsap.utils.selector(overlay);
  let titles: gsap.core.Timeline | null = null;
  let lift: gsap.core.Timeline | null = null;
  let titlesDone = false;
  let wantsSkip = false;
  let leaving = false;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    SKIP_EVENTS.forEach((type) => window.removeEventListener(type, skip));
    html.removeAttribute('data-intro');
    gsap.set(nav, {clearProps: 'opacity,visibility,transform'});
    getLenis()?.start();
  };

  /**
   * The one way out, at the titles' end or on a skip: the titles stop where they are, the shutter
   * lifts and the nav drops in. Only called once the film is ready.
   */
  const leave = () => {
    if (leaving || finished) return;
    leaving = true;
    busy(false);
    titles?.pause();
    lift?.play();
  };

  function skip() {
    if (leaving || finished) return;
    if (isFilmReady()) leave();
    else {
      wantsSkip = true;
      busy(true);
    }
  }
  intro = {skip};

  const lenis = getLenis();
  lenis?.scrollTo(0, {immediate: true});
  lenis?.stop();
  window.scrollTo(0, 0);
  SKIP_EVENTS.forEach((type) => {
    window.addEventListener(type, skip, {passive: true});
  });
  gsap.set(nav, {autoAlpha: 0, y: -20});

  // The shutter and the nav: played by leave().
  lift = gsap
    .timeline({paused: true, onComplete: finish})
    .to(overlay, {yPercent: -100, duration: 0.9, ease: 'power4.inOut'})
    .to(nav, {autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out'}, 0.5);

  void filmReady().then(() => {
    if (wantsSkip || titlesDone) leave();
  });

  void logoLoaded(overlay).then(() => {
    // Skipped before the logo arrived: the shutter is already lifting.
    if (leaving || finished) return;
    titles = gsap
      .timeline({
        delay: 0.2,
        onComplete: () => {
          titlesDone = true;
          if (isFilmReady()) leave();
          // Still loading: hold the last frame and say so.
          else busy(true);
        },
      })
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
        q('.s0-chip [data-chip]'),
        {clipPath: CLIP_CENTRE},
        {clipPath: CLIP_FULL, duration: 0.8, ease: 'circ.out'},
        1.3,
      )
      // The beat the flame used to fill, kept so the titles read before the shutter.
      .to({}, {duration: 0.3});

    // The flame is a large blended, masked image: the frames it costs a small phone show.
    if (!liteOn()) {
      titles
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
        );
    }
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
          <Logo variant="groups" width="87.5%" alt="" lazy />
        </div>
      </div>
      <div className="s0-chipwrap">
        <Chip className="s0-chip" size="m" tilt={3}>
          Low &amp; slow · wood smoked
        </Chip>
      </div>
      {/* Pointer only: on a keyboard, any key skips. The overlay is hidden from screen readers.
          data-busy picks the label (film.css): "Loading…" as served, until the script above runs,
          and again whenever a skip is waiting on the film. */}
      <button
        type="button"
        className="s0-skip"
        tabIndex={-1}
        data-busy=""
        onClick={() => intro?.skip()}
      >
        <span className="s0-skip__go">Skip intro</span>
        <span className="s0-skip__wait">Loading…</span>
      </button>
    </div>
  );
}
