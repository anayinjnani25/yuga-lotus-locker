import * as THREE from 'three';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls, Environment } from '@react-three/drei';
import { applyOutlines, setOutlineResolution } from './outline';
import { loadAssets, type Assets } from './assets';
import { BoxShell } from './BoxShell';
import { Mechanism } from './Mechanism';
import { Electronics } from './Electronics';
import { applyDisplay } from './display';
import { registry, tickExplode, explodeNow } from './Part';
import { tickTweens, tweensActive } from './pose';
import { useStore, reducedMotion } from '../store';
import { FY, T } from './dims';

const DBG = new URLSearchParams(location.search);

// ───────── camera API used by the pages ─────────
let cc: CameraControls | null = null;
const HOME = { target: new THREE.Vector3(0, 1.1, 0), th: Math.PI + 0.6, ph: 1.12, d: 15 };
const isPhone = () => window.innerWidth < 760;

function homePos(scale = 1) {
  const d = HOME.d * (isPhone() ? 1.45 : 1) * scale;
  return new THREE.Vector3(
    HOME.target.x + d * Math.sin(HOME.ph) * Math.sin(HOME.th),
    HOME.target.y + d * Math.cos(HOME.ph),
    HOME.target.z + d * Math.sin(HOME.ph) * Math.cos(HOME.th),
  );
}

export const camApi = {
  home(animate = true) {
    if (!cc) return;
    const p = homePos();
    const a = animate && !reducedMotion();
    cc.setFocalOffset(0, 0, 0, a);
    cc.setLookAt(p.x, p.y, p.z, HOME.target.x, HOME.target.y, HOME.target.z, a);
  },
  look(pos: [number, number, number], target: [number, number, number], animate = true) {
    if (!cc) return;
    const s = isPhone() ? 1.7 : 1;
    const t = new THREE.Vector3(...target), p = new THREE.Vector3(...pos).sub(t).multiplyScalar(s).add(t);
    const a = animate && !reducedMotion();
    cc.setLookAt(p.x, p.y, p.z, t.x, t.y, t.z, a);
    panelOffset(p.distanceTo(t), a);
  },
  flyTo(id: string) {
    if (!cc) return;
    const box = new THREE.Box3();
    registry.get(id)?.forEach((g) => {
      g.updateWorldMatrix(true, true);
      g.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || !m.geometry) return;
        for (let p: THREE.Object3D | null = m; p; p = p.parent) if (!p.visible) return;
        box.expandByObject(m);
      });
    });
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const cam = cc.camera as THREE.PerspectiveCamera;
    const vf = THREE.MathUtils.degToRad(cam.fov) / 2;
    const hf = Math.atan(Math.tan(vf) * cam.aspect);
    const phone = isPhone();
    const r = Math.max(sphere.radius, 0.4);
    const dist = (r / Math.sin(Math.min(vf, hf))) * (phone ? 2.3 : 1.9);
    const tgt = new THREE.Vector3(); cc.getTarget(tgt);
    const dir = new THREE.Vector3().subVectors(cam.position, tgt).normalize();
    if (dir.y < 0.15) { dir.y = 0.15; dir.normalize(); }
    const pos = sphere.center.clone().addScaledVector(dir, dist);
    const a = !reducedMotion();
    cc.setLookAt(pos.x, pos.y, pos.z, sphere.center.x, sphere.center.y, sphere.center.z, a);
    panelOffset(dist, a);
  },
};

/** Shift the view so the subject stays clear of the side panel (desktop) or bottom sheet (phone). */
function panelOffset(dist: number, animate: boolean) {
  if (!cc) return;
  const cam = cc.camera as THREE.PerspectiveCamera;
  const vf = THREE.MathUtils.degToRad(cam.fov) / 2;
  if (isPhone()) cc.setFocalOffset(0, dist * Math.tan(vf) * 0.5, 0, animate);
  else cc.setFocalOffset(dist * Math.tan(vf) * cam.aspect * Math.min(0.45, 440 / window.innerWidth), 0, 0, animate);
}

function CameraRig() {
  const ref = useRef<CameraControls>(null!);
  const { camera } = useThree();
  useEffect(() => {
    cc = ref.current;
    const p = homePos();
    cc.setLookAt(p.x, p.y, p.z, HOME.target.x, HOME.target.y, HOME.target.z, false);
    cc.smoothTime = reducedMotion() ? 0 : 0.45;
    cc.draggingSmoothTime = 0.12;
    return () => { cc = null; };
  }, [camera]);
  return <CameraControls ref={ref} makeDefault minDistance={0.8} maxDistance={34} dollySpeed={0.6} />;
}

/** Ticks tweens and the explode slider; re-renders the shadow map only while something moves. */
let shadowFrames = 30, statFrame = 0;
export const touchShadows = () => { shadowFrames = Math.max(shadowFrames, 3); };
function Driver() {
  const { gl, size } = useThree();
  useEffect(() => { gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true; }, [gl]);
  useEffect(() => { const p = gl.getPixelRatio(); setOutlineResolution(size.width * p, size.height * p); }, [gl, size]);
  const lastExplode = useRef(-1);
  useFrame((_, dt) => {
    tickTweens(performance.now());
    tickExplode(dt);
    const e = explodeNow();
    if (tweensActive() || e !== lastExplode.current) shadowFrames = Math.max(shadowFrames, 2);
    lastExplode.current = e;
    if (shadowFrames > 0) { gl.shadowMap.needsUpdate = true; shadowFrames--; }
    if (DBG.has('stats') && ++statFrame % 120 === 0) console.info(`[yuga] calls ${gl.info.render.calls} tris ${gl.info.render.triangles} programs ${gl.info.programs?.length}`);
  });
  return null;
}

/** Re-applies dim / glow / ghost and hit-testing whenever the view state changes. */
function DisplayManager({ root }: { root: React.RefObject<THREE.Group> }) {
  const selected = useStore((s) => s.selected);
  const glow = useStore((s) => s.glow);
  const wiringOnly = useStore((s) => s.wiringOnly);
  const mode = useStore((s) => s.mode);
  const hideWalls = useStore((s) => s.hideWalls);
  const cutaway = useStore((s) => s.cutaway);
  const exploded = useStore((s) => s.explode > 0.04);
  const hovered = useStore((s) => s.hovered);
  useEffect(() => {
    const id = requestAnimationFrame(() => { if (root.current) applyDisplay(root.current, { selected, glow, wiringOnly }); touchShadows(); });
    return () => cancelAnimationFrame(id);
  }, [selected, glow, wiringOnly, mode, hideWalls, cutaway, exploded, root]);
  useEffect(() => {
    const id = requestAnimationFrame(() => applyOutlines(hovered, selected));
    return () => cancelAnimationFrame(id);
  }, [hovered, selected, mode, cutaway, hideWalls]);
  return null;
}

function Floor({ a }: { a: Assets }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FY - T - 0.46, 0]} material={a.floorMat}><circleGeometry args={[9, 48]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FY - T - 0.45, 0]} receiveShadow><circleGeometry args={[7, 40]} /><shadowMaterial opacity={0.45} /></mesh>
    </group>
  );
}

function Lights() {
  const spot = useRef<THREE.SpotLight>(null!);
  useEffect(() => { spot.current.target.position.set(0, 1, 0); spot.current.target.updateMatrixWorld(); }, []);
  return (
    <>
      <hemisphereLight args={[0xffe6c8, 0x3a2616, 1.4]} />
      <spotLight ref={spot} color={0xffd6a0} intensity={4.2} distance={60} angle={0.55} penumbra={0.65} decay={0} position={[-7, 11, -8]}
        castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} />
      <directionalLight color={0xffc890} intensity={1.6} position={[7, 6, 8]} />
      <pointLight color={0xffc78a} intensity={2.2} distance={7} decay={0} position={[-0.6, 3.4, -0.9]} />
    </>
  );
}

function Scene({ a }: { a: Assets }) {
  const root = useRef<THREE.Group>(null!);
  useEffect(() => { useStore.setState({ ready: true }); }, []);
  return (
    <>
      <Environment map={a.envTex} environmentIntensity={1} />
      <Lights />
      <group ref={root}>
          <BoxShell a={a} />
          <Mechanism a={a} />
          <Electronics a={a} />
        </group>
      <Floor a={a} />
      <DisplayManager root={root} />
      <Driver />
      <CameraRig />
    </>
  );
}

export function Stage() {
  const [assets, setAssets] = useState<Assets | null>(null);
  const staged = useStore((s) => s.route === 'explore' || s.route === 'how');
  useEffect(() => { let live = true; loadAssets().then((a) => live && setAssets(a)); return () => { live = false; }; }, []);
  return (
    <div className="stage">
      <Canvas shadows={!DBG.has('noshadow')} dpr={[1, 1.75]} frameloop={staged ? 'always' : 'never'} camera={{ fov: 34, near: 0.1, far: 200, position: [-8, 8, -11] }}
        gl={{ antialias: !DBG.has('noaa') && window.devicePixelRatio < 1.5, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15, powerPreference: 'high-performance' }}
        onPointerMissed={() => useStore.setState({ hovered: null })}>
        <Suspense fallback={null}>{assets && <Scene a={assets} />}</Suspense>
      </Canvas>
      {!assets && <div className="stage-loading" role="status">Carving and wiring the box…</div>}
    </div>
  );
}
