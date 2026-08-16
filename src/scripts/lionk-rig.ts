// The shared vocabulary of Lionk's rig: which bones we drive, how a pose is
// written, and the two standing keys every other pose is built from.
//
// This module is pure data and pure functions — no three.js, no DOM, no side
// effects — so both the runtime (`lionk.ts`) and the idle actions
// (`lionk-actions.ts`) can import it without either depending on the other.

/** The subset of the humanoid rig we animate. */
export const BONES = [
  'hips',
  'spine',
  'chest',
  'upperChest',
  'neck',
  'head',
  'leftShoulder',
  'leftUpperArm',
  'leftLowerArm',
  'leftHand',
  'rightShoulder',
  'rightUpperArm',
  'rightLowerArm',
  'rightHand',
  'leftUpperLeg',
  'leftLowerLeg',
  'leftFoot',
  'rightUpperLeg',
  'rightLowerLeg',
  'rightFoot',
] as const;

export type BoneKey = (typeof BONES)[number];

/**
 * The hands are fully rigged — five fingers, three joints each, per hand —
 * so anything the character holds can actually be gripped rather than
 * balanced against the wrist.
 *
 * These are kept out of `BONES` on purpose: the spring solver above exists to
 * give the body overlapping action, and thirty extra springs would cost that
 * every frame to animate joints nobody reads as lagging. Fingers are damped
 * straight to their target instead.
 */
export const FINGERS = ['Thumb', 'Index', 'Middle', 'Ring', 'Little'] as const;
export type FingerName = (typeof FINGERS)[number];
export type HandSide = 'left' | 'right';

/** Per-finger curl, 0 straight to 1 closed. `all` sets any finger unnamed. */
export type HandPose = Partial<Record<FingerName, number>> & { all?: number };

/**
 * The thumb's metacarpal is the joint the others do not have, and its middle
 * joint is named differently, so each finger carries its own segment list.
 */
export const FINGER_SEGMENTS: Record<FingerName, readonly string[]> = {
  Thumb: ['Metacarpal', 'Proximal', 'Distal'],
  Index: ['Proximal', 'Intermediate', 'Distal'],
  Middle: ['Proximal', 'Intermediate', 'Distal'],
  Ring: ['Proximal', 'Intermediate', 'Distal'],
  Little: ['Proximal', 'Intermediate', 'Distal'],
};

/** How much of the curl each joint takes; the middle joint closes hardest. */
const SEGMENT_SHARE: Record<string, number> = {
  Metacarpal: 0.5,
  Proximal: 1.0,
  Intermediate: 1.35,
  Distal: 0.85,
};

/** A hand at rest is not a flat plank — fingers fall into a slight curve. */
export const HAND_RELAXED: HandPose = { all: 0.22, Thumb: 0.16 };

export function curlOf(pose: HandPose | undefined, finger: FingerName): number {
  if (!pose) return HAND_RELAXED[finger] ?? HAND_RELAXED.all ?? 0;
  return pose[finger] ?? pose.all ?? 0;
}

/**
 * Fingers close around Z, mirrored between the hands. The thumb folds across
 * the palm rather than into it, so it borrows some of the curl on Y.
 *
 * The sign is worth deriving rather than guessing, because getting it
 * backwards bends the fingers over the back of the hand and still looks
 * plausible in a small render. Rest pose is a T-pose with the palms down, so
 * the left hand's fingers point along +X and the right hand's along -X, and
 * closing either one means carrying the fingertip toward -Y. Rotating about Z
 * by t sends +X to (cos t, sin t): reaching -Y needs sin t < 0, so the left
 * hand curls negative. The right starts at -X and goes to (-cos t, -sin t),
 * which needs sin t > 0 — the opposite sign.
 */
export function fingerRotation(
  side: HandSide,
  finger: FingerName,
  segment: string,
  curl: number,
  out: TripleOut,
): void {
  const sign = side === 'left' ? -1 : 1;
  const amount = curl * (SEGMENT_SHARE[segment] ?? 1);
  out[0] = 0;
  out[1] = finger === 'Thumb' ? sign * amount * 0.55 : 0;
  out[2] = sign * amount * (finger === 'Thumb' ? 0.5 : 1.45);
}
export type Triple = readonly [number, number, number];
export type Pose = Partial<Record<BoneKey, Triple>>;

/** A mutable triple, used as a scratch buffer by the additive layers. */
export type TripleOut = [number, number, number];

export const ZERO: Triple = [0, 0, 0];

/**
 * Arms rest at the sides. Every other pose is written as a delta from the VRM
 * rest pose (a T-pose), so this is the baseline the character returns to.
 */
export const ARMS_DOWN: Pose = {
  leftUpperArm: [0.05, 0, -1.22],
  leftLowerArm: [0, -0.18, -0.14],
  rightUpperArm: [0.05, 0, 1.22],
  rightLowerArm: [0, 0.18, 0.14],
};

/**
 * Contrapposto — weight carried on one leg, the other loose and slightly
 * forward, pelvis tilted and the shoulders counter-tilted against it. Standing
 * square on both legs is what makes a rigged character read as a mannequin,
 * and no amount of arm posing above it fixes that.
 *
 * Every scene is built on one of these two and slowly drifts between them, so
 * the character keeps shifting its weight instead of holding a frozen shape.
 *
 * The legs, though, are not standing on anything. This character floats, and
 * a floating figure with planted, straightened legs and flat feet reads as a
 * doll hung on a wire: the giveaway is that the knees carry no weight yet
 * behave as if they do. So the legs hang instead — knees bent by different
 * amounts either side, thighs drifting apart, ankles fallen loose the way
 * they do when nothing is underneath them.
 */
export const STAND_A: Pose = {
  ...ARMS_DOWN,
  hips: [0.04, 0, 0.03],
  spine: [0, 0.05, -0.022],
  chest: [-0.02, 0.04, -0.018],
  neck: [0.02, -0.03, 0.02],
  // Splayed as well as bent. A knee that bends straight toward the camera is
  // invisible from the front — the leg just foreshortens and reads as
  // straight — so the drift has to carry sideways too for the looseness to
  // survive the head-on framing the hero slide uses.
  leftUpperLeg: [-0.22, 0.08, -0.27],
  leftLowerLeg: [0.46, 0, 0.05],
  leftFoot: [-0.4, 0.1, 0],
  rightUpperLeg: [-0.44, -0.1, 0.34],
  rightLowerLeg: [0.78, 0, -0.06],
  rightFoot: [-0.5, -0.12, 0],
};

export const STAND_B: Pose = {
  ...ARMS_DOWN,
  hips: [0.02, 0, -0.03],
  spine: [0, -0.04, 0.022],
  chest: [-0.02, -0.03, 0.018],
  neck: [0.02, 0.03, -0.02],
  leftUpperLeg: [-0.46, 0.11, -0.35],
  leftLowerLeg: [0.8, 0, 0.06],
  leftFoot: [-0.52, 0.13, 0],
  rightUpperLeg: [-0.2, -0.07, 0.25],
  rightLowerLeg: [0.44, 0, -0.05],
  rightFoot: [-0.38, -0.09, 0],
};

/** How fast a scene drifts between its two pose keys, in radians per second. */
export const SHIFT_SPEED = 0.78;

/**
 * Overlapping action. A body does not move as one piece: the hips lead, the
 * chest follows, the head arrives last, and a hand trails further still. Each
 * bone gets a rate multiplier — heavier and closer to the root means faster to
 * arrive, further out along a limb means more lag — and that spread alone is
 * most of the difference between a rig that moves and a rig that snaps.
 */
export const BONE_LAG: Record<BoneKey, number> = {
  hips: 1.35,
  spine: 1.15,
  chest: 1.0,
  upperChest: 0.9,
  neck: 0.76,
  head: 0.62,
  leftShoulder: 0.95,
  leftUpperArm: 0.8,
  leftLowerArm: 0.58,
  leftHand: 0.42,
  rightShoulder: 0.95,
  rightUpperArm: 0.8,
  rightLowerArm: 0.58,
  rightHand: 0.42,
  leftUpperLeg: 1.1,
  leftLowerLeg: 0.85,
  leftFoot: 0.66,
  rightUpperLeg: 1.1,
  rightLowerLeg: 0.85,
  rightFoot: 0.66,
};

/** Base angular frequency of the joint springs, in radians per second. */
export const BASE_OMEGA = 8.5;
/** Integration step for the springs; anything longer can go unstable. */
export const MAX_STEP = 1 / 90;

/**
 * The weight-shift cycle. A plain cosine is the giveaway of a procedural rig —
 * it is always moving, at an even speed, forever. People hold a stance, then
 * change it fairly quickly, then hold again. Smoothstepping a triangle wave
 * gives exactly that: long dwells at both ends, a brisk move between them.
 */
export function weightShift(t: number): number {
  const p = (((t / (Math.PI * 2)) % 1) + 1) % 1;
  const tri = p < 0.5 ? p * 2 : 2 - p * 2;
  return tri * tri * (3 - 2 * tri);
}

/** Frame-rate independent exponential smoothing. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Ease-in-out, used for the action blend envelope. */
export function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}
