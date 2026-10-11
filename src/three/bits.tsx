// Small mesh helpers shared by the model files.
import * as THREE from 'three';
import { useMemo, forwardRef } from 'react';
import { springGeo } from './assets';

type V3 = [number, number, number];
type Mat = THREE.Material | THREE.Material[];

export function Bx({ s, p = [0, 0, 0], m, r, visible = true }: { s: V3; p?: V3; m: Mat; r?: V3; visible?: boolean }) {
  return (
    <mesh position={p} rotation={r} material={m} visible={visible}>
      <boxGeometry args={s} />
    </mesh>
  );
}

const Y = new THREE.Vector3(0, 1, 0);
export function rodTransform(a: THREE.Vector3, b: THREE.Vector3, o: THREE.Object3D) {
  const d = new THREE.Vector3().subVectors(b, a), L = d.length();
  o.position.copy(a).addScaledVector(d, 0.5);
  o.quaternion.setFromUnitVectors(Y, d.normalize());
  o.scale.set(1, Math.max(L, 1e-4), 1);
}

/** Cylinder from a to b (static). */
export function Rod({ a, b, r, m, seg = 12 }: { a: V3; b: V3; r: number; m: Mat; seg?: number }) {
  const t = useMemo(() => { const o = new THREE.Object3D(); rodTransform(new THREE.Vector3(...a), new THREE.Vector3(...b), o); return o; }, [a.join(), b.join()]);
  return (
    <mesh position={t.position} quaternion={t.quaternion} scale={t.scale} material={m}>
      <cylinderGeometry args={[r, r, 1, seg]} />
    </mesh>
  );
}

/** Unit-length rod mesh whose transform is set every frame via rodTransform. */
export const DynRod = forwardRef<THREE.Mesh, { r: number; m: Mat; seg?: number }>(({ r, m, seg = 10 }, ref) => (
  <mesh ref={ref} material={m}>
    <cylinderGeometry args={[r, r, 1, seg]} />
  </mesh>
));

/** Coil spring from a to b. Stretch it at runtime by scaling Y (length). */
export const Spring = forwardRef<THREE.Mesh, { a: V3; b: V3; r: number; turns: number; wire: number; m: Mat }>(
  ({ a, b, r, turns, wire, m }, ref) => {
    const t = useMemo(() => {
      const o = new THREE.Object3D(); const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const d = new THREE.Vector3().subVectors(B, A); const L = d.length();
      o.position.copy(A); o.quaternion.setFromUnitVectors(Y, d.normalize()); o.scale.set(1, L, 1);
      return o;
    }, [a.join(), b.join()]);
    return <mesh ref={ref} geometry={springGeo(r, turns, wire)} material={m} position={t.position} quaternion={t.quaternion} scale={t.scale} />;
  },
);

export function Coin({ k, r, th, mats }: { k: number; r: number; th: number; mats: { face: THREE.Material; rim: THREE.Material }[] }) {
  const m = mats[k];
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={m.rim}><cylinderGeometry args={[r, r, th, 40, 1, true]} /></mesh>
      <mesh rotation={[0, Math.PI, 0]} position={[0, 0, -th / 2]} material={m.face}><circleGeometry args={[r, 40]} /></mesh>
      <mesh position={[0, 0, th / 2]} material={m.rim}><circleGeometry args={[r, 40]} /></mesh>
    </group>
  );
}

export function Wire({ id, pts, color, r = 0.018 }: { id: string; pts: V3[]; color: number; r?: number }) {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 64, r, 6, false), [pts, r]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.45, envMapIntensity: 0.6 }), [color]);
  return <mesh geometry={geo} material={mat} userData={{ wireId: id }} />;
}

/** Reed switch: glass capsule, reed blade and two leads. */
export function Reed({ p, ry = 0, mats }: { p: V3; ry?: number; mats: { glass: THREE.Material; metal: THREE.Material } }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={mats.glass}><cylinderGeometry args={[0.03, 0.03, 0.24, 12]} /></mesh>
      <mesh material={mats.metal}><boxGeometry args={[0.2, 0.008, 0.01]} /></mesh>
      {[-0.17, 0.17].map((s) => (
        <mesh key={s} position={[s, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.metal}><cylinderGeometry args={[0.006, 0.006, 0.1, 6]} /></mesh>
      ))}
    </group>
  );
}

export function Magnet({ p, r = [0, 0, 0], m }: { p: V3; r?: V3; m: Mat }) {
  return <mesh position={p} rotation={r} material={m}><cylinderGeometry args={[0.035, 0.035, 0.02, 14]} /></mesh>;
}
