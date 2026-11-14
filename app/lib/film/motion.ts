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

let fontsReady: Promise<void> | null = null;

/**
 * Resolves once the fonts have swapped in (or after 2.5 s), so SplitText measures the real faces.
 * Every scene waits on this one promise, so their ScrollTriggers are still created in page order.
 */
export function motionReady(): Promise<void> {
  fontsReady ??= Promise.race([
    document.fonts
      ? document.fonts.ready.then(() => undefined)
      : Promise.resolve(),
    new Promise<void>((resolve) => setTimeout(resolve, 2500)),
  ]);
  return fontsReady;
}

let turns: Promise<void> | null = null;

/**
 * A scene's turn to set up: after the fonts, one scene per task, in the order the scenes asked
 * (page order). Setting every scene up in one go was a single long task that held the page up
 * after load; a task each keeps it responsive, and ScrollTriggers are still created top to bottom.
 */
export function motionTurn(): Promise<void> {
  turns = (turns ?? motionReady()).then(
    () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
  );
  return turns;
}

/** Resolves once every scene has had its turn. */
export function motionSettled(): Promise<void> {
  return motionReady().then(() => turns ?? undefined);
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
