import {gsap} from '~/lib/film/gsap';

// The two cart films, mirror images of each other:
//   add:    the dish lifts off its card in full colour, arcs up and drops into the takeaway box
//           in the nav; the lid snaps shut, embers rise and the steam puffs.
//   remove: the dish loses its colour, tips out of its line and falls into the dustbin; the bin
//           lid swings shut and the line folds away. Only then is the line removed in Shopify.
// Both work on a fixed-position copy of the photo ("ghost"), so the page itself never moves.

type Rect = {left: number; top: number; width: number; height: number};

function ghostOf(source: Element, rect: Rect, layer: Element): HTMLElement {
  const ghost = document.createElement('div');
  ghost.className = 'fb-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  const img = source instanceof HTMLImageElement ? source : null;
  if (img) ghost.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
  Object.assign(ghost.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  layer.append(ghost);
  return ghost;
}

const centre = (r: Rect) => ({
  x: r.left + r.width / 2,
  y: r.top + r.height / 2,
});

/** Embers flying up out of the box as the dish lands. */
function embers(at: {x: number; y: number}, layer: Element) {
  for (let i = 0; i < 7; i++) {
    const ember = document.createElement('span');
    ember.className = 'fb-spark';
    ember.setAttribute('aria-hidden', 'true');
    Object.assign(ember.style, {left: `${at.x}px`, top: `${at.y}px`});
    layer.append(ember);
    gsap.fromTo(
      ember,
      {x: 0, y: 0, scale: gsap.utils.random(0.6, 1.2), opacity: 1},
      {
        x: gsap.utils.random(-34, 34),
        y: gsap.utils.random(-70, -30),
        opacity: 0,
        scale: 0.2,
        duration: gsap.utils.random(0.5, 0.9),
        ease: 'power2.out',
        onComplete: () => ember.remove(),
      },
    );
  }
}

/** A dish going into the box. `card` is the menu card the button sits in. */
export function playAddFilm(card: Element | null) {
  const target = document.querySelector<HTMLElement>('[data-cart-target]');
  const icon = target?.querySelector('.fb-box-icon');
  if (!card || !target || !icon) return;
  const photo =
    card.querySelector('.fb-card__img img') ??
    card.querySelector('.fb-card__img');
  if (!photo) return;

  const from = photo.getBoundingClientRect();
  // Cards can be taller than the screen: start from the part of the photo that's in view.
  const top = Math.max(from.top, 0);
  const visible = {
    left: from.left,
    top,
    width: from.width,
    height: Math.max(Math.min(from.bottom, innerHeight) - top, 40),
  };
  const size = Math.min(visible.width, visible.height, 220);
  const start = {
    left: centre(visible).x - size / 2,
    top: centre(visible).y - size / 2,
    width: size,
    height: size,
  };
  const to = icon.getBoundingClientRect();
  const a = centre(start);
  const b = centre(to);
  const ghost = ghostOf(photo, start, document.body);
  const lid = icon.querySelector('[data-lid]');
  const steam = icon.querySelectorAll('[data-steam] path');
  const scale = Math.max((to.width * 0.5) / size, 0.04);
  // The arc peaks above the box, so the dish drops in from above.
  const peak = Math.min(b.y - a.y - 70, -60);

  gsap
    .timeline({onComplete: () => ghost.remove()})
    .to(ghost, {scale: 1.06, rotation: -4, duration: 0.18, ease: 'power2.out'})
    .to(
      lid,
      {
        rotation: -32,
        y: -2,
        svgOrigin: '5 15.6',
        duration: 0.2,
        ease: 'power2.out',
      },
      0.15,
    )
    .to(ghost, {x: b.x - a.x, duration: 0.7, ease: 'power1.inOut'}, 0.2)
    .to(ghost, {y: peak, duration: 0.38, ease: 'power2.out'}, 0.2)
    .to(ghost, {y: b.y - a.y, duration: 0.32, ease: 'power2.in'}, 0.58)
    .to(ghost, {scale, rotation: 14, duration: 0.7, ease: 'power2.in'}, 0.2)
    .to(ghost, {opacity: 0, duration: 0.08}, 0.86)
    .add(() => embers({x: b.x, y: to.top}, document.body), 0.88)
    .to(lid, {rotation: 0, y: 0, duration: 0.35, ease: 'back.out(3)'}, 0.88)
    .fromTo(
      target,
      {scale: 1},
      {
        scale: 1.14,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out',
        clearProps: 'scale',
      },
      0.88,
    )
    .fromTo(
      steam,
      {y: 4, opacity: 0},
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'all',
      },
      0.95,
    );
}

/**
 * A line going into the bin. `done` removes it in Shopify once the film is over, so the
 * optimistic cart doesn't pull the line out from under it.
 */
export function playRemoveFilm(
  line: HTMLElement,
  bin: HTMLElement,
  done: () => void,
) {
  const thumb =
    line.querySelector('.fb-cart__thumb img') ??
    line.querySelector('.fb-cart__thumb');
  // Inside the drawer the copy must live in the <dialog>: it sits above everything else.
  const layer = line.closest('dialog') ?? document.body;
  if (!thumb) return done();

  const from = thumb.getBoundingClientRect();
  const to = bin.getBoundingClientRect();
  const a = centre(from);
  const b = centre(to);
  const ghost = ghostOf(thumb, from, layer);
  const lid = bin.querySelector('[data-lid]');
  gsap.set(thumb, {visibility: 'hidden'});

  // The removal never waits on the film: if frames stall (a background tab), it goes anyway.
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(fallback);
    ghost.remove();
    done();
  };
  const fallback = setTimeout(finish, 1200);

  gsap
    .timeline({onComplete: finish})
    // The colour drains out, and it tips up out of its slot…
    .to(ghost, {filter: 'grayscale(1) brightness(.7)', duration: 0.25}, 0)
    .to(
      ghost,
      {y: -18, rotation: -10, scale: 1.05, duration: 0.22, ease: 'power2.out'},
      0,
    )
    .to(line, {opacity: 0.4, duration: 0.2}, 0)
    .to(
      lid,
      {
        rotation: 38,
        y: -1,
        svgOrigin: '20.5 6.5',
        duration: 0.2,
        ease: 'power2.out',
      },
      0.1,
    )
    // …then falls into the bin.
    .to(ghost, {x: b.x - a.x, duration: 0.45, ease: 'power1.in'}, 0.22)
    .to(ghost, {y: b.y - a.y, duration: 0.45, ease: 'power3.in'}, 0.22)
    .to(
      ghost,
      {scale: 0.12, rotation: 40, duration: 0.45, ease: 'power2.in'},
      0.22,
    )
    .to(ghost, {opacity: 0, duration: 0.06}, 0.64)
    .to(lid, {rotation: 0, y: 0, duration: 0.3, ease: 'back.out(3)'}, 0.66)
    .fromTo(
      bin,
      {rotation: 0},
      {
        rotation: -8,
        duration: 0.06,
        yoyo: true,
        repeat: 3,
        clearProps: 'rotation',
      },
      0.66,
    )
    // The line folds away.
    .to(
      line,
      {
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
      },
      0.72,
    );
}
