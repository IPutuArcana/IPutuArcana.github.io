// Lionk's idle repertoire: the short things the character does to itself when
// nothing else is happening, and the props it does them with.
//
// The runtime in `lionk.ts` owns one scene pose per slide and a click
// reaction. This module sits between the two: a director that waits out a
// random gap, plays one action, and blends back to whatever the slide wanted.
//
// Blending is done on the pose *targets*, not on the bones. The runtime's
// joint springs are already chasing a target with per-bone lag, so handing
// them a target that eases from the scene pose to the action pose and back
// gives a cross-fade that keeps all the overlapping action for free — where
// cross-fading two finished bone rotations would flatten it.
//
// Props do not exist in the VRM; they are built here out of primitives and
// parented to a bone, so nothing has to ship alongside the model.

import type * as THREE_T from 'three';

import {
  type BoneKey,
  type HandPose,
  type Pose,
  type TripleOut,
  STAND_A,
  STAND_B,
  clamp,
  smoothstep,
} from './lionk-rig';

export type PropKind = 'laptop' | 'sword' | 'ball';

/** Per-frame motion layered on top of an action's pose while it runs. */
type Overlay = (t: number, phase: number, bone: BoneKey, out: TripleOut) => void;

export interface MicroAction {
  id: string;
  /** Seconds held at full weight, not counting the blends either side. */
  hold: number;
  blendIn: number;
  blendOut: number;
  pose: Pose;
  /** Optional second key; the action breathes between the two like a scene. */
  poseB?: Pose;
  expression?: string | null;
  /**
   * Body angle to take for the duration, in radians, replacing the slide's.
   * Some shapes only exist in silhouette — an L-sit seen head-on is just a
   * standing figure with its legs foreshortened away — so an action that has
   * a profile worth seeing turns to show it.
   */
  turn?: number;
  /** Finger curls for the duration; omitted hands stay at their resting curve. */
  hands?: { left?: HandPose; right?: HandPose };
  prop?: {
    kind: PropKind;
    /**
     * Bone the prop is parented to. Held objects hang off a finger root
     * rather than the hand itself — the hand bone's origin is the wrist, so
     * a sword parented there grows out of the forearm.
     */
    bone: string;
    /** Offset from that bone, in metres. */
    offset: readonly [number, number, number];
    /** Resting rotation, in radians. */
    rotation?: readonly [number, number, number];
    /** Radians per second, applied continuously while the prop is out. */
    spin?: readonly [number, number, number];
  };
  overlay?: Overlay;
}

/** Seconds between idle actions — the gap is re-rolled after every one. */
const GAP_MIN = 7;
const GAP_MAX = 10;

/**
 * The Coder. Pulls up a laptop and types into it — quick, unglamorous, head
 * down. The fingers are not rigged (the VRM's hands are a single bone each),
 * so the typing reads through the wrists instead, which is roughly what you
 * see from across a room anyway.
 */
const CODER: MicroAction = {
  id: 'coder',
  hold: 3,
  blendIn: 0.4,
  blendOut: 0.45,
  // Turned a little off the slide's angle so the screen is edge-on to the
  // viewer rather than hidden behind the character's own back.
  turn: -0.5,
  pose: {
    ...STAND_A,
    // Both forearms fold inward on *negative* Y — not mirrored signs. The
    // scenes that already read well prove it: the listening pose folds the
    // left arm across the body at -1.15, and the thinking pose brings the
    // right hand to the chin at -0.45. Mirroring the sign swung the right
    // arm outward instead, which is why the hands never met the keyboard.
    leftUpperArm: [0.34, 0, -1.2],
    leftLowerArm: [0, -1.32, -0.16],
    leftHand: [0.2, 0, 0.05],
    rightUpperArm: [0.34, 0, 1.2],
    rightLowerArm: [0, -1.32, 0.16],
    rightHand: [0.2, 0, -0.05],
    chest: [0.08, 0, 0],
    neck: [0.13, 0, 0],
    head: [0.2, 0, 0],
  },
  poseB: {
    ...STAND_B,
    leftUpperArm: [0.37, 0, -1.17],
    leftLowerArm: [0, -1.36, -0.12],
    leftHand: [0.23, 0, 0.07],
    rightUpperArm: [0.37, 0, 1.17],
    rightLowerArm: [0, -1.36, 0.12],
    rightHand: [0.23, 0, -0.07],
    chest: [0.1, 0, 0],
    neck: [0.15, 0, 0],
    head: [0.22, 0, 0],
  },
  expression: null,
  // Curled over the keys, not splayed flat against them.
  hands: { left: { all: 0.5, Thumb: 0.3 }, right: { all: 0.5, Thumb: 0.3 } },
  prop: {
    kind: 'laptop',
    // On the chest rather than a hand: the hands are busy typing, and a
    // laptop that jitters with them reads as a glitch rather than as typing.
    bone: 'chest',
    // Turned to face the character. Built lid-away-from-origin, it was
    // hinged open on the far side — the screen pointing out of the page and
    // the character typing into the back of its own machine.
    // Down at the waist, where forearms folded across the body actually sit.
    offset: [0, -0.32, 0.2],
    rotation: [0, Math.PI, 0],
  },
  overlay(t, _phase, bone, out) {
    // Two hands, out of phase, at a rate that reads as typing rather than as
    // a vibration. The wrists carry it; the forearms only just move.
    if (bone === 'leftHand') out[0] = Math.sin(t * 21) * 0.1;
    if (bone === 'rightHand') out[0] = Math.sin(t * 21 + 2.3) * 0.1;
    if (bone === 'leftLowerArm') out[0] = Math.sin(t * 21 + 0.6) * 0.018;
    if (bone === 'rightLowerArm') out[0] = Math.sin(t * 21 + 2.9) * 0.018;
    // The head drifts over the screen as if reading down it.
    if (bone === 'head') out[1] = Math.sin(t * 1.3) * 0.07;
  },
};

/**
 * The Game Dev. One Souls-like beat: settle into stance, cut, recover, twirl
 * the blade away. The movement lives in the overlay rather than the pose,
 * because a slash *is* the movement — the shape it passes through is not the
 * point.
 */
const SWORDSMAN: MicroAction = {
  id: 'swordsman',
  hold: 2.9,
  blendIn: 0.35,
  blendOut: 0.5,
  pose: {
    ...STAND_A,
    rightUpperArm: [0, 0.15, 0.62],
    rightLowerArm: [0, 0.5, -0.45],
    rightHand: [0, 0, -0.18],
    leftUpperArm: [0.1, -0.35, -0.95],
    leftLowerArm: [0, -0.6, -0.35],
    spine: [0, 0.26, -0.02],
    chest: [-0.04, 0.2, -0.02],
    head: [0, -0.2, 0.03],
    // A wider, lower base than the standing keys — weight down, ready.
    leftUpperLeg: [-0.1, 0.1, -0.12],
    leftLowerLeg: [0.3, 0, 0],
    rightUpperLeg: [-0.06, -0.12, 0.14],
    rightLowerLeg: [0.34, 0, 0],
  },
  expression: null,
  // A fist around the grip, thumb laid over the fingers.
  hands: { right: { all: 0.95, Thumb: 0.55 } },
  prop: {
    kind: 'sword',
    // The base of the middle finger — the middle of the palm, which is where
    // a hand actually holds a hilt. Parented to the wrist the blade sprouted
    // from the forearm.
    bone: 'rightMiddleProximal',
    offset: [0, 0, 0],
    rotation: [Math.PI / 2, 0, 0],
  },
  overlay(_t, phase, bone, out) {
    // Wind up, cut, recover, twirl. Each stage is a plain ramp shaped by
    // smoothstep; the springs round off the corners between them.
    const windup = smoothstep(clamp(phase / 0.28, 0, 1));
    const cut = smoothstep(clamp((phase - 0.3) / 0.14, 0, 1));
    const recover = smoothstep(clamp((phase - 0.52) / 0.3, 0, 1));

    // Negative is back over the shoulder, positive is down across the body.
    const swing = -windup + cut * 2 - recover * 0.75;

    if (bone === 'rightUpperArm') {
      out[0] = swing * 0.55;
      out[2] = -windup * 0.5 + cut * 0.85 - recover * 0.3;
    }
    if (bone === 'rightLowerArm') out[1] = -windup * 0.5 + cut * 0.7 - recover * 0.25;
    if (bone === 'rightHand') {
      // The twirl on the way out, once the cut has been recovered from.
      const twirl = smoothstep(clamp((phase - 0.72) / 0.24, 0, 1));
      out[2] = swing * 0.25 + twirl * Math.PI * 2;
    }
    // The torso drives the cut; an arm swinging alone is the tell of a rig
    // that was posed rather than animated.
    if (bone === 'spine') out[1] = -windup * 0.16 + cut * 0.3 - recover * 0.14;
    if (bone === 'chest') out[1] = -windup * 0.12 + cut * 0.26 - recover * 0.1;
    if (bone === 'head') out[1] = cut * 0.16 - recover * 0.08;
    if (bone === 'hips') out[1] = cut * 0.12 - recover * 0.06;
  },
};

/**
 * The Athlete, part one. An L-sit held in mid-air — legs locked out level,
 * arms pressed down at the sides. The tremor is the whole point: a held
 * isometric that is perfectly still reads as a mannequin, not as effort.
 */
const LSIT: MicroAction = {
  id: 'lsit',
  hold: 2.2,
  blendIn: 0.45,
  blendOut: 0.5,
  // Turned toward profile: the L is the whole point, and head-on the raised
  // legs just foreshorten into a standing figure. Short of a true side-on
  // angle, though — at 90° the legs reach far enough across to land on the
  // slide's copy.
  turn: -1.0,
  pose: {
    leftUpperArm: [0, 0, -1.5],
    leftLowerArm: [0, -0.05, -0.05],
    leftHand: [0.2, 0, 0],
    rightUpperArm: [0, 0, 1.5],
    rightLowerArm: [0, 0.05, 0.05],
    rightHand: [0.2, 0, 0],
    hips: [-0.12, 0, 0],
    spine: [0.05, 0, 0],
    chest: [-0.06, 0, 0],
    neck: [-0.04, 0, 0],
    head: [-0.08, 0, 0],
    // Knees tucked rather than locked out straight. A full L-sit reaches
    // most of a metre forward, and on a stage this narrow that puts the
    // character's shins across the slide's copy; the tuck holds the same
    // line through the hips at half the width.
    leftUpperLeg: [-1.5, 0, 0.05],
    leftLowerLeg: [1.4, 0, 0],
    leftFoot: [-0.3, 0, 0],
    rightUpperLeg: [-1.5, 0, -0.05],
    rightLowerLeg: [1.4, 0, 0],
    rightFoot: [-0.3, 0, 0],
  },
  expression: null,
  overlay(t, phase, bone, out) {
    // The shake builds as the hold goes on, the way a real one does.
    const effort = smoothstep(clamp(phase / 0.6, 0, 1)) * 0.55 + 0.45;
    const tremor = Math.sin(t * 19) * 0.005 * effort;
    if (bone === 'leftUpperLeg' || bone === 'rightUpperLeg') out[0] = tremor;
    if (bone === 'leftLowerArm' || bone === 'rightLowerArm') out[0] = tremor * 1.6;
    if (bone === 'chest') out[0] = Math.sin(t * 9) * 0.004;
  },
};

/**
 * The Athlete, part two. A basketball spun up on the hand. The hand is one
 * bone with no fingers, so the ball rides just above it and does the work
 * itself — at that speed nobody is looking at the contact point.
 */
const BALL_SPIN: MicroAction = {
  id: 'ballspin',
  hold: 2.6,
  blendIn: 0.4,
  blendOut: 0.45,
  pose: {
    ...STAND_A,
    // Upper arm out sideways, elbow bent so the forearm stands up from it.
    // Raising the whole arm instead kept the hand beside the head, and the
    // ball with it; carrying it on the elbow puts the ball out over open
    // space where a spin can actually be seen.
    rightUpperArm: [0, 0, 0.12],
    rightLowerArm: [0, -0.12, -1.42],
    rightHand: [-0.25, 0, 0],
    leftUpperArm: [0.1, 0, -1.05],
    leftLowerArm: [0, -0.95, -0.28],
    leftHand: [0, 0, 0.18],
    chest: [-0.05, 0.04, 0],
    neck: [-0.08, 0.03, 0],
    head: [-0.2, 0.1, 0.02],
  },
  poseB: {
    ...STAND_B,
    rightUpperArm: [0, 0, 0.08],
    rightLowerArm: [0, -0.16, -1.38],
    rightHand: [-0.22, 0, 0],
    leftUpperArm: [0.13, 0, -1.1],
    leftLowerArm: [0, -1.02, -0.24],
    leftHand: [0, 0, 0.22],
    chest: [-0.03, 0.02, 0],
    neck: [-0.06, 0.01, 0],
    head: [-0.17, 0.07, -0.02],
  },
  expression: 'happy',
  // Index out straight, the rest folded away — the ball is balanced on one
  // fingertip, so every other finger has to be out of the way for the point
  // of contact to read at all.
  hands: { right: { all: 0.85, Index: 0.02, Thumb: 0.6 } },
  prop: {
    kind: 'ball',
    // The last joint of the index finger: the fingertip itself, not the back
    // of the hand the ball was previously sitting on.
    bone: 'rightIndexDistal',
    offset: [0, 0.135, 0],
    // Tipped off vertical so the spin axis is visible rather than edge-on.
    rotation: [0.22, 0, 0.12],
    spin: [0, 15, 0],
  },
  overlay(t, _phase, bone, out) {
    // The hand hunts under the ball to keep it up.
    if (bone === 'rightHand') {
      out[0] = Math.sin(t * 5.5) * 0.03;
      out[2] = Math.cos(t * 4.1) * 0.03;
    }
    if (bone === 'rightLowerArm') out[0] = Math.sin(t * 5.5 + 0.8) * 0.015;
  },
};

export const ACTIONS: MicroAction[] = [CODER, SWORDSMAN, LSIT, BALL_SPIN];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type THREENamespace = typeof import('three');

/**
 * Built from primitives, in the page's own palette, so the props read as part
 * of the same illustration as the character rather than as imported models.
 */
function buildProp(THREE: THREENamespace, kind: PropKind): THREE_T.Object3D {
  const group = new THREE.Group();

  const shell = (color: number, emissive = 0x000000, emissiveIntensity = 0) =>
    new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity,
      roughness: 0.45,
      metalness: 0.15,
    });

  if (kind === 'laptop') {
    const body = shell(0x2a2140);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.21), body);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.012), body);
    // Hinged at the back edge of the base, tipped open toward the character.
    lid.position.set(0, 0.098, -0.104);
    lid.rotation.x = -0.28;

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.18),
      shell(0x1a1430, 0x8b5cf6, 1.4),
    );
    screen.position.z = 0.007;
    lid.add(screen);

    group.add(base, lid);
    return group;
  }

  if (kind === 'sword') {
    const steel = shell(0xd8d4e8, 0x6d4aff, 0.35);
    const dark = shell(0x241c3a);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.72, 0.011), steel);
    blade.position.y = 0.44;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.022, 0.026), dark);
    guard.position.y = 0.07;
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.017, 0.14, 8), dark);
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), steel);
    pommel.position.y = -0.08;

    group.add(blade, guard, grip, pommel);
    return group;
  }

  // Ball: the seams are what make a spin legible — a bare sphere just sits
  // there however fast it is turning.
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.112, 20, 16), shell(0xd8722e)));
  const seam = shell(0x1a1220);
  const ring = new THREE.TorusGeometry(0.112, 0.004, 6, 28);
  const equator = new THREE.Mesh(ring, seam);
  const meridianA = new THREE.Mesh(ring, seam);
  meridianA.rotation.y = Math.PI / 2;
  const meridianB = new THREE.Mesh(ring, seam);
  meridianB.rotation.x = Math.PI / 2;
  group.add(equator, meridianA, meridianB);
  return group;
}

// ---------------------------------------------------------------------------
// The director
// ---------------------------------------------------------------------------

export interface ActionFrame {
  action: MicroAction | null;
  /** 0 while the scene owns the body, 1 while the action fully owns it. */
  weight: number;
  /** Seconds since the action started. */
  t: number;
  /** Progress across blend-in plus hold, 0..1, used to stage overlays. */
  phase: number;
}

export interface ActionDirector {
  update(dt: number, allowed: boolean): ActionFrame;
  /** Starts an action now. Returns false if one is already running. */
  trigger(id?: string): boolean;
  /** Drops the current action and re-arms the timer — used on slide change. */
  interrupt(): void;
  dispose(): void;
}

interface DirectorOptions {
  THREE: THREENamespace;
  /**
   * The *raw* bone node, not the normalized one: props are parented into the
   * skinned hierarchy, and the normalized rig is a proxy that gets copied onto
   * it rather than the thing that actually gets drawn.
   */
  getBoneNode: (bone: string) => THREE_T.Object3D | null | undefined;
  random?: () => number;
}

type Stage = 'waiting' | 'in' | 'hold' | 'out';

export function createActionDirector(options: DirectorOptions): ActionDirector {
  const { THREE, getBoneNode } = options;
  const random = options.random ?? Math.random;

  const props = new Map<PropKind, THREE_T.Object3D>();
  const frame: ActionFrame = { action: null, weight: 0, t: 0, phase: 0 };

  let stage: Stage = 'waiting';
  let action: MicroAction | null = null;
  let sinceStage = 0;
  let sinceStart = 0;
  // The first one comes sooner than the steady-state gap: a visitor who never
  // sees one in their first few seconds has no reason to believe they exist.
  let wait = 3 + random() * 3;
  let lastId: string | null = null;

  function prop(kind: PropKind): THREE_T.Object3D {
    let object = props.get(kind);
    if (!object) {
      object = buildProp(THREE, kind);
      object.visible = false;
      props.set(kind, object);
    }
    return object;
  }

  function attachProp(next: MicroAction): void {
    if (!next.prop) return;
    const node = getBoneNode(next.prop.bone);
    if (!node) return;
    const object = prop(next.prop.kind);
    object.position.set(next.prop.offset[0], next.prop.offset[1], next.prop.offset[2]);
    const rotation = next.prop.rotation ?? [0, 0, 0];
    object.rotation.set(rotation[0], rotation[1], rotation[2]);
    object.scale.setScalar(0.001);
    object.visible = true;
    node.add(object);
  }

  function detachProp(previous: MicroAction | null): void {
    if (!previous?.prop) return;
    const object = props.get(previous.prop.kind);
    if (!object) return;
    object.visible = false;
    object.removeFromParent();
  }

  function pick(): MicroAction {
    // Never the same one twice running; with four actions, an immediate
    // repeat is what makes the loop obvious.
    const pool = ACTIONS.length > 1 ? ACTIONS.filter((entry) => entry.id !== lastId) : ACTIONS;
    return pool[Math.floor(random() * pool.length)] ?? ACTIONS[0];
  }

  function start(next: MicroAction): void {
    action = next;
    lastId = next.id;
    stage = 'in';
    sinceStage = 0;
    sinceStart = 0;
    attachProp(next);
  }

  function finish(): void {
    detachProp(action);
    action = null;
    stage = 'waiting';
    sinceStage = 0;
    wait = GAP_MIN + random() * (GAP_MAX - GAP_MIN);
  }

  return {
    update(dt, allowed) {
      sinceStage += dt;
      if (action) sinceStart += dt;

      // Anything with a stronger claim on the body — a motion clip, the click
      // reaction, a slide change — pushes a running action toward the door
      // rather than cutting it, so the hand-off still eases.
      if (!allowed && (stage === 'in' || stage === 'hold')) {
        stage = 'out';
        sinceStage = 0;
      }

      switch (stage) {
        case 'waiting':
          if (allowed && sinceStage >= wait) start(pick());
          break;
        case 'in':
          if (action && sinceStage >= action.blendIn) {
            stage = 'hold';
            sinceStage = 0;
          }
          break;
        case 'hold':
          if (action && sinceStage >= action.hold) {
            stage = 'out';
            sinceStage = 0;
          }
          break;
        case 'out':
          if (!action || sinceStage >= action.blendOut) finish();
          break;
      }

      let weight = 0;
      if (action) {
        if (stage === 'in') weight = smoothstep(sinceStage / action.blendIn);
        else if (stage === 'hold') weight = 1;
        else if (stage === 'out') weight = 1 - smoothstep(sinceStage / action.blendOut);
      }

      // The prop grows in and out with the action rather than popping, and a
      // spinning one keeps spinning for as long as it is out.
      if (action?.prop) {
        const object = props.get(action.prop.kind);
        if (object) {
          object.scale.setScalar(Math.max(0.001, smoothstep(weight)));
          const spin = action.prop.spin;
          if (spin) {
            object.rotation.x += spin[0] * dt;
            object.rotation.y += spin[1] * dt;
            object.rotation.z += spin[2] * dt;
          }
        }
      }

      frame.action = action;
      frame.weight = weight;
      frame.t = sinceStart;
      frame.phase = action ? clamp(sinceStart / (action.blendIn + action.hold), 0, 1) : 0;
      return frame;
    },

    trigger(id) {
      if (stage !== 'waiting') return false;
      const wanted = id ? ACTIONS.find((entry) => entry.id === id) : pick();
      if (!wanted) return false;
      start(wanted);
      return true;
    },

    interrupt() {
      if (stage === 'waiting') return;
      stage = 'out';
      sinceStage = 0;
    },

    dispose() {
      detachProp(action);
      props.forEach((object) => {
        object.removeFromParent();
        object.traverse((child) => {
          const mesh = child as THREE_T.Mesh;
          mesh.geometry?.dispose();
          const material = mesh.material as THREE_T.Material | THREE_T.Material[] | undefined;
          if (Array.isArray(material)) material.forEach((entry) => entry.dispose());
          else material?.dispose();
        });
      });
      props.clear();
      action = null;
      stage = 'waiting';
    },
  };
}

// ---------------------------------------------------------------------------
// Scroll reaction
// ---------------------------------------------------------------------------

/** Beyond this many pixels per second the lean is already at full tilt. */
const SCROLL_FULL_TILT = 2600;
/** Radians of forward lean at full tilt, spread across the spine. */
const LEAN_MAX = 0.42;

export interface ScrollLean {
  /** Signed lean, -1..1. Positive means diving down the page. */
  readonly value: number;
  update(dt: number): void;
  dispose(): void;
}

/**
 * Leans the body the way the page is moving. The deck scroll-snaps, so this
 * arrives in bursts rather than continuously: a hard shove of velocity, then
 * nothing. Tracking velocity rather than position is what makes the character
 * dive into the next section instead of drifting between two postures.
 */
export function createScrollLean(): ScrollLean {
  let pixels = 0;
  let lean = 0;

  // Wheel, and deliberately not the scroll event. The character only exists
  // on the deck, and the deck moves between slides by calling scrollIntoView
  // — so the scroll events that arrive there are the deck's own programmatic
  // jumps, including the snap back to the top, whose deltas are large and
  // point whichever way the layout happened to settle. Reading those had the
  // character leaning *backwards* out of a downward scroll. The wheel is the
  // visitor's actual gesture, which is what the lean is supposed to answer.
  const onWheel = (event: WheelEvent) => {
    // Accumulated here and turned into a rate in update(): input events do
    // not arrive on a clock, so dividing by their own spacing is very noisy.
    pixels += event.deltaY * 2.5;
  };

  window.addEventListener('wheel', onWheel, { passive: true });

  return {
    get value() {
      return lean;
    },
    update(dt) {
      const rate = dt > 0 ? pixels / dt : 0;
      pixels = 0;
      const target = clamp(rate / SCROLL_FULL_TILT, -1, 1);
      // Quick to commit to the dive, slow to come back up — the same
      // asymmetry a body has when it stops moving.
      const lambda = Math.abs(target) > Math.abs(lean) ? 9 : 3.2;
      lean += (target - lean) * (1 - Math.exp(-lambda * dt));
    },
    dispose() {
      window.removeEventListener('wheel', onWheel);
    },
  };
}

/** The lean contribution, in radians, for one bone at a signed lean value. */
export function leanFor(bone: BoneKey, lean: number): number {
  switch (bone) {
    case 'hips':
      return lean * LEAN_MAX * 0.35;
    case 'spine':
      return lean * LEAN_MAX * 0.5;
    case 'chest':
      return lean * LEAN_MAX * 0.65;
    case 'neck':
      return lean * LEAN_MAX * 0.4;
    case 'head':
      // The head resists the dive, so it keeps looking where it is going
      // rather than being carried face-first into the next section.
      return lean * LEAN_MAX * -0.22;
    case 'leftUpperLeg':
    case 'rightUpperLeg':
      // Legs trail behind the dive.
      return lean * LEAN_MAX * 0.3;
    case 'leftUpperArm':
    case 'rightUpperArm':
      return lean * LEAN_MAX * -0.3;
    default:
      return 0;
  }
}
