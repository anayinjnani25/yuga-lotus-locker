// Cheap selection outline: an inverted hull pushed out by a constant number of pixels
// along smoothed normals, added only to the hovered / selected part's meshes.
import * as THREE from 'three';
import { registry } from './Part';

const vert = /* glsl */ `
attribute vec3 oNormal;
uniform float px;
uniform vec2 res;
void main() {
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vec3 vn = normalize(normalMatrix * oNormal);
  vec2 dir = (projectionMatrix * vec4(vn, 0.0)).xy;
  float l = length(dir);
  if (l > 1e-5) dir /= l;
  clip.xy += dir * px * 2.0 / res * clip.w;
  gl_Position = clip;
}`;
const frag = /* glsl */ `
uniform vec3 color;
void main() { gl_FragColor = vec4(color, 1.0); }`;

const res = { value: new THREE.Vector2(1, 1) };
function mat(color: number, px: number) {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, px: { value: px }, res },
    vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, toneMapped: false,
  });
}
const HOVER = mat(0xffc46b, 2.2), SELECT = mat(0xffa640, 3);
export function setOutlineResolution(w: number, h: number) { res.value.set(w, h); }

/** Average normals of vertices that share a position, so split-normal boxes get a closed hull. */
function smooth(geo: THREE.BufferGeometry) {
  if (geo.getAttribute('oNormal')) return;
  const pos = geo.getAttribute('position'), nor = geo.getAttribute('normal');
  if (!pos || !nor) return;
  const acc = new Map<string, THREE.Vector3>(), keys: string[] = [];
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    keys.push(k);
    let v = acc.get(k); if (!v) acc.set(k, (v = new THREE.Vector3()));
    v.x += nor.getX(i); v.y += nor.getY(i); v.z += nor.getZ(i);
  }
  const out = new Float32Array(pos.count * 3);
  keys.forEach((k, i) => { const v = acc.get(k)!.clone().normalize(); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z; });
  geo.setAttribute('oNormal', new THREE.BufferAttribute(out, 3));
}

const hulls: THREE.Mesh[] = [];
const noRaycast = () => {};

export function applyOutlines(hovered: string | null, selected: string | null) {
  hulls.splice(0).forEach((h) => h.parent?.remove(h));
  const add = (id: string | null, m: THREE.Material) => {
    if (!id) return;
    registry.get(id)?.forEach((g) => g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || (mesh as THREE.InstancedMesh).isInstancedMesh || mesh.userData.isHull || !mesh.geometry) return;
      if (mesh.geometry.type === 'PlaneGeometry' || mesh.geometry.type === 'CircleGeometry' || mesh.geometry.type === 'RingGeometry') return;
      smooth(mesh.geometry);
      if (!mesh.geometry.getAttribute('oNormal')) return;
      const h = new THREE.Mesh(mesh.geometry, m);
      h.userData.isHull = true; h.raycast = noRaycast; h.renderOrder = -1;
      mesh.add(h); hulls.push(h);
    }));
  };
  add(selected, SELECT);
  if (hovered !== selected) add(hovered, HOVER);
}
