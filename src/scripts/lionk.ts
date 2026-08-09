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
  'spine',
  'chest',
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

interface Scene {
  pose: Pose;
  /** VRM expression preset to hold while this scene is active. */
  expression: string | null;
  /** Stage position in metres; positive moves toward the right edge. */
  offsetX: number;
  /** Body angle in radians; negative turns the character toward the content. */
  turn: number;
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
    pose: {
      ...ARMS_DOWN,
      rightUpperArm: [0, 0, 0.5],
      rightLowerArm: [0, 0, -1.35],
      rightHand: [0, 0, -0.2],
      head: [0, 0, 0.04],
    },
    expression: 'happy',
    offsetX: 0.06,
    turn: -0.16,
  },
  // About — relaxed, listening, turned toward the copy.
  {
    pose: {
      ...ARMS_DOWN,
      leftUpperArm: [0.1, 0, -1.05],
      leftLowerArm: [0, -0.55, -0.35],
      spine: [0, -0.06, 0],
      head: [0.03, 0, -0.05],
    },
    expression: 'relaxed',
    offsetX: 0,
    turn: -0.34,
  },
  // Skills — hand near the chin, thinking it over.
  {
    pose: {
      ...ARMS_DOWN,
      rightUpperArm: [0.1, 0, 0.95],
      rightLowerArm: [0, -0.35, -1.85],
      rightHand: [0, 0, -0.25],
      leftUpperArm: [0.1, 0, -1.12],
      leftLowerArm: [0, -0.75, -0.3],
      head: [0.06, 0, 0.07],
    },
    expression: null,
    offsetX: 0.1,
    turn: -0.28,
  },
  // Projects — presenting the work to its left, where the cards are.
  {
    pose: {
      ...ARMS_DOWN,
      rightUpperArm: [0, 0.55, 0.72],
      rightLowerArm: [0, 0.5, -0.15],
      rightHand: [0, 0.2, 0],
      leftUpperArm: [0.1, 0, -1.1],
      head: [0, -0.12, 0],
    },
    expression: 'happy',
    offsetX: 0.14,
    turn: -0.44,
  },
  // Contact — both arms open, welcoming.
  {
    pose: {
      ...ARMS_DOWN,
      leftUpperArm: [0, -0.3, -0.95],
      leftLowerArm: [0, -0.85, -0.2],
      rightUpperArm: [0, 0.3, 0.95],
      rightLowerArm: [0, 0.85, 0.2],
      chest: [-0.04, 0, 0],
    },
    expression: 'happy',
    offsetX: 0,
    turn: -0.1,
  },
];

/** Played for a couple of seconds when the character is clicked. */
const GREET: Scene = {
  pose: {
    ...ARMS_DOWN,
    leftUpperArm: [0, 0, -0.45],
    leftLowerArm: [0, 0, 1.3],
    rightUpperArm: [0, 0, 0.45],
    rightLowerArm: [0, 0, -1.3],
    head: [-0.1, 0, 0],
    chest: [-0.08, 0, 0],
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
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 30);
  camera.position.set(0, 1.05, 4.3);
  camera.lookAt(0, 0.98, 0);

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

  // Pointer position in [-1, 1], smoothed toward the raw reading each frame.
  let pointerX = 0;
  let pointerY = 0;
  let aimX = 0;
  let aimY = 0;

  let blinkNext = 1.5;
  let blinkPhase = -1;

  let lastFrame = performance.now() / 1000;
  let elapsed = 0;

  function activeScene(now: number): Scene {
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
    if (typeof detail?.index === 'number') setScene(detail.index);
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

    // Stage placement.
    root.position.x = damp(root.position.x, active.offsetX, 2.6, dt);
    root.rotation.y = damp(root.rotation.y, active.turn + aimX * 0.1, 2.6, dt);

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
      const target = active.pose[bone] ?? ZERO;
      state[0] = damp(state[0], target[0], 5, dt);
      state[1] = damp(state[1], target[1], 5, dt);
      state[2] = damp(state[2], target[2], 5, dt);
      idleFor(bone, elapsed, idleBuffer);
      node.rotation.set(
        state[0] + idleBuffer[0],
        state[1] + idleBuffer[1],
        state[2] + idleBuffer[2],
      );
    });

    // Eyes track the pointer through the VRM look-at rig.
    lookTarget.position.set(aimX * 1.2, 1.45 + aimY * 0.55, 3.0);

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
