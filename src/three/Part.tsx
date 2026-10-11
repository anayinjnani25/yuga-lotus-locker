// <Part id> tags every mesh inside it with a part id, handles hover/click,
// shows only the parts used by the current version, and applies the exploded-view offset.
import * as THREE from 'three';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useStore } from '../store';
import { PART_BY_ID, visibleInMode } from '../data/parts';

type V3 = [number, number, number];

/** id → every group registered for that part (some parts appear in several places). */
export const registry = new Map<string, Set<THREE.Object3D>>();
let smoothExplode = 0;
export const explodeNow = () => smoothExplode;
export function tickExplode(dt: number) {
  const target = useStore.getState().explode;
  smoothExplode += (target - smoothExplode) * Math.min(1, dt * 8);
  if (Math.abs(target - smoothExplode) < 1e-3) smoothExplode = target;
}

export function Part({ id, children, explode, position = [0, 0, 0], rotation }: {
  id: string; children: ReactNode; explode?: V3; position?: V3; rotation?: V3;
}) {
  const ref = useRef<THREE.Group>(null!);
  const mode = useStore((s) => s.mode);
  const part = PART_BY_ID[id];
  if (!part) throw new Error('Unknown part id ' + id);
  const visible = visibleInMode(part, mode);

  useLayoutEffect(() => {
    const g = ref.current;
    g.userData.partId = id;
    let set = registry.get(id);
    if (!set) registry.set(id, (set = new Set()));
    set.add(g);
    return () => { set!.delete(g); };
  }, [id]);

  useFrame(() => {
    if (!explode) return;
    const e = smoothExplode;
    ref.current.position.set(position[0] + explode[0] * e, position[1] + explode[1] * e, position[2] + explode[2] * e);
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    useStore.setState({ hovered: id, hoverXY: [e.nativeEvent.clientX, e.nativeEvent.clientY] });
    document.body.style.cursor = 'pointer';
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (useStore.getState().hovered !== id) useStore.setState({ hovered: id });
    useStore.setState({ hoverXY: [e.nativeEvent.clientX, e.nativeEvent.clientY] });
  };
  const out = () => {
    if (useStore.getState().hovered === id) useStore.setState({ hovered: null });
    document.body.style.cursor = '';
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return; // that was a drag, not a click
    e.stopPropagation();
    if (useStore.getState().route !== 'explore') return;
    useStore.getState().select(id);
  };

  return (
    <group ref={ref} position={position} rotation={rotation} visible={visible}
        onPointerOver={over} onPointerMove={move} onPointerOut={out} onClick={click}>
        {children}
    </group>
  );
}
