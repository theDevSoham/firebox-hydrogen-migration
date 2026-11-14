// The smoke itself: puffs rising from an emitter, drawn into a 2D canvas. Shared by the worker
// (lib/smoke.worker.ts) and the main-thread fallback in lib/smoke.ts, so it uses no DOM and no GSAP.

/**
 * Smoke is soft, so it's drawn at half the CSS resolution and scaled up: a ninth of the pixels of
 * a 1.5× canvas, with no visible difference.
 */
export const RESOLUTION = 0.5;

export type Point = {x: number; y: number; s: number};

export type SmokeLook = {
  /** Puffs per second. */
  rate: number;
  /** Seconds a puff lives. */
  life: number;
  rise: number;
  drift: number;
  wobble: number;
  size: [number, number];
  grow: number;
  alpha: number;
  /** "r,g,b" of the puff. */
  rgb: string;
};

export const DEFAULT_LOOK: SmokeLook = {
  rate: 6,
  life: 5,
  rise: 55,
  drift: 16,
  wobble: 14,
  size: [24, 70],
  grow: 2.6,
  alpha: 0.15,
  rgb: '254,242,218',
};

type Canvas = HTMLCanvasElement | OffscreenCanvas;
type Context = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type Puff = {
  x: number;
  y: number;
  age: number;
  life: number;
  r: number;
  ph: number;
  vx: number;
};

function sprite(rgb: string): Canvas {
  const c: Canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(128, 128)
      : Object.assign(document.createElement('canvas'), {
          width: 128,
          height: 128,
        });
  const ctx = c.getContext('2d') as Context;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, `rgba(${rgb},1)`);
  g.addColorStop(0.45, `rgba(${rgb},.42)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return c;
}

export class SmokeSim {
  emitting = false;
  burstLeft = 0;
  /** Where puffs start, in CSS pixels of the canvas. Null until the first sample arrives. */
  source: Point | null = null;
  private ctx: Context;
  private puff: Canvas;
  private puffs: Puff[] = [];
  private acc = 0;
  private w = 0;
  private h = 0;

  constructor(
    private canvas: Canvas,
    private look: SmokeLook,
  ) {
    this.ctx = canvas.getContext('2d') as Context;
    this.puff = sprite(look.rgb);
  }

  setLook(look: SmokeLook) {
    this.look = look;
    this.puff = sprite(look.rgb);
  }

  /** Sizes the canvas to its box (CSS pixels) at RESOLUTION. */
  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.canvas.width = Math.max(1, Math.round(w * RESOLUTION));
    this.canvas.height = Math.max(1, Math.round(h * RESOLUTION));
    this.ctx.setTransform(RESOLUTION, 0, 0, RESOLUTION, 0, 0);
  }

  /** Something is emitting or still fading. */
  get active() {
    return this.emitting || this.burstLeft > 0 || this.puffs.length > 0;
  }

  clear() {
    this.puffs.length = 0;
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  /** Advances `dt` seconds and draws. `sample` overrides `source` for this step. */
  step(dt: number, sample?: () => Point) {
    const o = this.look;
    const emitting = this.emitting || this.burstLeft > 0;
    if (this.burstLeft > 0) this.burstLeft -= dt;

    const src = emitting ? (sample ? sample() : this.source) : null;
    if (src) {
      this.acc += o.rate * dt;
      while (this.acc >= 1) {
        this.acc -= 1;
        this.puffs.push({
          x: src.x + (Math.random() - 0.5) * 10 * src.s,
          y: src.y,
          age: 0,
          life: o.life * (0.7 + Math.random() * 0.6),
          r:
            (o.size[0] + Math.random() * (o.size[1] - o.size[0])) *
            Math.max(0.6, src.s),
          ph: Math.random() * 6.28,
          vx: (Math.random() - 0.25) * o.drift,
        });
      }
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.age += dt;
      if (p.age > p.life) {
        this.puffs.splice(i, 1);
        continue;
      }
      const t = p.age / p.life;
      p.y -= o.rise * dt * (1 - t * 0.4);
      p.x += (p.vx + Math.sin(p.ph + p.age * 1.3) * o.wobble) * dt;
      const rad = p.r * (1 + t * o.grow);
      ctx.globalAlpha = o.alpha * Math.sin(Math.PI * t);
      ctx.drawImage(this.puff, p.x - rad, p.y - rad, rad * 2, rad * 2);
    }
    ctx.globalAlpha = 1;
  }
}
