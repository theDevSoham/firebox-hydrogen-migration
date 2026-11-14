// Draws one canvas's smoke off the main thread, so scrolling and GSAP never wait on it.
// lib/smoke.ts hands over the canvas (as an OffscreenCanvas) and steers it with messages.

import {DEFAULT_LOOK, SmokeSim, type Point, type SmokeLook} from './smoke-sim';

export type ToSmokeWorker =
  | {type: 'init'; canvas: OffscreenCanvas}
  | {type: 'look'; look: SmokeLook}
  | {type: 'size'; w: number; h: number}
  | {type: 'source'; point: Point}
  | {type: 'emit'; on: boolean}
  | {type: 'burst'; seconds: number}
  | {type: 'visible'; on: boolean}
  | {type: 'reset'};

// The project's TypeScript lib is the DOM one; these are the worker globals used here.
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<ToSmokeWorker>) => void) | null;
  requestAnimationFrame?: (callback: (time: number) => void) => number;
};
const nextFrame = (callback: (time: number) => void) =>
  scope.requestAnimationFrame
    ? scope.requestAnimationFrame(callback)
    : setTimeout(() => callback(performance.now()), 16);

let sim: SmokeSim | null = null;
let visible = true;
let running = false;
let last = 0;

const loop = (now: number) => {
  if (!sim || !visible || !sim.active) {
    running = false;
    return;
  }
  sim.step(Math.min(0.05, (now - last) / 1000));
  last = now;
  nextFrame(loop);
};

scope.onmessage = ({data}) => {
  if (data.type === 'init') sim = new SmokeSim(data.canvas, DEFAULT_LOOK);
  if (!sim) return;
  switch (data.type) {
    case 'look':
      sim.setLook(data.look);
      break;
    case 'size':
      sim.resize(data.w, data.h);
      break;
    case 'source':
      sim.source = data.point;
      break;
    case 'emit':
      sim.emitting = data.on;
      break;
    case 'burst':
      sim.burstLeft = data.seconds;
      break;
    case 'visible':
      visible = data.on;
      if (!visible) sim.clear();
      break;
    case 'reset':
      sim.emitting = false;
      sim.burstLeft = 0;
      sim.clear();
      break;
  }
  if (!running && visible && sim.active) {
    running = true;
    last = performance.now();
    nextFrame(loop);
  }
};
