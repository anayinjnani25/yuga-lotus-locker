// The moving state of the box. A plain mutable object read every frame by the 3D parts,
// so animations never cause React re-renders.
import { reducedMotion } from '../store';

export interface Pose {
  /** 0 = scrambled digits, 1 = 1-7-0-9 */
  wheels: number;
  /** 0 = bolt in the hook eye, 1 = slid out */
  bolt: number;
  /** 0 = lid shut, 1 = propped open */
  lid: number;
  /** 0 = 0° (locked), 1 = 90° (open) */
  lidServo: number;
  /** 0 = walls up, 1 = folded flat */
  walls: number;
  /** band offsets in radians, 0 = solved */
  bands: [number, number, number];
  /** 0 = leaves resting on the walls, 1 = in their sockets */
  leaves: [number, number, number, number];
  /** 0 = ring at its stopper, 1 = holes lined up */
  ring: number;
  /** 0 = button out, 1 = pushed in */
  button: number;
  /** 0 = lotus cocked/closed, 1 = fired/open (also lifts the drawer catch) */
  fire: number;
  /** 0 = treasury drawer shut, 1 = pushed out */
  drawer: number;
  /** saved coin falling: 0 = at the slot (hidden), 1 = landed in the drawer (hidden) */
  coin: number;
}

export const SCRAMBLE: [number, number, number] = [1.57, -3.14, 4.71];

export const EXPLORE_POSE: Pose = {
  wheels: 1, bolt: 1, lid: 1, lidServo: 1, walls: 0, bands: [0, 0, 0], leaves: [1, 1, 1, 1], ring: 1, button: 0, fire: 1, drawer: 0, coin: 0,
};
export const LOCKED_POSE: Pose = {
  wheels: 0, bolt: 0, lid: 0, lidServo: 0, walls: 0, bands: [...SCRAMBLE], leaves: [0, 0, 0, 0], ring: 0, button: 0, fire: 0, drawer: 0, coin: 0,
};

export const pose: Pose = clonePose(EXPLORE_POSE);

export function clonePose(p: Pose): Pose {
  return { ...p, bands: [...p.bands] as Pose['bands'], leaves: [...p.leaves] as Pose['leaves'] };
}
export function setPose(p: Pose) {
  Object.assign(pose, clonePose(p));
}

// ───────── tween engine (ticked from useFrame) ─────────
interface Tw { t0: number; ms: number; fn: (t: number) => void; res: () => void }
const tweens: Tw[] = [];
let generation = 0;
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function tween(ms: number, fn: (t: number) => void) {
  const gen = generation;
  return new Promise<void>((res, rej) => {
    tweens.push({
      t0: performance.now(), ms: reducedMotion() ? 1 : ms, fn,
      res: () => (gen === generation ? res() : rej(new Error('cancelled'))),
    });
  });
}
export const wait = (ms: number) => tween(ms, () => {});

/** Animate selected fields from their current values to the target. */
export function animateTo(target: Partial<Pose>, ms: number) {
  const from = clonePose(pose);
  return tween(ms, (t) => {
    const e = ease(t);
    for (const k of Object.keys(target) as (keyof Pose)[]) {
      const a = from[k], b = target[k]!;
      if (Array.isArray(a)) (pose[k] as number[]) = (a as number[]).map((v, i) => v + ((b as number[])[i] - v) * e);
      else (pose[k] as number) = (a as number) + ((b as number) - (a as number)) * e;
    }
  });
}

/** Stop all running tweens; awaiting sequences are rejected. */
export function cancelTweens() {
  generation++;
  tweens.splice(0).forEach((t) => t.res());
}
export const tweensActive = () => tweens.length > 0;
export function tickTweens(now: number) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    const t = Math.min(1, (now - tw.t0) / tw.ms);
    tw.fn(t);
    if (t >= 1) { tweens.splice(i, 1); tw.res(); }
  }
}

// ───────── NeoPixel colours, keyed by LED index (null = off) ─────────
export const ledState: { colors: (string | null)[]; version: number } = { colors: Array(8).fill(null), version: 0 };
export function setLeds(c: (string | null)[]) { ledState.colors = c.slice(); ledState.version++; }
