// Lionk — the VRM character that shares the stage with the slide deck.
//
// Renders `public/models/lionk.vrm` into the fixed right-hand stage rendered by
// `src/components/Lionk.astro`, and wires it to the rest of the page:
//
//   * it watches the pointer and follows it with its eyes, head and neck;
//   * every deck slide gets its own scene — a pose, a facial expression, a
//     position on stage and a body angle — cross-faded on `deck:change`;
//   * clicking the character plays a short greeting reaction;
//   * idle breathing, weight shift and blinking run underneath everything.
//
// The model is ~15 MB, so nothing here is loaded eagerly: three.js and the VRM
// itself are dynamically imported only once we know the visitor is on a wide
// screen, is not asking for reduced motion, is not on a metered connection and
// has not switched the character off.

import type { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import type * as THREE_T from 'three';

import {
  type BoneKey,
  type FingerName,
  type HandSide,
  type Pose,
  type Triple,
  type TripleOut,
  BASE_OMEGA,
  BONES,
  BONE_LAG,
  FINGERS,
  FINGER_SEGMENTS,
  MAX_STEP,
  SHIFT_SPEED,
  STAND_A,
  STAND_B,
  ZERO,
  curlOf,
  damp,
  fingerRotation,
  weightShift,
} from './lionk-rig';

const MODEL_URL = '/models/lionk.vrm';
/**
 * Optional motion capture. If this manifest is present the character is driven
 * by real VRM Animation clips instead of the authored poses below; if it is
 * missing — which it is by default — nothing is requested and the procedural
 * rig runs exactly as before. See `public/models/motions/README.md`.
 *
 * Nothing ships with the site: the freely available .vrma packs forbid being
 * redistributed in a form that can be extracted, which is precisely what a
 * public static host does, so the files are the site owner's to supply.
 */
const MOTION_MANIFEST = '/models/motions/motions.json';
/** Below this the deck has no room for a character beside the content. */
const MIN_VIEWPORT = 1100;
const PREF_KEY = 'lionk-visible';

/** How long the click reaction's whip-spin takes to unwind, in seconds. */
const CLICK_SPIN_DURATION = 0.5;
/** Total time the click reaction (spin + landing hold) stays active. */
const CLICK_REACTION_HOLD = 1.7;

/**
 * Where the camera sits for a scene. A short lens far back reads as a calm
 * portrait; a very wide one pushed close gives the barrel-ish, foreshortened
 * look of a fisheye — it is real perspective rather than a lens distortion
 * shader, but at 80° and half a metre out it reads the same way.
 */
interface CameraRig {
  pos: Triple;
  look: Triple;
  /** Vertical field of view in degrees. Roughly 30 = portrait, 85 = fisheye. */
  fov: number;
  /** Dutch tilt in radians — the camera rolling off the horizontal. */
  roll: number;
}

interface Scene {
  pose: Pose;
  /** The scene's second key; the character drifts between the two forever. */
  poseB: Pose;
  /** VRM expression preset to hold while this scene is active. */
  expression: string | null;
  /** Stage position in metres; positive moves toward the right edge. */
  offsetX: number;
  /** Body angle in radians; negative turns the character toward the content. */
  turn: number;
  cam: CameraRig;
}

/**
 * One scene per deck slide, cycled if the deck ever grows. The character starts
 * front-on and waving, then turns progressively toward the content as the deck
 * moves through about / skills / projects, and opens up again at the contact
 * slide.
 */
const SCENES: Scene[] = [
  // Hero — waving hello, facing the visitor.
  {
    // Waving high, the other hand dropped to the hip.
    pose: {
      ...STAND_A,
      rightUpperArm: [0, 0, 0.4],
      rightLowerArm: [0, -0.15, -1.45],
      rightHand: [0, 0, -0.25],
      leftUpperArm: [0.1, 0, -1.05],
      leftLowerArm: [0, -0.85, -0.55],
      leftHand: [0, 0, 0.2],
      head: [0, -0.06, 0.07],
    },
    poseB: {
      ...STAND_B,
      rightUpperArm: [0, 0, 0.28],
      rightLowerArm: [0, -0.1, -1.56],
      rightHand: [0, 0, -0.18],
      leftUpperArm: [0.13, 0, -1.12],
      leftLowerArm: [0, -0.95, -0.5],
      leftHand: [0, 0, 0.24],
      head: [0.03, 0.04, 0.03],
    },
    expression: 'happy',
    offsetX: 0.04,
    turn: -0.16,
    // Low and wide, looking up: the shot a game gives its lead.
    cam: { pos: [0.48, 0.6, 2.05], look: [0, 1.16, 0], fov: 62, roll: -0.07 },
  },
  // About — relaxed, listening, turned toward the copy.
  {
    // One arm folded across the body, the other loose — listening.
    pose: {
      ...STAND_A,
      leftUpperArm: [0.12, 0, -1.02],
      leftLowerArm: [0, -1.15, -0.35],
      rightUpperArm: [0.06, 0, 1.18],
      rightLowerArm: [0, 0.6, 0.25],
      head: [0.05, 0.02, -0.1],
    },
    poseB: {
      ...STAND_B,
      leftUpperArm: [0.15, 0, -1.08],
      leftLowerArm: [0, -1.3, -0.26],
      rightUpperArm: [0.08, 0, 1.1],
      rightLowerArm: [0, 0.76, 0.32],
      head: [0.01, -0.05, -0.04],
    },
    expression: 'relaxed',
    offsetX: 0,
    turn: -0.34,
    // Long lens, high three-quarter — the deck's one calm frame.
    cam: { pos: [-0.6, 1.92, 2.55], look: [0, 1.04, 0], fov: 32, roll: 0.05 },
  },
  // Skills — hand near the chin, thinking it over.
  {
    // Hand at the chin, the other arm tucked under it, tapping as it thinks.
    pose: {
      ...STAND_A,
      rightUpperArm: [0.15, 0, 0.92],
      rightLowerArm: [0, -0.45, -1.9],
      rightHand: [0.2, 0, -0.3],
      leftUpperArm: [0.12, 0, -1.15],
      leftLowerArm: [0, -1.25, -0.3],
      head: [0.07, 0.06, 0.09],
    },
    poseB: {
      ...STAND_B,
      rightUpperArm: [0.18, 0, 0.86],
      rightLowerArm: [0, -0.33, -2.02],
      rightHand: [0.38, 0, -0.24],
      leftUpperArm: [0.14, 0, -1.18],
      leftLowerArm: [0, -1.35, -0.24],
      head: [0.02, -0.05, 0.12],
    },
    expression: null,
    offsetX: 0,
    turn: -0.28,
    // Right up against the face, lens wide open and tilted hard over.
    cam: { pos: [0.32, 1.44, 0.66], look: [0, 1.33, 0], fov: 76, roll: -0.15 },
  },
  // Projects — presenting the work to its left, where the cards are.
  {
    // Presenting the work, torso opened toward it, gesture sweeping.
    pose: {
      ...STAND_A,
      rightUpperArm: [0, 0.6, 0.62],
      rightLowerArm: [0, 0.45, -0.2],
      rightHand: [0, 0.25, 0],
      leftUpperArm: [0.1, 0, -1.08],
      leftLowerArm: [0, -0.7, -0.4],
      spine: [0, -0.12, -0.02],
      chest: [-0.05, -0.1, -0.02],
      head: [0, -0.14, 0.02],
    },
    poseB: {
      ...STAND_B,
      rightUpperArm: [0, 0.74, 0.44],
      rightLowerArm: [0, 0.34, -0.36],
      rightHand: [0, 0.32, 0],
      leftUpperArm: [0.13, 0, -1.12],
      leftLowerArm: [0, -0.8, -0.34],
      spine: [0, -0.18, 0.02],
      chest: [-0.03, -0.14, 0.02],
      head: [0.03, -0.19, 0.05],
    },
    expression: 'happy',
    offsetX: 0.05,
    turn: -0.44,
    // Worm's eye from below, very wide — the character towers over the frame.
    cam: { pos: [-0.7, 0.3, 1.45], look: [0.04, 1.22, 0], fov: 84, roll: 0.13 },
  },
  // Contact — both arms open, welcoming.
  {
    // Both arms open, leaning in slightly — the sign-off.
    pose: {
      ...STAND_A,
      leftUpperArm: [0, -0.35, -0.88],
      leftLowerArm: [0, -0.95, -0.22],
      leftHand: [0, 0, 0.15],
      rightUpperArm: [0, 0.35, 0.88],
      rightLowerArm: [0, 0.95, 0.22],
      rightHand: [0, 0, -0.15],
      chest: [-0.07, 0, 0],
      head: [-0.05, 0.03, 0.02],
    },
    poseB: {
      ...STAND_B,
      leftUpperArm: [0, -0.26, -0.74],
      leftLowerArm: [0, -1.05, -0.16],
      leftHand: [0, 0, 0.22],
      rightUpperArm: [0, 0.26, 0.74],
      rightLowerArm: [0, 1.05, 0.16],
      rightHand: [0, 0, -0.22],
      chest: [-0.03, 0, 0],
      head: [-0.01, -0.03, -0.02],
    },
    expression: 'happy',
    offsetX: 0,
    turn: -0.1,
    // All the way back for the sign-off, the whole figure in frame.
    cam: { pos: [0, 1.05, 3.85], look: [0, 1.0, 0], fov: 30, roll: -0.04 },
  },
];

/**
 * Landed in after the click reaction's whip-spin (the spin itself is applied
 * in the tick loop, on top of `turn`, not here) — fist pumped overhead, other
 * hand on the hip. Carries no camera of its own — a click should not yank the
 * framing away from the slide.
 */
const GREET: Omit<Scene, 'cam'> = {
  pose: {
    ...STAND_A,
    rightUpperArm: [0, 0, -1.12],
    rightLowerArm: [0, 0, -0.16],
    rightHand: [0.1, 0, -0.1],
    leftUpperArm: [0.1, 0, -1.05],
    leftLowerArm: [0, -0.95, -0.28],
    leftHand: [0, 0, 0.15],
    head: [-0.14, 0.08, 0.02],
    chest: [-0.1, 0.03, 0],
    spine: [0, -0.04, 0.015],
  },
  poseB: {
    ...STAND_B,
    rightUpperArm: [0, 0, -1.2],
    rightLowerArm: [0, 0, -0.24],
    rightHand: [0.12, 0, -0.14],
    leftUpperArm: [0.13, 0, -1.12],
    leftLowerArm: [0, -1.05, -0.22],
    leftHand: [0, 0, 0.2],
    head: [-0.18, 0.04, -0.02],
    chest: [-0.13, 0, 0],
    spine: [0, -0.02, -0.015],
  },
  expression: 'happy',
  offsetX: 0,
  turn: 0,
};

interface Runtime {
  destroy: () => void;
}

let runtime: Runtime | null = null;
let booting = false;

function prefersHidden(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === 'off';
  } catch {
    return false;
  }
}

function shouldLoad(): boolean {
  if (prefersHidden()) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.innerWidth < MIN_VIEWPORT) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return false;
  return true;
}

async function start(stage: HTMLElement): Promise<void> {
  const canvas = stage.querySelector<HTMLCanvasElement>('[data-lionk-canvas]');
  const status = stage.querySelector<HTMLElement>('[data-lionk-status]');
  if (!canvas) return;

  const setStatus = (text: string | null) => {
    if (!status) return;
    status.textContent = text ?? '';
    status.hidden = text === null;
  };

  setStatus('0%');

  const [THREE, { GLTFLoader }, { VRMLoaderPlugin, VRMUtils }, actions] = await Promise.all([
    import('three'),
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('@pixiv/three-vrm'),
    // Pure pose data and primitives — next to nothing beside the 15 MB model,
    // and it has to be here before the first frame or the director's own
    // opening timer would start against a runtime that cannot answer it.
    import('./lionk-actions'),
  ]);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  const scene = new THREE.Scene();
  const opening = SCENES[0].cam;
  const camera = new THREE.PerspectiveCamera(opening.fov, 1, 0.05, 30);

  // The live rig, eased toward whichever scene is active. Seeded from the
  // first scene so the deck opens already framed instead of swinging in.
  const camPos = new THREE.Vector3(...opening.pos);
  const camLook = new THREE.Vector3(...opening.look);
  let camFov = opening.fov;
  let camRoll = opening.roll;

  // MToon shades from real lights, so the character picks up the page's mood:
  // a warm key from the content side, a cool violet rim from behind.
  const key = new THREE.DirectionalLight(0xfff3e2, 2.6);
  key.position.set(-1.4, 2.2, 2.4);
  const rim = new THREE.DirectionalLight(0xa98cff, 1.5);
  rim.position.set(1.8, 1.4, -2.2);
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 1.05));

  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  let gltf: Awaited<ReturnType<typeof loader.loadAsync>>;
  try {
    gltf = await loader.loadAsync(MODEL_URL, (event) => {
      if (!event.lengthComputable) return;
      setStatus(`${Math.round((event.loaded / event.total) * 100)}%`);
    });
  } catch (error) {
    console.warn('[lionk] model failed to load', error);
    setStatus(null);
    renderer.dispose();
    return;
  }

  const vrm = gltf.userData.vrm as VRM | undefined;
  if (!vrm) {
    setStatus(null);
    renderer.dispose();
    return;
  }

  setStatus(null);

  // VRM 0.x models face -Z; this turns them around (and no-ops on VRM 1.0).
  VRMUtils.rotateVRM0(vrm);
  VRMUtils.combineSkeletons(vrm.scene);
  VRMUtils.removeUnnecessaryVertices(vrm.scene);
  // Once bones move, the frustum bounds three computes for the skinned meshes
  // stop matching what is drawn, and culling starts eating limbs.
  vrm.scene.traverse((object) => {
    object.frustumCulled = false;
  });

  const root = new THREE.Group();
  root.add(vrm.scene);
  scene.add(root);

  const lookTarget = new THREE.Object3D();
  lookTarget.position.set(0, 1.45, 3.0);
  scene.add(lookTarget);
  if (vrm.lookAt) vrm.lookAt.target = lookTarget;

  const boneNodes = new Map<BoneKey, THREE_T.Object3D>();
  BONES.forEach((bone) => {
    const node = vrm.humanoid?.getNormalizedBoneNode(bone as VRMHumanBoneName);
    if (node) boneNodes.set(bone, node);
  });

  // Per bone: three angles followed by their three angular velocities. The
  // velocity is what buys follow-through — an exponential ease can only creep
  // up on its target, while a spring carries past it and settles back.
  const poseState = new Map<BoneKey, Float32Array>();
  BONES.forEach((bone) => poseState.set(bone, new Float32Array(6)));

  // Finger joints, resolved once. They are driven straight rather than
  // through the spring solver: a finger closing is fast and short, and the
  // lag that reads as weight in an arm just reads as lag in a hand.
  interface FingerJoint {
    node: THREE_T.Object3D;
    side: HandSide;
    finger: FingerName;
    segment: string;
    /** Current curl, damped toward the wanted one so grips are not instant. */
    curl: number;
    /** Phase offset, so no two fingers drift on the same beat. */
    phase: number;
  }
  const fingerJoints: FingerJoint[] = [];
  (['left', 'right'] as const).forEach((side) => {
    FINGERS.forEach((finger) => {
      FINGER_SEGMENTS[finger].forEach((segment) => {
        const node = vrm.humanoid?.getNormalizedBoneNode(
          `${side}${finger}${segment}` as VRMHumanBoneName,
        );
        if (node) {
          const phase = FINGERS.indexOf(finger) * 1.19 + (side === 'left' ? 0 : 2.7);
          fingerJoints.push({ node, side, finger, segment, curl: 0, phase });
        }
      });
    });
  });

  // The idle repertoire. Props are parented into the *raw* skinned hierarchy
  // rather than the normalized rig, which is only a proxy that gets copied
  // onto the raw bones — a laptop hung off a normalized node would sit in the
  // wrong place and not move with the mesh.
  const director = actions.createActionDirector({
    THREE,
    getBoneNode: (bone) => vrm.humanoid?.getRawBoneNode(bone as VRMHumanBoneName),
  });
  const scrollLean = actions.createScrollLean();

  if (import.meta.env.DEV) {
    // Poses are authored by eye; this is the handle used to check them.
    // `play('swordsman')` beats waiting out a random gap to see one.
    (window as unknown as Record<string, unknown>).__lionk = {
      vrm,
      root,
      boneNodes,
      play: (id?: string) => director.trigger(id),
      lean: () => scrollLean.value,
    };
  }

  let sceneIndex = 0;
  let current: Scene = SCENES[0];
  let reactionUntil = 0;
  let hopVelocity = 0;
  let hopHeight = 0;
  let spinStart = 0;
  let spinUntil = 0;
  // The body's facing, damped on its own — kept separate from
  // root.rotation.y so the spin offset added at render time never gets fed
  // back in as if it were the character's actual facing.
  let bodyYaw = 0;
  /** While `elapsed` is below this, poses snap rather than blend. */
  let snapUntil = 0;
  let popAmount = 0;
  let burstTimer = 0;

  let mixer: THREE_T.AnimationMixer | null = null;
  // Set by destroy() so an in-flight loadMotions() (mid-fetch, mid-import, or
  // mid-clip-load when destroy() lands) can bail instead of building a mixer
  // on top of a vrm.scene that deepDispose already tore down.
  let destroyed = false;
  let sceneActions: (THREE_T.AnimationAction | null)[] = [];
  let greetAction: THREE_T.AnimationAction | null = null;
  let currentAction: THREE_T.AnimationAction | null = null;

  /**
   * Loads whatever clips the manifest lists. A missing manifest, a missing
   * file, or a file with no usable animation in it all resolve to "no motion
   * for that slide" and the procedural rig covers it — so a partly filled
   * motions folder is a supported state, not a broken one.
   */
  async function loadMotions(): Promise<void> {
    let manifest: { scenes?: (string | null)[]; greet?: string | null };
    try {
      const response = await fetch(MOTION_MANIFEST);
      if (!response.ok) return;
      manifest = await response.json();
    } catch {
      // No manifest is the normal case; the site ships without motion files.
      return;
    }
    // The character can be torn down (toggled off, or navigated away from)
    // while that fetch was in flight — bail before touching vrm.scene, which
    // destroy() may have already disposed.
    if (destroyed) return;

    // An empty manifest is how the site ships. Bail before pulling in the
    // animation runtime, so an unused chunk is never downloaded.
    const listed = [...(manifest.scenes ?? []), manifest.greet].filter(Boolean);
    if (listed.length === 0) return;

    const { VRMAnimationLoaderPlugin, createVRMAnimationClip } = await import(
      '@pixiv/three-vrm-animation'
    );
    if (destroyed) return;

    const motionLoader = new GLTFLoader();
    motionLoader.register((parser) => new VRMAnimationLoaderPlugin(parser));
    mixer = new THREE.AnimationMixer(vrm!.scene);

    const toAction = async (file: string | null | undefined) => {
      if (!file) return null;
      try {
        const gltf = await motionLoader.loadAsync(`/models/motions/${file}`);
        // Same story: destroy() may have landed during this network wait.
        // mixer is null by then, so clipAction would throw on a null deref.
        if (destroyed) return null;
        const animation = gltf.userData.vrmAnimations?.[0];
        if (!animation) return null;
        return mixer!.clipAction(createVRMAnimationClip(animation, vrm!));
      } catch (error) {
        console.warn(`[lionk] motion "${file}" could not be loaded`, error);
        return null;
      }
    };

    sceneActions = await Promise.all((manifest.scenes ?? []).map(toAction));
    if (destroyed) return;

    greetAction = await toAction(manifest.greet);
    if (destroyed) return;
    if (greetAction) {
      greetAction.setLoop(THREE.LoopOnce, 1);
      greetAction.clampWhenFinished = true;
      // When the greeting finishes, hand the body back to the slide's clip.
      mixer.addEventListener('finished', () => playMotion(sceneIndex));
    }

    playMotion(sceneIndex);
  }

  /** Cross-fades to a clip, or to nothing — which returns the body to the rig. */
  function playMotion(index: number, action = sceneActions[index] ?? null): void {
    if (!mixer || action === currentAction) return;

    if (action) {
      action.reset().setEffectiveWeight(1).fadeIn(currentAction ? 0.35 : 0.7).play();
    }
    currentAction?.fadeOut(0.35);
    currentAction = action;
  }

  // Pointer position in [-1, 1], smoothed toward the raw reading each frame.
  let pointerX = 0;
  let pointerY = 0;
  let aimX = 0;
  let aimY = 0;
  /** The same aim, deliberately lagged, so the head trails the eyes. */
  let headAimX = 0;
  let headAimY = 0;

  let blinkNext = 1.5;
  let blinkPhase = -1;

  let lastFrame = performance.now() / 1000;
  let elapsed = 0;

  function activeScene(now: number): Omit<Scene, 'cam'> {
    return now < reactionUntil ? GREET : current;
  }

  function setScene(index: number): void {
    sceneIndex = index;
    current = SCENES[index % SCENES.length];
  }

  /** Breathing, weight shift and arm sway, layered on top of the posed values. */
  function idleFor(bone: BoneKey, t: number, out: [number, number, number]): void {
    // Breathing in is quicker than breathing out. Warping the phase of the
    // sine gives that asymmetry without the kink a piecewise curve would have.
    const breath = Math.sin(t * 1.45 + 0.4 * Math.sin(t * 1.45));
    // Two slow waves that never line up, so the idle never audibly loops.
    const sway = Math.sin(t * 0.83) * 0.62 + Math.sin(t * 0.37) * 0.38;
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;

    switch (bone) {
      case 'chest':
        out[0] = breath * 0.028;
        break;
      case 'spine':
        out[2] = sway * 0.022;
        out[0] = breath * 0.012;
        break;
      case 'head':
        // The eyes get there first and the head follows — `headAim` trails the
        // pointer well behind the look-at target. Leading with the head is one
        // of the tells that a character is being driven by a cursor.
        out[1] = headAimX * 0.3;
        out[0] = -headAimY * 0.18 + Math.sin(t * 0.6) * 0.015;
        out[2] = headAimX * 0.06 + sway * 0.012;
        break;
      case 'neck':
        out[0] = -breath * 0.018;
        out[1] = headAimX * 0.12;
        out[2] = sway * 0.02;
        break;
      case 'leftUpperArm':
        out[2] = -sway * 0.035;
        break;
      case 'rightUpperArm':
        out[2] = sway * 0.035;
        break;
      case 'leftHand':
        out[2] = Math.sin(t * 1.9) * 0.05;
        break;
      // Nothing is holding the legs up, so they trail the float rather than
      // hanging from it — slowly, out of phase with each other and with the
      // breath, so the pair never looks like one hinged object.
      case 'leftUpperLeg':
        out[0] = Math.sin(t * 0.61) * 0.055;
        out[2] = Math.sin(t * 0.44 + 0.9) * 0.04;
        break;
      case 'rightUpperLeg':
        out[0] = Math.sin(t * 0.53 + 2.2) * 0.055;
        out[2] = Math.sin(t * 0.47 + 3.1) * 0.04;
        break;
      case 'leftLowerLeg':
        out[0] = Math.sin(t * 0.61 - 0.5) * 0.07;
        break;
      case 'rightLowerLeg':
        out[0] = Math.sin(t * 0.53 + 1.6) * 0.07;
        break;
      case 'leftFoot':
        out[0] = Math.sin(t * 0.7 + 1.1) * 0.09;
        break;
      case 'rightFoot':
        out[0] = Math.sin(t * 0.66 + 2.7) * 0.09;
        break;
      case 'rightHand': {
        // The waving hand: hero scene only, and not during the click
        // reaction — that now drives its own gesture (a fist pump), which a
        // wave shake layered on top would just blur.
        const waving = sceneIndex === 0 && t >= reactionUntil;
        out[2] = (waving ? Math.sin(t * 7.5) * 0.42 : 0) + Math.sin(t * 1.9) * 0.05;
        break;
      }
      default:
        break;
    }
  }

  const idleBuffer: TripleOut = [0, 0, 0];
  const overlayBuffer: TripleOut = [0, 0, 0];
  const fingerBuffer: TripleOut = [0, 0, 0];

  function resize(): void {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resize();

  function onPointerMove(event: PointerEvent): void {
    pointerX = (event.clientX / window.innerWidth) * 2 - 1;
    pointerY = 1 - (event.clientY / window.innerHeight) * 2;
  }

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function onPointerDown(event: PointerEvent): void {
    const rect = canvas!.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      return;
    }
    ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.intersectObject(root, true).length === 0) return;

    spinStart = elapsed;
    spinUntil = elapsed + CLICK_SPIN_DURATION;
    reactionUntil = elapsed + CLICK_REACTION_HOLD;
    hopVelocity = 2.2;
    popAmount = 0.05;
    if (greetAction) playMotion(sceneIndex, greetAction);
  }

  function onDeckChange(event: Event): void {
    const detail = (event as CustomEvent<{ index?: number }>).detail;
    if (typeof detail?.index !== 'number') return;
    setScene(detail.index);
    playMotion(detail.index);
    // The slide is the louder statement; an action mid-play bows out of it
    // rather than being cut, and the gap is re-rolled from here.
    director.interrupt();

    // A game menu snaps its character into the new pose and punches the frame;
    // it does not glide. The window below is what the tick loop reads to swap
    // its smoothing for something much sharper.
    snapUntil = elapsed + 0.42;
    popAmount = 0.08;

    window.clearTimeout(burstTimer);
    stage.classList.remove('is-burst');
    void stage.offsetWidth;
    stage.classList.add('is-burst');
    burstTimer = window.setTimeout(() => stage.classList.remove('is-burst'), 720);
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  document.addEventListener('deck:change', onDeckChange);

  function tick(): void {
    const now = performance.now() / 1000;
    const dt = Math.min(now - lastFrame, 0.05);
    lastFrame = now;
    elapsed += dt;

    aimX = damp(aimX, pointerX, 4, dt);
    aimY = damp(aimY, pointerY, 4, dt);
    headAimX = damp(headAimX, aimX, 1.7, dt);
    headAimY = damp(headAimY, aimY, 1.7, dt);

    const active = activeScene(elapsed);
    // Right after a slide change everything moves several times faster, so the
    // character lands in the new pose within a couple of frames.
    const snapping = elapsed < snapUntil;
    const placeRate = snapping ? 11 : 2.6;

    // A clip, when there is one, owns the whole humanoid — so it is resolved
    // before anything below asks whether it may move the body.
    mixer?.update(dt);
    const motionDriven = currentAction !== null;

    scrollLean.update(dt);

    // The idle repertoire only gets the body when nothing louder wants it: no
    // motion clip, no click reaction, and not mid-snap into a new slide.
    const idleFree = !motionDriven && elapsed >= reactionUntil && !snapping;
    const beat = director.update(dt, idleFree);
    const actionPose = beat.action;
    const actionWeight = beat.weight;

    // Stage placement.
    root.position.x = damp(root.position.x, active.offsetX, placeRate, dt);

    // The click reaction's whip-spin: an extra turn that eases from a full
    // 2π down to 0, ease-out, riding on top of wherever the body is already
    // facing. At 2π the offset is a no-op, so it starts invisibly and spins
    // the body through exactly one turn as it unwinds.
    const spinT =
      spinUntil > 0 ? Math.min(1, Math.max(0, (elapsed - spinStart) / CLICK_SPIN_DURATION)) : 1;
    const spinEase = 1 - (1 - spinT) ** 3;
    const spinOffset = (1 - spinEase) * Math.PI * 2;

    // An action with a turn of its own takes the body around with it, eased
    // on the same weight as its pose, and hands the angle back on the way out.
    let wantedTurn = active.turn;
    if (beat.action?.turn !== undefined) {
      wantedTurn += (beat.action.turn - wantedTurn) * beat.weight;
    }
    bodyYaw = damp(bodyYaw, wantedTurn + aimX * 0.1, placeRate, dt);
    root.rotation.y = bodyYaw + spinOffset;

    // The punch that lands with the pose, decaying back to normal size.
    popAmount = damp(popAmount, 0, 7, dt);
    root.scale.setScalar(1 + popAmount);

    // Greeting hop, under gravity.
    hopVelocity -= 9 * dt;
    hopHeight = Math.max(0, hopHeight + hopVelocity * dt);
    if (hopHeight === 0 && hopVelocity < 0) hopVelocity = 0;
    root.position.y = hopHeight + Math.sin(elapsed * 1.55) * 0.008;

    // A real clip, when there is one, owns the whole humanoid — the authored
    // rig would only fight it. Everything else on this character (camera,
    // stage placement, eye tracking, blinking) keeps running either way.
    // Pose springs + idle layer.
    const steps = Math.max(1, Math.ceil(dt / MAX_STEP));
    const h = dt / steps;

    BONES.forEach((bone) => {
      if (motionDriven) return;
      const node = boneNodes.get(bone);
      const state = poseState.get(bone);
      if (!node || !state) return;

      const a = active.pose[bone] ?? ZERO;
      const b = active.poseB[bone] ?? a;
      const lag = BONE_LAG[bone];

      // The weight shift itself travels outward through the body rather than
      // happening everywhere at once, so the hips commit before the head does.
      const blend = weightShift(elapsed * SHIFT_SPEED - (1 - lag) * 0.6);

      // Extremities are left looser than the core: a hand keeps swinging after
      // the shoulder has stopped, which is the whole point of follow-through.
      const omega = BASE_OMEGA * lag * (snapping ? 2.4 : 1);
      const zeta = lag > 0.9 ? 0.85 : 0.54;
      const k = omega * omega;
      const c = 2 * zeta * omega;

      // The cross-fade. Blending the pose *targets* rather than the finished
      // bone rotations is what keeps the springs' overlapping action through
      // the transition: the body is still chasing one moving target with the
      // hips leading and the hands trailing, it is just that the target walks
      // from the slide's pose over to the action's and back.
      const actionA = actionPose?.pose[bone] ?? ZERO;
      const actionB = actionPose?.poseB?.[bone] ?? actionA;

      for (let axis = 0; axis < 3; axis += 1) {
        let target = a[axis] + (b[axis] - a[axis]) * blend;
        if (actionPose && actionWeight > 0) {
          const wanted = actionA[axis] + (actionB[axis] - actionA[axis]) * blend;
          target += (wanted - target) * actionWeight;
        }
        let x = state[axis];
        let v = state[axis + 3];
        for (let step = 0; step < steps; step += 1) {
          v += (k * (target - x) - c * v) * h;
          x += v * h;
        }
        state[axis] = x;
        state[axis + 3] = v;
      }

      // Additive layers, in order of who yields to whom. The idle sway is
      // pulled down while an action runs — a wave layered onto a sword swing
      // reads as two animations fighting — but never all the way out, since
      // the breathing under it is what keeps the body alive mid-hold.
      idleFor(bone, elapsed, idleBuffer);
      const idleDamp = 1 - 0.8 * actionWeight;

      overlayBuffer[0] = 0;
      overlayBuffer[1] = 0;
      overlayBuffer[2] = 0;
      if (actionPose?.overlay && actionWeight > 0) {
        actionPose.overlay(beat.t, beat.phase, bone, overlayBuffer);
      }

      const lean = actions.leanFor(bone, scrollLean.value);

      node.rotation.set(
        state[0] + idleBuffer[0] * idleDamp + overlayBuffer[0] * actionWeight + lean,
        state[1] + idleBuffer[1] * idleDamp + overlayBuffer[1] * actionWeight,
        state[2] + idleBuffer[2] * idleDamp + overlayBuffer[2] * actionWeight,
      );
    });

    // Fingers. A clip owns them like everything else; otherwise they take the
    // action's grip if it asked for one and fall back to the resting curve.
    if (!motionDriven) {
      const wantedHands = actionPose?.hands;
      fingerJoints.forEach((joint) => {
        const asked = joint.side === 'left' ? wantedHands?.left : wantedHands?.right;
        const resting = curlOf(undefined, joint.finger);
        const wanted = asked
          ? resting + (curlOf(asked, joint.finger) - resting) * actionWeight
          : resting;
        joint.curl = damp(joint.curl, wanted, 12, dt);
        // A live hand is never quite still, and it never moves as one piece.
        // Each finger drifts on its own slow beat — small enough not to read
        // as an animation, large enough that the hand stops being a prop.
        const drift = Math.sin(elapsed * 0.9 + joint.phase) * 0.035;
        fingerRotation(
          joint.side,
          joint.finger,
          joint.segment,
          joint.curl + drift,
          fingerBuffer,
        );
        joint.node.rotation.set(fingerBuffer[0], fingerBuffer[1], fingerBuffer[2]);
      });
    }

    // Camera rig. `placeRate` is the same snap the pose uses, so the framing
    // lands with the pose rather than drifting in behind it.
    const rig = current.cam;
    camPos.x = damp(camPos.x, rig.pos[0], placeRate, dt);
    camPos.y = damp(camPos.y, rig.pos[1], placeRate, dt);
    camPos.z = damp(camPos.z, rig.pos[2], placeRate, dt);
    camLook.x = damp(camLook.x, rig.look[0], placeRate, dt);
    camLook.y = damp(camLook.y, rig.look[1], placeRate, dt);
    camLook.z = damp(camLook.z, rig.look[2], placeRate, dt);
    camRoll = damp(camRoll, rig.roll, placeRate, dt);

    const nextFov = damp(camFov, rig.fov, placeRate, dt);
    if (Math.abs(nextFov - camFov) > 0.002) {
      camFov = nextFov;
      camera.fov = camFov;
      camera.updateProjectionMatrix();
    }

    // A slow drift keeps even the held frames from looking like a still.
    camera.position.set(
      camPos.x + Math.sin(elapsed * 0.31) * 0.035,
      camPos.y + Math.sin(elapsed * 0.24) * 0.025,
      camPos.z,
    );
    camera.lookAt(camLook);
    // Applied after the aim, so it rolls the frame rather than swinging it.
    camera.rotateZ(camRoll);

    // Eyes track the pointer, and the pointer stands in for the viewer — so
    // the target rides just in front of wherever the camera has moved to.
    lookTarget.position.set(
      camPos.x + aimX * 0.9,
      camPos.y + 0.12 + aimY * 0.45,
      camPos.z + 0.35,
    );

    // Expressions: hold the scene's mood, and blink on top of it.
    const expressions = vrm!.expressionManager;
    if (expressions) {
      // A clip may animate the face itself, so the scene's mood is only held
      // when the procedural rig is driving. Blinking stays on regardless —
      // motion clips almost never carry it, and a character that never blinks
      // reads as dead.
      if (!motionDriven) ['happy', 'relaxed', 'sad', 'surprised'].forEach((name) => {
        // Held well below 1: at full weight the presets open the mouth wide,
        // which reads as a shout rather than an expression.
        const fromScene = active.expression === name ? 0.4 : 0;
        // The face cross-fades on the same weight as the body, so an action
        // that drops the smile does it over the same beat as the pose.
        const wanted = actionPose
          ? fromScene + ((actionPose.expression === name ? 0.4 : 0) - fromScene) * actionWeight
          : fromScene;
        expressions.setValue(name, damp(expressions.getValue(name) ?? 0, wanted, 3, dt));
      });

      if (blinkPhase < 0) {
        blinkNext -= dt;
        if (blinkNext <= 0) blinkPhase = 0;
      } else {
        blinkPhase += dt / 0.12;
        if (blinkPhase >= 1) {
          blinkPhase = -1;
          blinkNext = 2 + Math.random() * 4;
        }
      }
      expressions.setValue('blink', blinkPhase < 0 ? 0 : Math.sin(blinkPhase * Math.PI));
    }

    camera.updateMatrixWorld(true);
    vrm!.update(dt);
    renderer.render(scene, camera);
  }

  // Fired off rather than awaited: the character should be on screen and
  // moving immediately, and clips swap in the moment they arrive.
  void loadMotions().catch((error) => console.warn('[lionk] motions skipped', error));

  renderer.setAnimationLoop(tick);
  stage.dataset.ready = 'true';
  document.documentElement.classList.add('lionk-on');

  runtime = {
    destroy() {
      destroyed = true;
      renderer.setAnimationLoop(null);
      director.dispose();
      scrollLean.dispose();
      window.clearTimeout(burstTimer);
      mixer?.stopAllAction();
      mixer = null;
      stage.classList.remove('is-burst');
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('deck:change', onDeckChange);
      VRMUtils.deepDispose(vrm.scene);
      renderer.dispose();
      document.documentElement.classList.remove('lionk-on');
      delete stage.dataset.ready;
    },
  };
}

function teardown(): void {
  runtime?.destroy();
  runtime = null;
}

function boot(): void {
  const stage = document.querySelector<HTMLElement>('[data-lionk]');
  if (!stage) {
    teardown();
    return;
  }
  if (runtime || booting) return;

  wireToggle(stage);
  if (!shouldLoad()) return;

  booting = true;
  start(stage)
    .catch((error) => console.warn('[lionk] failed to start', error))
    .finally(() => {
      booting = false;
    });
}

/**
 * The character can be switched off — 15 MB and a full-height figure beside the
 * text is not what everybody wants. The choice is remembered.
 */
function wireToggle(stage: HTMLElement): void {
  const toggle = stage.querySelector<HTMLButtonElement>('[data-lionk-toggle]');
  if (!toggle || toggle.dataset.wired === 'true') return;
  toggle.dataset.wired = 'true';
  toggle.hidden = false;

  const sync = () => {
    const on = !prefersHidden();
    toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    toggle.setAttribute('aria-label', on ? 'Hide the 3D character' : 'Show the 3D character');
    stage.dataset.off = on ? 'false' : 'true';
  };

  toggle.addEventListener('click', () => {
    const turningOff = !prefersHidden();
    try {
      localStorage.setItem(PREF_KEY, turningOff ? 'off' : 'on');
    } catch {
      /* storage can be unavailable; the toggle still works for this page */
    }
    sync();
    if (turningOff) teardown();
    else boot();
  });

  sync();
}

document.addEventListener('astro:page-load', boot);
document.addEventListener('astro:before-swap', teardown);

if (document.readyState !== 'loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
