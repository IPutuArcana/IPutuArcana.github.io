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

const MODEL_URL = '/models/lionk.vrm';
/** Below this the deck has no room for a character beside the content. */
const MIN_VIEWPORT = 1100;
const PREF_KEY = 'lionk-visible';

/** The subset of the humanoid rig we animate. */
const BONES = [
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

type BoneKey = (typeof BONES)[number];
type Triple = readonly [number, number, number];
type Pose = Partial<Record<BoneKey, Triple>>;

/**
 * Arms rest at the sides. Every other pose is written as a delta from the VRM
 * rest pose (a T-pose), so this is the baseline the character returns to.
 */
const ARMS_DOWN: Pose = {
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
 * Feet counter-rotate against the sum of the leg joints to stay flat.
 */
const STAND_A: Pose = {
  ...ARMS_DOWN,
  hips: [0, 0, 0.038],
  spine: [0, 0.05, -0.022],
  chest: [-0.02, 0.04, -0.018],
  neck: [0.02, -0.03, 0.02],
  leftUpperLeg: [0.02, 0, -0.03],
  leftLowerLeg: [0.05, 0, 0],
  leftFoot: [-0.07, 0, 0],
  rightUpperLeg: [-0.14, 0, 0.09],
  rightLowerLeg: [0.28, 0, 0],
  rightFoot: [-0.14, 0, 0],
};

const STAND_B: Pose = {
  ...ARMS_DOWN,
  hips: [0, 0, -0.038],
  spine: [0, -0.04, 0.022],
  chest: [-0.02, -0.03, 0.018],
  neck: [0.02, 0.03, -0.02],
  rightUpperLeg: [0.02, 0, 0.03],
  rightLowerLeg: [0.05, 0, 0],
  rightFoot: [-0.07, 0, 0],
  leftUpperLeg: [-0.14, 0, -0.09],
  leftLowerLeg: [0.28, 0, 0],
  leftFoot: [-0.14, 0, 0],
};

/** How fast a scene drifts between its two pose keys, in radians per second. */
const SHIFT_SPEED = 0.78;

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
 * Played for a couple of seconds when the character is clicked. It carries no
 * camera of its own — a click should not yank the framing away from the slide.
 */
const GREET: Omit<Scene, 'cam'> = {
  pose: {
    ...STAND_A,
    leftUpperArm: [0, 0, -0.45],
    leftLowerArm: [0, 0, 1.3],
    rightUpperArm: [0, 0, 0.45],
    rightLowerArm: [0, 0, -1.3],
    head: [-0.1, 0, 0],
    chest: [-0.08, 0, 0],
  },
  poseB: {
    ...STAND_B,
    leftUpperArm: [0, 0, -0.32],
    leftLowerArm: [0, 0, 1.42],
    rightUpperArm: [0, 0, 0.32],
    rightLowerArm: [0, 0, -1.42],
    head: [-0.14, 0, 0],
    chest: [-0.11, 0, 0],
  },
  expression: 'happy',
  offsetX: 0,
  turn: 0,
};

const ZERO: Triple = [0, 0, 0];

/** Frame-rate independent exponential smoothing. */
function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

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

  const [THREE, { GLTFLoader }, { VRMLoaderPlugin, VRMUtils }] = await Promise.all([
    import('three'),
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('@pixiv/three-vrm'),
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

  const poseState = new Map<BoneKey, [number, number, number]>();
  BONES.forEach((bone) => poseState.set(bone, [0, 0, 0]));

  if (import.meta.env.DEV) {
    // Poses are authored by eye; this is the handle used to check them.
    (window as unknown as Record<string, unknown>).__lionk = { vrm, root, boneNodes };
  }

  let sceneIndex = 0;
  let current: Scene = SCENES[0];
  let reactionUntil = 0;
  let hopVelocity = 0;
  let hopHeight = 0;
  /** While `elapsed` is below this, poses snap rather than blend. */
  let snapUntil = 0;
  let popAmount = 0;
  let burstTimer = 0;

  // Pointer position in [-1, 1], smoothed toward the raw reading each frame.
  let pointerX = 0;
  let pointerY = 0;
  let aimX = 0;
  let aimY = 0;

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
    const breath = Math.sin(t * 1.55);
    const sway = Math.sin(t * 0.85);
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
      case 'neck':
        out[0] = -breath * 0.018;
        out[2] = sway * 0.02;
        break;
      case 'head':
        // The head leads the eyes toward the pointer.
        out[1] = aimX * 0.26;
        out[0] = -aimY * 0.16 + Math.sin(t * 0.6) * 0.015;
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
      case 'rightHand': {
        // The waving hand: during the hero scene and the greeting reaction.
        const waving = sceneIndex === 0 || t < reactionUntil;
        out[2] = (waving ? Math.sin(t * 7.5) * 0.42 : 0) + Math.sin(t * 1.9) * 0.05;
        break;
      }
      default:
        break;
    }
  }

  const idleBuffer: [number, number, number] = [0, 0, 0];

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

    reactionUntil = elapsed + 2.4;
    hopVelocity = 1.9;
  }

  function onDeckChange(event: Event): void {
    const detail = (event as CustomEvent<{ index?: number }>).detail;
    if (typeof detail?.index !== 'number') return;
    setScene(detail.index);

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

    const active = activeScene(elapsed);
    // Right after a slide change everything moves several times faster, so the
    // character lands in the new pose within a couple of frames.
    // 0..1 and back, forever: the weight shift that keeps a held pose alive.
    const shift = 0.5 - 0.5 * Math.cos(elapsed * SHIFT_SPEED);
    const snapping = elapsed < snapUntil;
    const placeRate = snapping ? 11 : 2.6;
    const poseRate = snapping ? 20 : 5;

    // Stage placement.
    root.position.x = damp(root.position.x, active.offsetX, placeRate, dt);
    root.rotation.y = damp(root.rotation.y, active.turn + aimX * 0.1, placeRate, dt);

    // The punch that lands with the pose, decaying back to normal size.
    popAmount = damp(popAmount, 0, 7, dt);
    root.scale.setScalar(1 + popAmount);

    // Greeting hop, under gravity.
    hopVelocity -= 9 * dt;
    hopHeight = Math.max(0, hopHeight + hopVelocity * dt);
    if (hopHeight === 0 && hopVelocity < 0) hopVelocity = 0;
    root.position.y = hopHeight + Math.sin(elapsed * 1.55) * 0.008;

    // Pose blend + idle layer.
    BONES.forEach((bone) => {
      const node = boneNodes.get(bone);
      const state = poseState.get(bone);
      if (!node || !state) return;
      const a = active.pose[bone] ?? ZERO;
      const b = active.poseB[bone] ?? a;
      state[0] = damp(state[0], a[0] + (b[0] - a[0]) * shift, poseRate, dt);
      state[1] = damp(state[1], a[1] + (b[1] - a[1]) * shift, poseRate, dt);
      state[2] = damp(state[2], a[2] + (b[2] - a[2]) * shift, poseRate, dt);
      idleFor(bone, elapsed, idleBuffer);
      node.rotation.set(
        state[0] + idleBuffer[0],
        state[1] + idleBuffer[1],
        state[2] + idleBuffer[2],
      );
    });

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
      ['happy', 'relaxed', 'sad', 'surprised'].forEach((name) => {
        // Held well below 1: at full weight the presets open the mouth wide,
        // which reads as a shout rather than an expression.
        const wanted = active.expression === name ? 0.4 : 0;
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

  renderer.setAnimationLoop(tick);
  stage.dataset.ready = 'true';
  document.documentElement.classList.add('lionk-on');

  runtime = {
    destroy() {
      renderer.setAnimationLoop(null);
      window.clearTimeout(burstTimer);
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
