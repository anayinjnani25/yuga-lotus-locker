// Electronics bay and colour-coded wiring, positions from the cutaway reference.
// Every wire carries a wireId that matches `connections[].wires` in src/data/parts.ts.
import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Assets } from './assets';
import { Part, explodeNow } from './Part';
import { Bx, Wire } from './bits';
import { pose } from './pose';
import { R, CH, T, BH, P, FY, BAND_Y, LEAF_ANGLES, BUTTON_Y } from './dims';

const PUR = 0x8e5bd8, GRN = 0x2fb36b, YEL = 0xe2c23a, BLU = 0x3a7fd6, RED = 0xd8402f, BLK = 0x222222, ORG = 0xe07a2f, BRN = 0x6b3a1e;
type V3 = [number, number, number];

export function Electronics({ a }: { a: Assets }) {
  const lidHorn = useRef<THREE.Group>(null!);
  const wires = useRef<THREE.Group>(null!);
  useFrame(() => {
    lidHorn.current.rotation.y = pose.lidServo * (Math.PI / 2);
    wires.current.visible = explodeNow() < 0.04; // wires don't follow exploded parts
  });

  const ux = -1.15, uz = -1.05, uy = FY + 0.03;
  const px = 0.72, pz = -1.45;
  const bx = 1.05, bz = 0.45, by = FY + 0.09;
  const pcfY = FY + 0.08;

  return (
    <group>
      <Part id="arduino" explode={[-0.6, -1.8, -0.4]}>
        <Bx s={[1.37, 0.04, 1.07]} p={[ux, uy, uz]} m={[a.blk, a.blk, a.unoMat, a.blk, a.blk, a.blk]} />
        <Bx s={[0.8, 0.1, 0.06]} p={[ux + 0.15, uy + 0.07, uz - 0.48]} m={a.blk} />
        <Bx s={[0.95, 0.1, 0.06]} p={[ux + 0.1, uy + 0.07, uz + 0.48]} m={a.blk} />
        <Bx s={[0.62, 0.08, 0.18]} p={[ux + 0.12, uy + 0.06, uz + 0.12]} m={a.blk} />
        <Bx s={[0.32, 0.22, 0.4]} p={[ux - 0.6, uy + 0.12, uz - 0.25]} m={a.silver} />
        <Bx s={[0.3, 0.24, 0.3]} p={[ux - 0.6, uy + 0.13, uz + 0.3]} m={a.blk} />
        <Bx s={[0.12, 0.05, 0.06]} p={[ux + 0.4, uy + 0.05, uz - 0.15]} m={a.silver} />
      </Part>

      <Part id="pcf8574" explode={[0.4, -1.8, -0.6]}>
        <Bx s={[0.74, 0.03, 0.32]} p={[px, uy, pz]} m={[a.blk, a.blk, a.pcfMat, a.blk, a.blk, a.blk]} />
        <Bx s={[0.26, 0.06, 0.12]} p={[px, uy + 0.04, pz]} m={a.blk} />
        <Bx s={[0.06, 0.12, 0.3]} p={[px + 0.34, uy + 0.07, pz]} m={a.blk} />
        <Bx s={[0.06, 0.12, 0.3]} p={[px - 0.34, uy + 0.07, pz]} m={a.blk} />
      </Part>

      <Part id="breadboard" explode={[0.6, -1.8, 0.4]}>
        <Bx s={[1.64, 0.18, 1.1]} p={[bx, by, bz]} m={[a.bbMat, a.bbMat, a.breadboardTop, a.bbMat, a.bbMat, a.bbMat]} />
        <Wire id="power" pts={[[bx - 0.6, by + 0.1, bz + 0.1], [bx - 0.25, by + 0.28, bz], [bx + 0.1, by + 0.1, bz - 0.1]]} color={RED} r={0.014} />
        <Wire id="power" pts={[[bx - 0.3, by + 0.1, bz - 0.1], [bx, by + 0.28, bz + 0.1], [bx + 0.3, by + 0.1, bz + 0.1]]} color={GRN} r={0.014} />
      </Part>
      <Part id="capacitor" explode={[0.9, -1.6, 0.8]}>
        <mesh position={[bx + 0.6, by + 0.21, bz + 0.3]} material={a.capMat}><cylinderGeometry args={[0.09, 0.09, 0.24, 20]} /></mesh>
        <mesh position={[bx + 0.6, by + 0.335, bz + 0.3]} material={a.silver}><cylinderGeometry args={[0.085, 0.085, 0.01, 20]} /></mesh>
      </Part>
      <Part id="resistor" explode={[0.6, -1.4, 0.9]}>
        <mesh position={[bx - 0.35, by + 0.14, bz + 0.38]} rotation={[0, 0, Math.PI / 2]} material={a.ivory}><cylinderGeometry args={[0.035, 0.035, 0.16, 12]} /></mesh>
        {[-0.04, 0, 0.04].map((o, i) => (
          <mesh key={o} position={[bx - 0.35 + o, by + 0.14, bz + 0.38]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.037, 0.037, 0.012, 12]} />
            <meshStandardMaterial color={[0xe07a2f, 0xe07a2f, 0x6b3a1e][i]} />
          </mesh>
        ))}
        <mesh position={[bx - 0.35, by + 0.11, bz + 0.38]} rotation={[0, 0, Math.PI / 2]} material={a.springMat}><cylinderGeometry args={[0.005, 0.005, 0.34, 6]} /></mesh>
      </Part>
      <Part id="buzzer" explode={[-0.3, -1.6, 1]}>
        <mesh position={[-0.2, FY + 0.06, 1.3]} material={a.blk}><cylinderGeometry args={[0.12, 0.12, 0.12, 24]} /></mesh>
        <mesh position={[-0.2, FY + 0.121, 1.3]} rotation={[-Math.PI / 2, 0, 0]} material={a.holeMat}><circleGeometry args={[0.03, 12]} /></mesh>
      </Part>
      <Part id="servo-lid" explode={[-1, -1.4, 0.6]}>
        <group position={[-1.35, FY + 0.15, 1.15]} rotation={[0, 0, Math.PI / 2]}>
          <Bx s={[0.46, 0.45, 0.24]} p={[0, 0, 0]} m={a.servoMat} />
          <Bx s={[0.64, 0.03, 0.24]} p={[0, 0.12, 0]} m={a.servoMat} />
          <mesh position={[0.11, 0.27, 0]} material={a.hornMat}><cylinderGeometry args={[0.07, 0.07, 0.1, 16]} /></mesh>
          <group ref={lidHorn} position={[0.11, 0.33, 0]}>
            <Bx s={[0.5, 0.03, 0.08]} p={[0.2, 0, 0]} m={a.hornMat} />
          </group>
        </group>
      </Part>
      <Part id="power-adapter" explode={[-0.8, -1.2, -1]}>
        <Wire id="dc-in" pts={[[-1.8, FY + 0.13, -0.75], [-1.95, FY + 0.2, -1.6], [-1.7, FY + 0.15, -2.6]]} color={0x111111} r={0.03} />
        <Bx s={[0.22, 0.16, 0.22]} p={[-1.8, FY + 0.1, -0.7]} m={a.blk} />
      </Part>

      <group ref={wires}>
        <Part id="wiring">
          {/* I2C, Uno → PCF8574 and Uno → LCD */}
          <Wire id="i2c-pcf" pts={[[-0.55, pcfY + 0.05, -1.4], [0, pcfY + 0.35, -1.55], [0.4, pcfY + 0.05, -1.48]]} color={GRN} />
          <Wire id="i2c-pcf" pts={[[-0.55, pcfY + 0.05, -1.35], [0, pcfY + 0.3, -1.45], [0.4, pcfY + 0.05, -1.42]]} color={YEL} />
          <Wire id="i2c-lcd" pts={[[-0.55, pcfY + 0.05, -0.6], [0.1, FY + 0.55, 0.8], [0.62, -T - BH / 2, P - T / 2 - 0.14]]} color={GRN} r={0.015} />
          <Wire id="i2c-lcd" pts={[[-0.5, pcfY + 0.05, -0.6], [0.16, FY + 0.5, 0.8], [0.7, -T - BH / 2, P - T / 2 - 0.14]]} color={YEL} r={0.015} />
          {/* +5 V and GND, Uno ↔ breadboard rail */}
          <Wire id="power" pts={[[-0.5, pcfY + 0.05, -0.55], [0, pcfY + 0.4, -0.2], [0.4, FY + 0.2, 0]]} color={RED} />
          <Wire id="power" pts={[[-0.5, pcfY + 0.05, -0.6], [0.05, pcfY + 0.35, -0.3], [0.45, FY + 0.2, -0.05]]} color={BLK} />
          {/* PCF8574 → band reeds (P4–P6) and ring reed (P7) */}
          {[...BAND_Y, 0.45].map((ty, i) => {
            const o = i * 0.045;
            const end: V3 = i < 3 ? [o - 0.02, ty - 0.12, R - 0.1] : [0.5, BUTTON_Y + 0.18, R * 0.6 - 0.05];
            return <Wire key={i} id={i < 3 ? `band-${i + 1}` : 'ring'} pts={[[1.0 + o, pcfY + 0.04, -1.42], [0.95 + o, FY + 0.6, -0.9], [0.45 + o, -0.25, -0.2], [0.15 + o, 0.05, 0.55], [0.1 + o * 0.6, 0.3, R - 0.12], end]} color={PUR} r={0.016} />;
          })}
          {/* PCF8574 → leaf socket reeds (P0–P3) */}
          {LEAF_ANGLES.map((ang, i) => {
            const o = i * 0.045;
            return <Wire key={ang} id={`leaf-${i}`} pts={[[0.5 + o, pcfY + 0.04, -1.42], [0.4 + o, FY + 0.7, -0.9], [0.25, -0.3, -0.25], [0.15 * Math.sin(ang), 0.08, 0.15 * Math.cos(ang)], [Math.sin(ang) * 0.6, 0.3, Math.cos(ang) * 0.6], [Math.sin(ang) * (R + 0.1), 0.43, Math.cos(ang) * (R + 0.1)]]} color={PUR} r={0.014} />;
          })}
          {/* button microswitch → A0 */}
          <Wire id="button" pts={[[-0.6, pcfY + 0.06, -0.55], [0.75, -0.6, 0.2], [0.66, 0, 0.2], [0.62, 0.24, 0.16]]} color={PUR} r={0.016} />
          {/* lid reed → A1 (bay part; the wall part rides on the front wall) */}
          <Wire id="lid-reed" pts={[[-0.65, pcfY + 0.06, -0.55], [0.4, FY + 0.6, 1.2], [1.0, -0.3, P - T / 2 - 0.08], [1.0, 0.1, P - T / 2 - 0.08]]} color={PUR} r={0.014} />
          {/* buzzer → D12 */}
          <Wire id="buzzer" pts={[[-0.75, pcfY + 0.06, -0.55], [-0.5, FY + 0.45, 0.6], [-0.22, FY + 0.13, 1.25]]} color={ORG} r={0.014} />
          {/* lotus servo leads */}
          {([[BRN, -0.04], [RED, 0], [ORG, 0.04]] as [number, number][]).map(([c, o]) => <Wire key={c} id="servo-lotus" pts={[[-0.12, -0.75, 0.12 + o], [0.2, FY + 0.5, 0.3 + o], [0.6, FY + 0.2, 0.3 + o]]} color={c} r={0.014} />)}
          {/* lid latch servo leads */}
          {([[BRN, -0.04], [RED, 0], [ORG, 0.04]] as [number, number][]).map(([c, o]) => <Wire key={c} id="servo-lid" pts={[[-1.35, FY + 0.3, 0.9 + o], [-1.1, FY + 0.45, 0.2 + o], [-0.9, pcfY + 0.06, -0.5 + o]]} color={c} r={0.014} />)}
          {/* keypad ribbon, 7 wires */}
          {Array.from({ length: 7 }, (_, i) => { const o = (i - 3) * 0.035; return <Wire key={i} id="keypad" pts={[[-1.55 + o, pcfY + 0.06, -0.5], [-1.5 + o, FY + 0.5, 0.6], [-1.0 + o, -T - BH / 2, P - T / 2 - 0.05]]} color={BLU} r={0.012} />; })}
          {/* NeoPixel feed up the tube: +5 V, GND, data from D11 via 330 Ω */}
          {([[RED, 0], [BLK, 0.04], [BLU, 0.08]] as [number, number][]).map(([c, o]) => <Wire key={c} id="neopixel" pts={[[1.3 + o, FY + 0.2, 0.2], [0.5, -0.2, 0.1], [-0.35 + o, 0.3, 0.65], [-0.38 + o, 1.6, R - 0.1], [-0.3 + o, 2.7, R - 0.12], [-0.1 + o, CH + 0.05, 0.35]]} color={c} r={0.014} />)}
        </Part>
      </group>
    </group>
  );
}
