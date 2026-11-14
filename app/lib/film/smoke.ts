import {gsap} from './gsap';
import {DEFAULT_LOOK, SmokeSim, type Point, type SmokeLook} from './smoke-sim';
import type {ToSmokeWorker} from './smoke.worker';

// Interim canvas smoke and steam (handoff/04-components.md · SmokeCanvas). A stand-in only:
// the smoke videos in handoff/07-assets.md replace it.
//
// The drawing runs in a worker on an OffscreenCanvas, so the main thread (scrolling, GSAP) never
// waits on it; on budget phones it was nearly all of each frame. Browsers without OffscreenCanvas
// draw on the main thread from the GSAP ticker instead. Either way it stops once nothing is
// emitting and the last puff has faded, or as soon as the canvas leaves the screen.

export type SmokeOptions = Partial<SmokeLook> & {
  /** Emitter in CSS pixels of the canvas, sampled as the smoke runs so it follows resizes. */
  source: (w: number, h: number) => Point;
};

/** Maps a point in an image's own pixels to a box drawn with object-fit: cover. */
export function coverPoint(
  nw: number,
  nh: number,
  px: number,
  py: number,
  bw: number,
  bh: number,
  ox = 0.5,
  oy = 0.5,
): Point {
  const s = Math.max(bw / nw, bh / nh);
  return {x: (bw - nw * s) * ox + px * s, y: (bh - nh * s) * oy + py * s, s};
}

// A canvas hands its control to a worker only once, and scenes rebuild their Smoke when the
// layout crosses 768px (React remounts it in development too), so each canvas keeps its worker.
// null: the canvas was handed over but its worker failed, so it stays blank.
const workers = new WeakMap<HTMLCanvasElement, Worker | null>();

function workerFor(canvas: HTMLCanvasElement): Worker | null | undefined {
  if (workers.has(canvas)) return workers.get(canvas);
  if (
    typeof Worker === 'undefined' ||
    typeof canvas.transferControlToOffscreen !== 'function'
  )
    return undefined;
  let offscreen: OffscreenCanvas;
  try {
    offscreen = canvas.transferControlToOffscreen();
  } catch {
    return undefined;
  }
  try {
    const worker = new Worker(new URL('./smoke.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.postMessage(
      {type: 'init', canvas: offscreen} satisfies ToSmokeWorker,
      [offscreen],
    );
    workers.set(canvas, worker);
    return worker;
  } catch {
    workers.set(canvas, null);
    return null;
  }
}

/** How often the emitter is sampled for the worker while smoke is coming out. */
const SAMPLE_MS = 100;

export class Smoke {
  private source: SmokeOptions['source'];
  private worker: Worker | null | undefined;
  /** Main-thread fallback only. */
  private sim: SmokeSim | null = null;
  private emitting = false;
  private burstUntil = 0;
  private visible = true;
  private running = false;
  private last = 0;
  private w = 0;
  private h = 0;
  private sampler: ReturnType<typeof setInterval> | null = null;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;

  constructor(
    private canvas: HTMLCanvasElement,
    {source, ...look}: SmokeOptions,
  ) {
    this.source = source;
    const full = {...DEFAULT_LOOK, ...look};
    this.worker = workerFor(canvas);
    if (this.worker) this.post({type: 'look', look: full});
    else if (this.worker === undefined) this.sim = new SmokeSim(canvas, full);

    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    // Off screen, the fading tail of a scene's smoke would keep drawing under the next scene.
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.post({type: 'visible', on: this.visible});
      if (!this.visible) this.halt();
      else this.run();
    });
    this.intersectionObserver.observe(canvas);
  }

  start() {
    this.emitting = true;
    this.post({type: 'emit', on: true});
    if (this.sim) this.sim.emitting = true;
    this.run();
  }

  stop() {
    this.emitting = false;
    this.post({type: 'emit', on: false});
    if (this.sim) this.sim.emitting = false;
  }

  burst(seconds: number) {
    this.burstUntil = performance.now() + seconds * 1000;
    this.post({type: 'burst', seconds});
    if (this.sim) this.sim.burstLeft = seconds;
    this.run();
  }

  destroy() {
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.halt();
    this.post({type: 'reset'});
    if (this.worker && !this.canvas.isConnected) {
      this.worker.terminate();
      workers.delete(this.canvas);
    }
  }

  private post(message: ToSmokeWorker) {
    this.worker?.postMessage(message);
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.w = r.width;
    this.h = r.height;
    this.sim?.resize(this.w, this.h);
    this.post({type: 'size', w: this.w, h: this.h});
    this.sample();
  }

  private sample() {
    if (this.worker)
      this.post({type: 'source', point: this.source(this.w, this.h)});
  }

  /** Starts drawing (fallback) or sampling the emitter (worker) while there's smoke on screen. */
  private run() {
    if (!this.visible) return;
    if (this.worker) {
      this.sample();
      this.sampler ??= setInterval(() => {
        if (this.emitting || performance.now() < this.burstUntil) this.sample();
        else this.halt();
      }, SAMPLE_MS);
      return;
    }
    if (!this.sim || this.running || !this.sim.active) return;
    this.running = true;
    this.last = performance.now();
    gsap.ticker.add(this.tick);
  }

  private halt() {
    if (this.sampler) clearInterval(this.sampler);
    this.sampler = null;
    if (!this.sim) return;
    this.running = false;
    gsap.ticker.remove(this.tick);
    if (!this.visible) this.sim.clear();
  }

  private tick = () => {
    const sim = this.sim!;
    const now = performance.now();
    sim.step(Math.min(0.05, (now - this.last) / 1000), () =>
      this.source(this.w, this.h),
    );
    this.last = now;
    if (!sim.active) this.halt();
  };
}
