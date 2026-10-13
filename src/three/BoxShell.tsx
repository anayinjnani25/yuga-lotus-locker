// Carved walls (on fold-out pivots), lid, base, bay and the dial lock on the front wall.
import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Assets } from './assets';
import { Part } from './Part';
import { Bx, Rod, Spring, Reed, Magnet, Wire } from './bits';
import { pose } from './pose';
import { useStore } from '../store';
import { rig } from './rig';
import { S, T, HW, BH, P, FY, WZ, WYc, LID_OPEN, DRAWER_H } from './dims';
import { CoinSlot } from './PiggyBank';

const HALF = Math.PI / 2;
const CODE = [1, 7, 0, 9], SCR = [4, 2, 8, 5];
const digitAngle = (d: number) => (2 * Math.PI * (d + 0.5)) / 10;

function LeafAnchor({ k, p, ry }: { k: number; p: [number, number, number]; ry: number }) {
  return <object3D ref={(o) => { rig.leafAnchors[k] = o; }} position={p} rotation={[0, ry, 0]} />;
}

export function BoxShell({ a }: { a: Assets }) {
  const hideWalls = useStore((s) => s.hideWalls);
  const front = useRef<THREE.Group>(null!), left = useRef<THREE.Group>(null!), right = useRef<THREE.Group>(null!), back = useRef<THREE.Group>(null!);
  const lid = useRef<THREE.Group>(null!);
  const wheels = useRef<THREE.Group[]>([]);
  const bolt = useRef<THREE.Group>(null!), boltSpring = useRef<THREE.Mesh>(null!);
  const popSpring = useRef<THREE.Mesh>(null!), popCap = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    const w = pose.walls * HALF;
    left.current.rotation.z = w; right.current.rotation.z = -w;
    front.current.rotation.x = w; back.current.rotation.x = -w;
    lid.current.rotation.x = LID_OPEN * pose.lid + (HALF - LID_OPEN) * pose.walls;
    wheels.current.forEach((g, i) => { if (g) g.rotation.x = digitAngle(SCR[i]) + (digitAngle(CODE[i]) + 2 * Math.PI - digitAngle(SCR[i])) * pose.wheels; });
    bolt.current.position.x = pose.bolt * 0.25;
    // bolt spring runs from the post (x 1.68) to the bolt end (x 1.36 + slide)
    const end = 1.36 + pose.bolt * 0.25;
    boltSpring.current.position.y = -1.68; boltSpring.current.scale.y = 1.68 - end;
    const ext = 0.06 + 0.36 * Math.min(1, pose.lid * 3);
    popSpring.current.scale.y = ext; popCap.current.position.y = HW + ext + 0.02;
  });

  const { mats } = a;
  const glass = { glass: a.reedGlass, metal: a.springMat };
  return (
    <group>
      {/* ───── left wall: lotus mandala, Treta inside ───── */}
      <Part id="wall-left" explode={[-2.4, 0, 0]}>
        <group ref={left} position={[-P, 0, 0]}>
          <Bx s={[T, HW, S + 2 * T]} p={[0, HW / 2, 0]} m={[mats.inner[1], mats.sideLOut, a.teakEdge, a.teakEdge, a.teakEdge, a.teakEdge]} visible={!hideWalls} />
          <LeafAnchor k={1} p={[T / 2 + 0.05, 0.8, 0]} ry={HALF} />
          <Part id="lid-spring">
            <Spring ref={popSpring} a={[-1.95 + P, HW, -1.7]} b={[-1.95 + P, HW + 1, -1.7]} r={0.08} turns={7} wire={0.012} m={a.springMat} />
            <mesh ref={popCap} position={[-1.95 + P, HW + 0.44, -1.7]} material={a.teakIn}><boxGeometry args={[0.24, 0.06, 0.24]} /></mesh>
            <mesh position={[-1.95 + P, HW - 0.05, -1.7]} material={a.ivory}><cylinderGeometry args={[0.11, 0.11, 0.12, 16, 1, true]} /></mesh>
          </Part>
        </group>
      </Part>

      {/* ───── right wall: chakra, Dwapara inside ───── */}
      <Part id="wall-right" explode={[2.4, 0, 0]}>
        <group ref={right} position={[P, 0, 0]}>
          <Bx s={[T, HW, S + 2 * T]} p={[0, HW / 2, 0]} m={[mats.sideROut, mats.inner[2], a.teakEdge, a.teakEdge, a.teakEdge, a.teakEdge]} visible={!hideWalls} />
          <LeafAnchor k={2} p={[-T / 2 - 0.05, 0.8, 0]} ry={-HALF} />
        </group>
      </Part>

      {/* ───── front wall: torana, Satya inside, dial lock and lid ───── */}
      <Part id="wall-front" explode={[0, 0, 2.4]}>
        <group ref={front} position={[0, 0, P]}>
          <Bx s={[S, HW, T]} p={[0, HW / 2, 0]} m={[a.teakEdge, a.teakEdge, a.teakEdge, a.teakEdge, mats.frontOut, mats.inner[0]]} visible={!hideWalls} />
          <LeafAnchor k={0} p={[0, 0.8, -T / 2 - 0.05]} ry={Math.PI} />

          <Part id="number-wheels" explode={[0, 0.6, -0.6]}>
            {[-0.48, -0.16, 0.16, 0.48].map((x, i) => (
              <group key={x} position={[x, WYc, WZ - P]} ref={(g) => { if (g) wheels.current[i] = g; }}>
                <mesh rotation={[0, 0, HALF]} material={[a.wheelM, a.wheelSide, a.wheelSide]}><cylinderGeometry args={[0.3, 0.3, 0.13, 40]} /></mesh>
              </group>
            ))}
            <Rod a={[-0.8, WYc, WZ - P]} b={[0.8, WYc, WZ - P]} r={0.03} m={a.brass} />
            {[-0.8, 0.8].map((x) => <Bx key={x} s={[0.08, 0.42, 0.42]} p={[x, WYc, WZ - P + 0.21]} m={a.teakIn} />)}
          </Part>

          <Part id="bolt" explode={[0.4, -0.3, -0.6]}>
            <group ref={bolt}>
              <Bx s={[1.95, 0.06, 0.1]} p={[0.36, WYc - 0.4, WZ - P]} m={a.stickMat} />
              {[-0.48, -0.16, 0.16, 0.48].map((x) => <Bx key={x} s={[0.09, 0.08, 0.08]} p={[x, WYc - 0.34, WZ - P]} m={a.stickMat} />)}
              <mesh position={[1.36, WYc - 0.4, WZ - P]} rotation={[0, HALF, 0]} material={a.brass}><torusGeometry args={[0.07, 0.018, 8, 20]} /></mesh>
              <mesh position={[1.25, WYc - 0.4, WZ - P - 0.08]} material={a.jewel}><sphereGeometry args={[0.05, 12, 8]} /></mesh>
            </group>
            {[0.75, 1.05].map((x) => (
              <mesh key={x} position={[x, WYc - 0.4, WZ - P]} rotation={[0, 0, HALF]} material={a.ivory}><cylinderGeometry args={[0.055, 0.055, 0.18, 12, 1, true]} /></mesh>
            ))}
            <Bx s={[0.08, 0.34, 0.3]} p={[1.72, WYc - 0.4, WZ - P + 0.1]} m={a.teakIn} />
            <group position={[0, WYc - 0.4, WZ - P]} rotation={[0, 0, HALF]}>
              {/* spring axis along -x: a unit spring rotated to point left, stretched in code */}
              <mesh ref={boltSpring} material={a.springMat}>
                <primitive object={springGeoBolt()} attach="geometry" />
              </mesh>
            </group>
          </Part>

          <Part id="lid-reed">
            <Reed p={[0.9, HW - 0.08, -T / 2 - 0.05]} mats={glass} />
            <Wire id="lid-reed" pts={[[0.9, HW - 0.12, -T / 2 - 0.08], [0.95, HW / 2, -T / 2 - 0.06], [1.0, 0.1, -T / 2 - 0.08]]} color={0x8e5bd8} r={0.014} />
          </Part>

          {/* lid: hinged at the front top edge */}
          <group ref={lid} position={[0, HW, T / 2]}>
            <Part id="lid" explode={[0, 2.2, 0]}>
              <Bx s={[S + 2 * T, T, S + 2 * T]} p={[0, T / 2, -(S + 2 * T) / 2]} m={[a.teakEdge, a.teakEdge, mats.lidTop, mats.inner[3], a.teakEdge, a.teakEdge]} visible={!hideWalls} />
              <mesh position={[0, T + 0.08, -(S + 2 * T) + 0.4]} material={a.brass}><sphereGeometry args={[0.13, 16, 10]} /></mesh>
              <Part id="lid-hook">
                <Rod a={[-0.6, 0, -0.56 - T / 2]} b={[-0.6, -0.86, -0.56 - T / 2]} r={0.014} m={a.springMat} />
                <mesh position={[-0.6, -0.95, -0.56 - T / 2]} rotation={[0, HALF, 0]} material={a.springMat}><torusGeometry args={[0.08, 0.014, 8, 20]} /></mesh>
              </Part>
              <Part id="magnets"><Magnet p={[0.9, -0.02, -T / 2 - 0.05]} m={a.magnetMat} /></Part>
              <CoinSlot a={a} />
            </Part>
          </group>
        </group>
      </Part>

      {/* ───── clear acrylic back, Kali leaf rests on it ───── */}
      <Part id="back-acrylic" explode={[0, 0, -2.4]}>
        <group ref={back} position={[0, 0, -P]}>
          <mesh position={[0, HW / 2, 0]} material={a.acrylic} renderOrder={10} visible={!hideWalls} userData={{ noShadow: true }}>
            <boxGeometry args={[S, HW, 0.05]} />
          </mesh>
          {[HW - 0.03, 0.03].map((y) => <Bx key={y} s={[S, 0.06, 0.07]} p={[0, y, 0]} m={a.brass} visible={!hideWalls} />)}
          <LeafAnchor k={3} p={[0, 0.8, 0.1]} ry={0} />
        </group>
      </Part>

      {/* ───── base, electronics bay, plinth ───── */}
      <Part id="base" explode={[0, -1.2, 0]}>
        <Bx s={[S + 2 * T, T, S + 2 * T]} p={[0, -T / 2, 0]} m={[a.teakEdge, a.teakEdge, mats.floor, a.teakIn, a.teakEdge, a.teakEdge]} />
        <Bx s={[T, BH, S + 2 * T]} p={[-P, -T - BH / 2, 0]} m={[a.teakIn, mats.bayJaali, a.teakEdge, a.teakEdge, a.teakEdge, a.teakEdge]} />
        <Bx s={[T, BH, S + 2 * T]} p={[P, -T - BH / 2, 0]} m={[mats.bayJaali, a.teakIn, a.teakEdge, a.teakEdge, a.teakEdge, a.teakEdge]} />
        <Bx s={[S, BH, T]} p={[0, -T - BH / 2, P]} m={[a.teakEdge, a.teakEdge, a.teakEdge, a.teakEdge, mats.bayBand, a.teakIn]} />
        <mesh position={[0, -T - BH / 2, -P]} material={a.acrylic} renderOrder={10} userData={{ noShadow: true }}><boxGeometry args={[S, BH, 0.05]} /></mesh>
        <Bx s={[S + 2 * T, T, S + 2 * T]} p={[0, FY - T / 2, 0]} m={[a.teakEdge, a.teakEdge, a.blk, a.teakEdge, a.teakEdge, a.teakEdge]} />
        <Bx s={[S + 0.7, 0.22, S + 0.7]} p={[0, FY - T - DRAWER_H - T - 0.11, 0]} m={a.brass} />
        <instancedMesh args={[undefined, undefined, 4]} material={a.brass} ref={(m) => {
          if (!m) return; const o = new THREE.Object3D();
          [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z], i) => { o.position.set(x * (S / 2 + 0.1), FY - T - DRAWER_H - T - 0.3, z * (S / 2 + 0.1)); o.scale.set(1, 0.6, 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
          m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere();
        }}>
          <sphereGeometry args={[0.24, 20, 12]} />
        </instancedMesh>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Bx key={`${x}${z}`} s={[0.2, BH + 2 * T + DRAWER_H, 0.2]} p={[x * (P + 0.02), -(BH + 2 * T + DRAWER_H) / 2, z * (P + 0.02)]} m={a.darkBrass} />)}
      </Part>

      {/* keypad and screen in the front of the base */}
      <Part id="keypad" explode={[0, 0, 1.2]}>
        <mesh position={[-1, -T - BH / 2, P + T / 2 + 0.01]} material={a.keypadMat}><planeGeometry args={[0.75, 0.94]} /></mesh>
        <Wire id="keypad" pts={[[-1, -T - BH / 2, P - T / 2 - 0.02], [-1.2, FY + 0.5, 0.8], [-1.5, FY + 0.12, -0.45]]} color={0x3a7fd6} r={0.03} />
      </Part>
      <Part id="lcd" explode={[0, 0, 1.2]}>
        <mesh position={[0.7, -T - BH / 2 + 0.12, P + T / 2 + 0.02]} material={a.lcdMat}><planeGeometry args={[1.1, 0.42]} /></mesh>
        <Bx s={[1.22, 0.54, 0.03]} p={[0.7, -T - BH / 2 + 0.12, P + T / 2]} m={a.brass} />
        <Bx s={[1.1, 0.4, 0.12]} p={[0.7, -T - BH / 2 + 0.12, P - T / 2 - 0.06]} m={a.unoMat} />
      </Part>
    </group>
  );
}

let boltSpringGeo: THREE.BufferGeometry | null = null;
function springGeoBolt() {
  // the bolt spring is pulled along -x from the post; the group above maps +Y to -X
  if (!boltSpringGeo) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 180; i++) { const t = i / 180, ang = t * 9 * Math.PI * 2; pts.push(new THREE.Vector3(0.045 * Math.cos(ang), t, 0.045 * Math.sin(ang))); }
    boltSpringGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 180, 0.009, 6, false);
  }
  return boltSpringGeo;
}
