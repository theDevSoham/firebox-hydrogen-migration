import type Lenis from 'lenis';
import type {RefObject} from 'react';
import {gsap, useGSAP} from './gsap';

// Shared motion plumbing (handoff/05-motion-spec.md · Production notes for React).

/** True when the page should move: the flag the inline script sets on <html> (see MOTION_FLAGS in app/root.tsx). */
export const motionOn = () =>
  document.documentElement.hasAttribute('data-motion');

/** Desktop from 768px, phones below (handoff/06 has the phone differences). */
export function motionQueries() {
  if (!motionOn()) return {d: 'not all', m: 'not all'};
  return {d: '(min-width: 768px)', m: '(max-width: 767px)'};
}

/**
 * True on a device that should travel light: little memory, few cores, or the visitor asked the
 * browser to save data (MOTION_FLAGS in app/root.tsx sets html[data-lite] before first paint).
 * The film still plays; it drops what costs most and adds least: the canvas smoke, the intro's
 * blended flame, the cards' parallax and the smoothed wheel.
 */
export const liteOn = () => document.documentElement.hasAttribute('data-lite');

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The longest the film waits on fonts before it sets up with whatever has arrived. */
const FONTS_CAP_MS = 6000;

let fontsReady: Promise<void> | null = null;

/**
 * Resolves once the fonts have swapped in (or after 6 s), so SplitText measures the real faces:
 * split on the stand-ins, lines break in the wrong places and jump when the fonts land. Every
 * scene waits on this one promise, so their ScrollTriggers are still created in page order.
 * On a first visit the intro covers the wait (filmReady below).
 */
export function motionReady(): Promise<void> {
  fontsReady ??= Promise.race([
    document.fonts
      ? document.fonts.ready.then(() => undefined)
      : Promise.resolve(),
    wait(FONTS_CAP_MS),
  ]);
  return fontsReady;
}

/**
 * A pause that lets the browser paint first: idle time where it has it (so the intro's frames
 * come before a scene's setup), else the next task.
 */
const breathe = () =>
  new Promise<void>((resolve) => {
    if (typeof requestIdleCallback === 'function')
      requestIdleCallback(() => resolve(), {timeout: 200});
    else setTimeout(resolve, 0);
  });

let turns: Promise<void> | null = null;

/**
 * A scene's turn to set up: after the fonts, one scene per task, in the order the scenes asked
 * (page order). Setting every scene up in one go was a single long task that held the page up
 * after load; a task each keeps it responsive, and ScrollTriggers are still created top to bottom.
 */
export function motionTurn(): Promise<void> {
  turns = (turns ?? motionReady()).then(breathe);
  return turns;
}

/** Resolves once every scene has had its turn. */
export function motionSettled(): Promise<void> {
  return motionReady().then(() => turns ?? undefined);
}

/** The longest the intro holds the page back, counted from when its script starts. */
const READY_CAP_MS = 8000;

let ready: Promise<void> | null = null;
let readyNow = false;

/**
 * Resolves when the film can be shown without anything moving under the visitor: the fonts are
 * in, the first screen's art is decoded, every scene is set up and the page has been measured
 * with its pins. The intro (S0) holds its curtain until then; it never waits past the cap.
 */
export function filmReady(): Promise<void> {
  ready ??= Promise.race([
    Promise.all([
      // Two frames after the last scene: SmoothScroll's ScrollTrigger.refresh() runs in the first.
      motionSettled().then(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      ),
      heroDecoded(),
      devHold(),
    ]).then(() => undefined),
    wait(READY_CAP_MS),
  ]).then(() => void (readyNow = true));
  return ready;
}

/**
 * Development only: `/?hold=4000` keeps the film "loading" for that many milliseconds, to see
 * the intro wait and the Skip button's "Loading…" without a slow connection. Not in the build.
 */
function devHold(): Promise<void> {
  if (!import.meta.env.DEV) return Promise.resolve();
  const ms = Number(new URLSearchParams(location.search).get('hold'));
  return ms > 0 ? wait(ms) : Promise.resolve();
}

/** Whether filmReady() has resolved. */
export const isFilmReady = () => readyNow;

/** The first screen's art, loaded and decoded, so lifting the curtain doesn't reveal it half-drawn. */
async function heroDecoded() {
  const img = document.querySelector<HTMLImageElement>('.s1-card img');
  if (!img) return;
  if (!img.complete)
    await new Promise<void>((resolve) => {
      img.addEventListener('load', () => resolve(), {once: true});
      img.addEventListener('error', () => resolve(), {once: true});
    });
  await img.decode?.().catch(() => undefined);
}

let lenis: Lenis | null = null;
export const setLenis = (instance: Lenis | null) => void (lenis = instance);
export const getLenis = () => lenis;

/**
 * Reads the targets' transforms in one pass so GSAP caches them. Otherwise each new tween reads an
 * element's computed style right after the previous one was written, and every read forces a
 * style recalc: hundreds of them across the split letters and lines at start-up.
 */
export function primeTransforms(...targets: gsap.TweenTarget[]) {
  for (const target of targets)
    for (const el of gsap.utils.toArray<Element>(target))
      gsap.getProperty(el, 'x');
}

/** A colour token's value, for tweens (GSAP can't interpolate var()). */
export function token(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export const CLIP_CENTRE = 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)';
export const CLIP_LEFT = 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
export const CLIP_FULL = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';

/**
 * One scene's GSAP setup: waits for its turn (motionTurn), then runs `setup` inside a matchMedia
 * scoped to the scene, with `d` true on desktop. Everything it creates is reverted on unmount or
 * when the media query stops matching (useGSAP + matchMedia).
 */
export function useSceneMotion(
  scope: RefObject<HTMLElement | null>,
  setup: (env: {d: boolean; scope: HTMLElement}) => void | (() => void),
) {
  useGSAP(
    (_context, contextSafe) => {
      let alive = true;
      let mm: gsap.MatchMedia | undefined;
      const run = contextSafe!(() => {
        const el = scope.current;
        if (!el) return;
        mm = gsap.matchMedia(el);
        mm.add(motionQueries(), (ctx) =>
          setup({d: Boolean(ctx.conditions?.d), scope: el}),
        );
      });
      void motionTurn().then(() => alive && run());
      return () => {
        alive = false;
        mm?.revert();
      };
    },
    {scope},
  );
}
