// Piggy bank: lid coin slot → clear chute in the back-right corner → treasury drawer under the bay.
// The drawer catch is lifted by a string tied to the push rod, so the bank unlocks when the lotus opens.
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Assets } from './assets';
import { Part } from './Part';
import { Bx, DynRod, rodTransform } from './bits';
import { pose } from './pose';
import { S, T, HW, P, FY, LIFT, DRAWER_H, CHUTE_X, CHUTE_Z } from './dims';

const DB = FY - T;                 // top of the drawer layer (underside of the bay floor)
const DY = DB - DRAWER_H / 2;      // drawer layer centre
const PAWL = new THREE.Vector3(0.2, DB - 0.05, -0.5);
const STRING_Z = -0.2;

/** Coin slot, placed inside the lid's frame (lid pivot is at the front top edge). */
export function CoinSlot({ a }: { a: Assets }) {
  const z = CHUTE_Z - (P + T / 2);
  return (
    <Part id="coin-slot">
      <Bx s={[0.48, 0.02, 0.2]} p={[CHUTE_X, T + 0.006, z]} m={a.brass} />
      <Bx s={[0.36, 0.024, 0.06]} p={[CHUTE_X, T + 0.008, z]} m={a.holeMat} />
    </Part>
  );
}

export function PiggyBank({ a }: { a: Assets }) {
  const drawer = useRef<THREE.Group>(null!);
  const pawl = useRef<THREE.Group>(null!);
  const str = useRef<THREE.Mesh>(null!);
  const coin = useRef<THREE.Group>(null!);
  const tmp = useMemo(() => ({ top: new THREE.Vector3(), bot: new THREE.Vector3(), inv: new THREE.Matrix4() }), []);
  const chuteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.42, roughness: 0.08, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false }), []);

  useFrame(() => {
    drawer.current.position.z = pose.drawer * 2.5;
    pawl.current.rotation.x = -0.32 * pose.fire;
    // release string: from the push-rod foot down to the pawl tooth
    pawl.current.updateWorldMatrix(true, false);
    tmp.bot.set(0, -0.02, 0.3).applyMatrix4(pawl.current.matrixWorld);
    tmp.top.set(0.2, 0.31 + LIFT * pose.fire, STRING_Z);
    const parent = str.current.parent!;
    parent.updateWorldMatrix(true, false);
    tmp.inv.copy(parent.matrixWorld).invert();
    rodTransform(tmp.top.applyMatrix4(tmp.inv), tmp.bot.applyMatrix4(tmp.inv), str.current);
    // a saved coin falling down the chute
    const c = pose.coin;
    coin.current.visible = c > 0.001 && c < 0.999;
    coin.current.position.y = HW - 0.1 + (DB - DRAWER_H + 0.12 - (HW - 0.1)) * c * c;
    coin.current.rotation.y = c * 9;
  });

  // a seeded pile of saved coins under the chute
  const pile = useMemo(() => {
    let s = 11; const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    return Array.from({ length: 40 }, (_, i) => ({
      k: i % 4,
      x: -1.85 + r() * 3.6, z: -1.75 + r() * 3.5,
      y: DB - DRAWER_H + 0.1 + (i % 3) * 0.03, rx: (r() - 0.5) * 0.5, rz: (r() - 0.5) * 0.5,
    }));
  }, []);
  const chuteTop = HW - 0.04, chuteBot = DB - 0.06, chuteLen = chuteTop - chuteBot;

  return (
    <group>
      {/* ───── clear chute in the back-right corner ───── */}
      <Part id="coin-chute" explode={[1.2, 0, -1.2]}>
        <mesh position={[CHUTE_X, (chuteTop + chuteBot) / 2, CHUTE_Z]} material={chuteMat} renderOrder={11} userData={{ noShadow: true }}>
          <cylinderGeometry args={[0.15, 0.15, chuteLen, 24, 1, true]} />
        </mesh>
        <mesh position={[CHUTE_X, chuteTop - 0.08, CHUTE_Z]} material={a.brass}><cylinderGeometry args={[0.24, 0.155, 0.16, 24, 1, true]} /></mesh>
        {[3.4, 2.2, 1.0, 0.02, -1.0].map((y) => (
          <mesh key={y} position={[CHUTE_X, y, CHUTE_Z]} rotation={[Math.PI / 2, 0, 0]} material={a.darkBrass}><torusGeometry args={[0.155, 0.018, 6, 24]} /></mesh>
        ))}
        <group ref={coin} position={[CHUTE_X, HW, CHUTE_Z]} visible={false}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={a.coinMats[0].rim}><cylinderGeometry args={[0.11, 0.11, 0.025, 24]} /></mesh>
        </group>
      </Part>

      {/* ───── drawer layer under the bay ───── */}
      <Part id="treasury-drawer" explode={[0, -0.9, 1.4]}>
        {/* housing: carved sides, clear back, bottom plate */}
        <Bx s={[T, DRAWER_H, S + 2 * T]} p={[-P, DY, 0]} m={[a.teakIn, a.mats.bayJaali, a.teakEdge, a.teakEdge, a.teakEdge, a.teakEdge]} />
        <Bx s={[T, DRAWER_H, S + 2 * T]} p={[P, DY, 0]} m={[a.mats.bayJaali, a.teakIn, a.teakEdge, a.teakEdge, a.teakEdge, a.teakEdge]} />
        <mesh position={[0, DY, -P]} material={a.acrylic} renderOrder={10} userData={{ noShadow: true }}><boxGeometry args={[S, DRAWER_H, 0.05]} /></mesh>
        <Bx s={[S + 2 * T, T, S + 2 * T]} p={[0, DB - DRAWER_H - T / 2, 0]} m={[a.teakEdge, a.teakEdge, a.teakIn, a.teakEdge, a.teakEdge, a.teakEdge]} />
        {/* the drawer itself slides out of the front */}
        <group ref={drawer}>
          <Bx s={[S - 0.04, DRAWER_H - 0.04, T]} p={[0, DY, P]} m={[a.teakEdge, a.teakEdge, a.teakEdge, a.teakEdge, a.mats.bayBand, a.teakIn]} />
          <mesh position={[0, DY, P + T / 2 + 0.07]} material={a.brass}><sphereGeometry args={[0.09, 16, 10]} /></mesh>
          <Bx s={[0.5, 0.16, 0.02]} p={[0, DY, P + T / 2 + 0.01]} m={a.darkBrass} />
          <Bx s={[S - 0.3, 0.04, S - 0.2]} p={[0, DB - DRAWER_H + 0.05, 0.05]} m={a.teakIn} />
          {[-1, 1].map((sx) => <Bx key={sx} s={[0.04, DRAWER_H - 0.16, S - 0.2]} p={[sx * (S / 2 - 0.17), DY - 0.04, 0.05]} m={a.teakIn} />)}
          <Bx s={[S - 0.3, DRAWER_H - 0.16, 0.04]} p={[0, DY - 0.04, -P + 0.24]} m={a.teakIn} />
          {/* notch block the catch tooth drops into */}
          <Bx s={[0.16, 0.1, 0.16]} p={[0.2, DB - 0.12, -0.2]} m={a.darkBrass} />
          {pile.map((c, i) => (
            <mesh key={i} position={[c.x, c.y, c.z]} rotation={[c.rx, 0, c.rz]} material={a.coinMats[c.k].rim}>
              <cylinderGeometry args={[0.12, 0.12, 0.025, 20]} />
            </mesh>
          ))}
        </group>
      </Part>

      {/* ───── catch under the bay floor, lifted by the release string ───── */}
      <Part id="drawer-catch" explode={[0.6, -0.6, -0.6]}>
        <group ref={pawl} position={PAWL.toArray() as [number, number, number]}>
          <Bx s={[0.06, 0.04, 0.34]} p={[0, 0, 0.17]} m={a.stickMat} />
          <Bx s={[0.06, 0.09, 0.05]} p={[0, -0.05, 0.31]} m={a.stickMat} />
        </group>
        <mesh position={PAWL.toArray() as [number, number, number]} rotation={[0, 0, Math.PI / 2]} material={a.brass}><cylinderGeometry args={[0.02, 0.02, 0.14, 8]} /></mesh>
      </Part>
      <Part id="release-string">
        <DynRod ref={str} r={0.008} m={a.ivory} />
      </Part>
    </group>
  );
}
