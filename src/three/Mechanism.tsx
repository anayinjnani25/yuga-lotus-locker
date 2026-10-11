// Core tube, picture bands, leaf ring + sockets, leaves, trigger, lotus and NeoPixel ring.
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { pegShape, type Assets } from './assets';
import { Part } from './Part';
import { Bx, Rod, Spring, Reed, Magnet, Coin, DynRod, rodTransform } from './bits';
import { pose, ledState } from './pose';
import { rig } from './rig';
import { useStore } from '../store';
import { YUGAS } from '../data/yugas';
import { R, CH, TH0, THL, BAND_Y, LEAF_ANGLES, RING_START, LIFT, BUTTON_Y, P } from './dims';

const HALF = Math.PI / 2;
const TAU = Math.PI * 2;

export function Mechanism({ a }: { a: Assets }) {
  const cut = useStore((s) => s.cutaway);
  const t0 = cut ? TH0 : 0, tl = cut ? THL : TAU;
  const glass = { glass: a.reedGlass, metal: a.springMat };

  // ───── per-frame motion ─────
  const ring = useRef<THREE.Group>(null!);
  const leaves = useRef<THREE.Group[]>([]);
  const bandMags = useRef<THREE.Mesh[]>([]);
  const rod = useRef<THREE.Group>(null!), mainSpring = useRef<THREE.Mesh>(null!);
  const lever = useRef<THREE.Group>(null!);
  const button = useRef<THREE.Group>(null!), btnSpring = useRef<THREE.Mesh>(null!);
  const petals = useRef<THREE.Group[]>([]);
  const collar = useRef<THREE.Mesh>(null!);
  const struts = useRef<THREE.Mesh[]>([]);
  const horn = useRef<THREE.Group>(null!), link = useRef<THREE.Mesh>(null!);
  const leds = useRef<THREE.InstancedMesh>(null!);
  const glows = useRef<THREE.Sprite[]>([]);
  const ledVersion = useRef(-1);

  const tmp = useMemo(() => ({
    A: new THREE.Matrix4(), B: new THREE.Matrix4(), M: new THREE.Matrix4(), inv: new THREE.Matrix4(),
    pa: new THREE.Vector3(), pb: new THREE.Vector3(), qa: new THREE.Quaternion(), qb: new THREE.Quaternion(),
    sa: new THREE.Vector3(), sb: new THREE.Vector3(), v: new THREE.Vector3(), w: new THREE.Vector3(),
    socket: LEAF_ANGLES.map((ang) => new THREE.Matrix4().compose(
      new THREE.Vector3(Math.sin(ang) * (R + 0.33), 0.43, Math.cos(ang) * (R + 0.33)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(1.05, ang, 0, 'YXZ')),
      new THREE.Vector3(0.62, 0.62, 0.62))),
    wallScale: new THREE.Matrix4().makeScale(1.17, 1.17, 1.17),
    col: new THREE.Color(), off: new THREE.Color(0x222018),
  }), []);

  useFrame(() => {
    // picture bands: slide the texture so the cut geometry stays put
    a.bandTex.forEach((tx, i) => {
      const rot = pose.bands[i];
      tx.repeat.x = tl / TAU;
      tx.offset.x = 1 / 8 - (rot - t0) / TAU;
      const m = bandMags.current[i];
      if (m) m.position.set(Math.sin(rot) * (R + 0.02), BAND_Y[i] - 0.12, Math.cos(rot) * (R + 0.02));
    });

    ring.current.rotation.y = RING_START * (1 - pose.ring);
    ring.current.updateWorldMatrix(true, false);

    // leaves: blend from their wall seat to their socket in the ring
    leaves.current.forEach((g, k) => {
      const anchor = rig.leafAnchors[k];
      if (!g || !anchor || !g.parent) return;
      const t = pose.leaves[k];
      anchor.updateWorldMatrix(true, false);
      tmp.A.multiplyMatrices(anchor.matrixWorld, tmp.wallScale);
      tmp.B.multiplyMatrices(ring.current.matrixWorld, tmp.socket[k]);
      tmp.A.decompose(tmp.pa, tmp.qa, tmp.sa); tmp.B.decompose(tmp.pb, tmp.qb, tmp.sb);
      tmp.pa.lerp(tmp.pb, t); tmp.pa.y += Math.sin(t * Math.PI) * 1.4;
      tmp.qa.slerp(tmp.qb, t); tmp.sa.lerp(tmp.sb, t);
      tmp.M.compose(tmp.pa, tmp.qa, tmp.sa);
      g.parent.updateWorldMatrix(true, false);
      tmp.inv.copy(g.parent.matrixWorld).invert();
      tmp.M.premultiply(tmp.inv);
      tmp.M.decompose(g.position, g.quaternion, g.scale);
    });

    // trigger and lotus
    const lift = pose.fire * LIFT;
    rod.current.position.y = lift;
    mainSpring.current.scale.y = 0.28 + lift;
    lever.current.rotation.z = -0.35 * Math.max(pose.button, 0);
    button.current.position.x = -pose.button * 0.25;
    btnSpring.current.scale.y = 1.5 - pose.button * 0.25 - (R + 0.31);
    petals.current.forEach((p, k) => { if (p) { const c = k % 2 ? -0.24 : -0.34; p.rotation.x = c + (0.98 - c) * pose.fire; } });
    collar.current.position.y = 3.06 + lift;
    collar.current.updateWorldMatrix(true, false);
    tmp.v.setFromMatrixPosition(collar.current.matrixWorld);
    struts.current.forEach((s, k) => {
      const p = petals.current[k];
      if (!s || !p || !s.parent) return;
      p.updateWorldMatrix(true, false);
      tmp.w.set(0, 0.9, -0.05).applyMatrix4(p.matrixWorld);
      s.parent.updateWorldMatrix(true, false);
      tmp.inv.copy(s.parent.matrixWorld).invert();
      rodTransform(tmp.v.clone().applyMatrix4(tmp.inv), tmp.w.applyMatrix4(tmp.inv), s);
    });
    // lotus servo horn lifts the rod foot (electronic)
    horn.current.rotation.z = pose.fire * 1.1;
    horn.current.updateWorldMatrix(true, false);
    const tip = new THREE.Vector3(0.25, 0, 0).applyMatrix4(horn.current.matrixWorld);
    if (link.current.parent) {
      link.current.parent.updateWorldMatrix(true, false);
      tmp.inv.copy(link.current.parent.matrixWorld).invert();
      rod.current.updateWorldMatrix(true, false);
      const foot = new THREE.Vector3(0.12, 0.3, 0).applyMatrix4(rod.current.matrixWorld);
      rodTransform(tip.applyMatrix4(tmp.inv), foot.applyMatrix4(tmp.inv), link.current);
    }

    // NeoPixel colours
    if (ledVersion.current !== ledState.version && leds.current) {
      ledVersion.current = ledState.version;
      ledState.colors.forEach((c, j) => {
        tmp.col.set(c ?? tmp.off);
        leds.current.setColorAt(j, tmp.col);
        const sp = glows.current[j];
        if (sp) { sp.visible = !!c; (sp.material as THREE.SpriteMaterial).color.set(c ?? '#000'); }
      });
      if (leds.current.instanceColor) leds.current.instanceColor.needsUpdate = true;
    }
  });

  const ringProfile = useMemo(() => [[R + 0.02, 0.15], [R + 0.26, 0.15], [R + 0.3, 0.22], [R + 0.3, 0.63], [R + 0.26, 0.7], [R + 0.02, 0.7], [R + 0.02, 0.15]].map((p) => new THREE.Vector2(p[0], p[1])), []);
  const pegGeos = useMemo(() => YUGAS.map((y) => new THREE.ExtrudeGeometry(pegShape(y.peg, 0.1), { depth: 0.06, bevelEnabled: false })), []);
  const socketGeos = useMemo(() => YUGAS.map((y) => new THREE.ExtrudeGeometry(pegShape(y.peg, 0.13), { depth: 0.05, bevelEnabled: false })), []);
  const ledAngles = useMemo(() => Array.from({ length: 8 }, (_, j) => { const k = j >> 1; return LEAF_ANGLES[k] + (j % 2 ? 0.2 : -0.2); }), []);
  const glowMats = useMemo(() => Array.from({ length: 8 }, () => new THREE.SpriteMaterial({ map: a.glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })), [a]);

  return (
    <group>
      {/* ───── core tube ───── */}
      <Part id="core-tube" explode={[0, 0, 0]}>
        <mesh position={[0, CH / 2, 0]} material={a.tubeMat}><cylinderGeometry args={[R, R, CH, 64, 1, true, t0, tl]} key={tl} /></mesh>
        {cut && [TH0, TH0 + THL].map((ang) => <Bx key={ang} s={[0.04, CH, 0.06]} p={[Math.sin(ang) * R, CH / 2, Math.cos(ang) * R]} r={[0, ang, 0]} m={a.tubeEdge} />)}
        <mesh position={[0, CH, 0]} rotation={[HALF, 0, cut ? -20 * Math.PI / 180 : 0]} material={a.brass}><torusGeometry args={[R, 0.05, 8, 64, tl]} key={tl} /></mesh>
        <mesh position={[R + 0.004, BUTTON_Y, 0]} rotation={[0, HALF, 0]} material={a.holeMat}><ringGeometry args={[0.07, 0.1, 20]} /></mesh>
      </Part>

      {/* ───── picture bands ───── */}
      <>
        {BAND_Y.map((by, i) => (
          <Part id="picture-bands" key={i} explode={[0, 0.5 + (2 - i) * 0.55, 0]}>
            <mesh position={[0, by, 0]} key={tl}>
              <cylinderGeometry args={[R + 0.06, R + 0.06, 0.5, 64, 1, true, t0, tl]} />
              <meshStandardMaterial map={a.bandTex[i]} roughness={0.6} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, by - 0.25, 0]} rotation={[HALF, 0, cut ? -20 * Math.PI / 180 : 0]} material={a.darkBrass} key={'l' + tl}><torusGeometry args={[R + 0.06, 0.012, 6, 64, tl]} /></mesh>
            <Part id="magnets"><mesh ref={(m) => { if (m) bandMags.current[i] = m; }} rotation={[0, 0, 0]} material={a.magnetMat}><boxGeometry args={[0.07, 0.07, 0.02]} /></mesh></Part>
          </Part>
        ))}
      </>

      <Part id="click-stops">
        {[...BAND_Y, 0.45].map((y) => {
          const ang = -0.9, r0 = R - 0.08;
          return (
            <group key={y} position={[Math.sin(ang) * r0, y, Math.cos(ang) * r0]} rotation={[0, ang, 0]}>
              <mesh rotation={[HALF, 0, 0]} material={a.ivory}><cylinderGeometry args={[0.035, 0.035, 0.14, 10, 1, true]} /></mesh>
              <mesh position={[0, 0, 0.08]} material={a.jewel}><sphereGeometry args={[0.035, 10, 8]} /></mesh>
            </group>
          );
        })}
      </Part>

      <Part id="reed-bands">
        {BAND_Y.map((by) => <Reed key={by} p={[0, by - 0.12, R - 0.07]} mats={glass} />)}
      </Part>
      <Part id="reed-ring"><Reed p={[0.62, BUTTON_Y + 0.18, R * 0.6]} ry={-0.8} mats={glass} /></Part>

      {/* ───── leaf ring: turns with its sockets and reeds ───── */}
      <group ref={(g) => { if (g) { ring.current = g; rig.ring = g; } }}>
        <Part id="leaf-ring" explode={[0, -0.35, 0]}>
          <mesh material={a.brass} key={tl}><latheGeometry args={[ringProfile, 72, cut ? -145 * Math.PI / 180 : 0, cut ? 290 * Math.PI / 180 : TAU]} /></mesh>
          <mesh position={[R + 0.305, BUTTON_Y, 0]} rotation={[0, HALF, 0]} material={a.holeMat}><circleGeometry args={[0.1, 20]} /></mesh>
          <mesh position={[Math.sin(2.2) * (R + 0.16), 0.74, Math.cos(2.2) * (R + 0.16)]} material={a.darkBrass}><cylinderGeometry args={[0.04, 0.04, 0.1, 10]} /></mesh>
          <Part id="magnets"><Magnet p={[R + 0.06, BUTTON_Y + 0.18, 0.18]} r={[0, 0, HALF]} m={a.magnetMat} /></Part>
        </Part>
        <Part id="leaf-sockets" explode={[0, -0.35, 0]}>
          {LEAF_ANGLES.map((ang, k) => (
            <group key={k} rotation={[0, ang, 0]}>
              <mesh position={[0, 0.43, R + 0.27]} geometry={socketGeos[k]} material={a.yugaMetal[k]} />
              <mesh position={[0, 0.43, R + 0.271]} scale={[0.78, 0.78, 1.02]} geometry={socketGeos[k]} material={a.holeMat} />
            </group>
          ))}
        </Part>
        <Part id="reed-leaves" explode={[0, -0.35, 0]}>
          {LEAF_ANGLES.map((ang) => <group key={ang} rotation={[0, ang, 0]}><Reed p={[0, 0.43, R + 0.1]} mats={glass} /></group>)}
        </Part>
      </group>

      {/* ───── bronze leaves (placed every frame) ───── */}
      <Part id="leaves">
        {YUGAS.map((y, k) => (
          <group key={y.id} ref={(g) => { if (g) leaves.current[k] = g; }}>
            <mesh geometry={a.geo.leaf} material={a.leafMat} />
            <group position={[0, 1, 0.03]}><Part id="coins"><Coin k={k} r={0.28} th={0.05} mats={a.coinMats} /></Part></group>
            <mesh position={[0, -0.17, 0]} material={a.darkBrass}><cylinderGeometry args={[0.035, 0.045, 0.38, 10]} /></mesh>
            <mesh position={[0, -0.3, 0]} rotation={[HALF, 0, 0]} geometry={pegGeos[k]} material={a.yugaMetal[k]} />
            <Part id="magnets"><Magnet p={[0, -0.38, 0]} m={a.magnetMat} /></Part>
          </group>
        ))}
      </Part>

      {/* ───── trigger ───── */}
      <group ref={rod}>
        <Part id="push-rod">
          <Rod a={[0, 0.32, 0]} b={[0, 3.02, 0]} r={0.05} m={a.stickMat} />
          <mesh position={[0, 0.33, 0]} material={a.card}><cylinderGeometry args={[0.26, 0.26, 0.06, 24]} /></mesh>
          <mesh position={[0, 0.82, 0]} material={a.holeMat}><cylinderGeometry args={[0.053, 0.053, 0.05, 12]} /></mesh>
        </Part>
        <Part id="stop-collar" explode={[0, 0, -0.6]}>
          <mesh position={[0, 0.55, 0]} material={a.darkBrass}><cylinderGeometry args={[0.1, 0.1, 0.07, 16]} /></mesh>
        </Part>
      </group>
      <Part id="main-spring" explode={[0, -0.5, -0.8]}>
        <Spring ref={mainSpring} a={[0, 0.02, 0]} b={[0, 0.3, 0]} r={0.19} turns={6} wire={0.024} m={a.springMat} />
      </Part>
      <Part id="guide-discs">
        {[1.0, 2.62].map((y) => <mesh key={y + tl} position={[0, y, 0]} material={a.card}><cylinderGeometry args={[R - 0.04, R - 0.04, 0.03, 48, 1, false, t0, tl]} /></mesh>)}
      </Part>
      <Part id="catch-lever" explode={[0.3, 0, -1]}>
        <group ref={lever} position={[0.37, 0.62, 0]}>
          <Rod a={[0.27, -0.2, 0]} b={[-0.27, 0.2, 0]} r={0.03} m={a.stickMat} />
          <Bx s={[0.08, 0.06, 0.06]} p={[-0.29, 0.2, 0]} m={a.stickMat} />
        </group>
        <mesh position={[0.37, 0.62, 0]} rotation={[HALF, 0, 0]} material={a.brass}><cylinderGeometry args={[0.03, 0.03, 0.2, 10]} /></mesh>
      </Part>
      <Part id="catch-spring" explode={[0.3, 0.4, -1]}>
        <Spring a={[R - 0.06, 0.95, 0]} b={[0.28, 0.76, 0]} r={0.03} turns={6} wire={0.007} m={a.springMat} />
      </Part>
      <Part id="button" explode={[1.4, 0, 0]}>
        <group ref={button}>
          <Rod a={[0.64, BUTTON_Y, 0]} b={[1.5, BUTTON_Y, 0]} r={0.065} m={a.stickMat} />
          <mesh position={[1.54, BUTTON_Y, 0]} rotation={[0, 0, HALF]} material={a.brass}><cylinderGeometry args={[0.15, 0.15, 0.08, 24]} /></mesh>
          <mesh position={[1.59, BUTTON_Y, 0]} material={a.jewel}><sphereGeometry args={[0.06, 12, 8]} /></mesh>
        </group>
      </Part>
      <Part id="button-spring" explode={[0.9, 0.3, 0]}>
        <group position={[R + 0.31, BUTTON_Y, 0]} rotation={[0, 0, -HALF]}>
          <mesh ref={btnSpring} material={a.springMat}><primitive attach="geometry" object={springGeoX()} /></mesh>
        </group>
      </Part>
      <Part id="microswitch" explode={[0.3, 0, 0.8]}>
        <Bx s={[0.16, 0.1, 0.12]} p={[0.62, 0.26, 0.16]} m={a.microMat} />
        <Bx s={[0.14, 0.01, 0.03]} p={[0.58, 0.32, 0.12]} r={[0, 0.6, 0.25]} m={a.springMat} />
      </Part>

      {/* lotus servo in the bay, horn lifts the rod foot */}
      <Part id="servo-lotus" explode={[0, -1.6, 0]}>
        <group position={[0, -0.5, 0]}>
          <Bx s={[0.46, 0.45, 0.24]} p={[0, 0, 0]} m={a.servoMat} />
          <Bx s={[0.64, 0.03, 0.24]} p={[0, 0.12, 0]} m={a.servoMat} />
          <mesh position={[0.11, 0.27, 0]} material={a.hornMat}><cylinderGeometry args={[0.07, 0.07, 0.1, 16]} /></mesh>
          <group ref={horn} position={[0.11, 0.33, 0.13]}>
            <Bx s={[0.3, 0.06, 0.03]} p={[0.12, 0, 0]} m={a.hornMat} />
          </group>
        </group>
        <DynRod ref={link} r={0.012} m={a.springMat} />
        {[-0.13, 0.13].map((z) => <Bx key={z} s={[0.6, 0.04, 0.05]} p={[0, -0.25, z]} m={a.darkBrass} />)}
      </Part>

      {/* ───── copper lotus ───── */}
      <Part id="petals" explode={[0, 1.4, 0]}>
        <mesh position={[0, CH + 0.12, 0]} material={a.brass}><cylinderGeometry args={[0.3, 0.22, 0.26, 24]} /></mesh>
        {Array.from({ length: 7 }, (_, j) => { const ang = j * TAU / 7; return <mesh key={j} position={[Math.cos(ang) * 0.16, CH + 0.26, Math.sin(ang) * 0.16]} material={a.darkBrass}><sphereGeometry args={[0.045, 10, 8]} /></mesh>; })}
        {LEAF_ANGLES.map((ang, k) => (
          <group key={k} position={[Math.sin(ang) * (k % 2 ? 0.46 : 0.36), CH + 0.04, Math.cos(ang) * (k % 2 ? 0.46 : 0.36)]} rotation={[0, ang, 0, 'YXZ']} scale={0.75}
            ref={(g) => { if (g) { petals.current[k] = g; rig.petals[k] = g; } }}>
            <mesh geometry={a.geo.petal} material={a.copper} />
            <group position={[0, 1, -0.06]}><Part id="coins"><Coin k={k} r={0.3} th={0.06} mats={a.coinMats} /></Part></group>
          </group>
        ))}
      </Part>
      <Part id="collar-struts" explode={[0, 1.0, 0]}>
        <mesh ref={collar} position={[0, 3.06, 0]} material={a.brass}><boxGeometry args={[0.2, 0.12, 0.2]} /></mesh>
        {LEAF_ANGLES.map((_, k) => <DynRod key={k} ref={(m) => { if (m) struts.current[k] = m; }} r={0.02} m={a.stickMat} />)}
      </Part>

      <Part id="neopixel" explode={[0, 0.7, 0]}>
        <mesh position={[0, CH + 0.03, 0]} rotation={[-HALF, 0, 0]} material={a.blk}><ringGeometry args={[0.43, 0.58, 40]} /></mesh>
        <instancedMesh ref={(m) => {
          if (!m) return; leds.current = m; const o = new THREE.Object3D();
          ledAngles.forEach((ang, j) => { o.position.set(Math.sin(ang) * 0.5, CH + 0.06, Math.cos(ang) * 0.5); o.updateMatrix(); m.setMatrixAt(j, o.matrix); m.setColorAt(j, new THREE.Color(0x222018)); });
          m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); ledVersion.current = -1;
        }} args={[undefined, undefined, 8]} userData={{ noDim: true }}>
          <sphereGeometry args={[0.04, 10, 8]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
        {ledAngles.map((ang, j) => (
          <sprite key={j} ref={(s) => { if (s) glows.current[j] = s; }} material={glowMats[j]} position={[Math.sin(ang) * 0.5, CH + 0.08, Math.cos(ang) * 0.5]} scale={0.42} userData={{ noDim: true }} />
        ))}
      </Part>

      <Clothespins a={a} />
    </group>
  );
}

let sx: THREE.BufferGeometry | null = null;
/** unit spring along +Y (rotated to point along +X by its parent) */
function springGeoX() {
  if (!sx) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) { const t = i / 120, ang = t * 6 * TAU; pts.push(new THREE.Vector3(0.1 * Math.cos(ang), t, 0.1 * Math.sin(ang))); }
    sx = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.01, 6, false);
  }
  return sx;
}

/** Clothespin torsion springs at the wall hinges (from the cutaway). */
function Clothespins({ a }: { a: Assets }) {
  const spots: [number, number, 'x' | 'z'][] = [[-P + 0.14, 1.3, 'z'], [-P + 0.14, -1.3, 'z'], [P - 0.14, 1.3, 'z'], [P - 0.14, -1.3, 'z'], [1.3, P - 0.14, 'x'], [-1.3, P - 0.14, 'x']];
  return (
    <Part id="clothespins" explode={[0, 0.3, 0]}>
      {spots.map(([x, z, axis]) => {
        const inward: [number, number, number] = [-Math.sign(x) * (axis === 'z' ? 1 : 0), 0, -Math.sign(z) * (axis === 'x' ? 1 : 0)];
        const sa: [number, number, number] = axis === 'z' ? [0, 0, -0.08] : [-0.08, 0, 0];
        const sb: [number, number, number] = axis === 'z' ? [0, 0, 0.08] : [0.08, 0, 0];
        return (
          <group key={`${x}${z}`} position={[x, 0.12, z]}>
            <Spring a={sa} b={sb} r={0.06} turns={4} wire={0.014} m={a.springMat} />
            <Bx s={[0.025, 0.32, 0.025]} p={[-inward[0] * 0.04, 0.18, -inward[2] * 0.04]} m={a.springMat} />
            <Bx s={axis === 'z' ? [0.3, 0.025, 0.025] : [0.025, 0.025, 0.3]} p={[inward[0] * 0.15, -0.04, inward[2] * 0.15]} m={a.springMat} />
          </group>
        );
      })}
    </Part>
  );
}
