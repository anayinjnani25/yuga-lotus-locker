// Dims, ghosts, glows or hides meshes by swapping in cached material variants.
// Runs only when the view state changes, never per frame.
import * as THREE from 'three';
import { PART_BY_ID } from '../data/parts';

type State = 'normal' | 'dim' | 'ghost' | 'glow';
const cache = new Map<string, THREE.Material>();
const noRaycast = () => {};
/** Large panels that would haze a close-up: fade them further when another part is selected. */
const BIG = new Set(['wall-front', 'wall-left', 'wall-right', 'back-acrylic', 'lid', 'base', 'core-tube', 'guide-discs']);

function variant(m: THREE.Material, s: State): THREE.Material {
  if (s === 'normal') return m;
  const key = m.uuid + s;
  let v = cache.get(key);
  if (!v) {
    v = m.clone();
    if (s === 'glow') {
      const sm = v as THREE.MeshStandardMaterial;
      if (sm.emissive) { sm.emissive.set(0xff9a3c); sm.emissiveIntensity = 0.85; }
      else if ((v as THREE.MeshBasicMaterial).color) (v as THREE.MeshBasicMaterial).color.lerp(new THREE.Color(0xffb060), 0.5);
    } else {
      v.transparent = true;
      v.opacity = m.opacity * (s === 'dim' ? 0.08 : 0.035);
      v.depthWrite = false;
    }
    cache.set(key, v);
  }
  return v;
}

function worldVisible(o: THREE.Object3D) {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}
function tagOf(o: THREE.Object3D, key: 'partId' | 'wireId') {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p.userData[key]) return p.userData[key] as string;
  return null;
}

export interface DisplayOpts {
  selected: string | null;
  glow: { parts: string[]; wires: string[] } | null;
  wiringOnly: boolean;
}

export function applyDisplay(root: THREE.Object3D, o: DisplayOpts) {
  const selWires = new Set(o.selected ? PART_BY_ID[o.selected]?.connections.flatMap((c) => c.wires ?? []) : []);
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const ud = mesh.userData;
    if (!ud.shadowSet) {
      ud.shadowSet = true;
      const mats = ([] as THREE.Material[]).concat(mesh.material);
      const transparent = mats.some((m) => m.transparent);
      if (!tagOf(mesh, 'noShadow' as 'partId') && !transparent) { mesh.castShadow = true; mesh.receiveShadow = true; }
    }
    if (ud.noDim || ud.isHull) return;
    const partId = tagOf(mesh, 'partId');
    const wireId = tagOf(mesh, 'wireId');
    if (!partId) return;
    if (ud.baseMat === undefined) { ud.baseMat = mesh.material; ud.baseRaycast = mesh.raycast; }

    let s: State = 'normal';
    const part = PART_BY_ID[partId];
    if (o.glow && (o.glow.parts.includes(partId) || (wireId && o.glow.wires.includes(wireId)))) s = 'glow';
    else if (o.selected) s = partId === o.selected || (wireId && selWires.has(wireId)) ? 'normal' : BIG.has(partId) ? 'ghost' : 'dim';
    else if (o.wiringOnly) s = part && (part.version === 'electronic') ? 'normal' : 'ghost';

    const base = ud.baseMat as THREE.Material | THREE.Material[];
    mesh.material = Array.isArray(base) ? base.map((m) => variant(m, s)) : variant(base, s);
    mesh.raycast = (s === 'ghost' && !o.selected) || (s === 'ghost' && BIG.has(partId)) || !worldVisible(mesh) ? noRaycast : ud.baseRaycast;
  });
}
