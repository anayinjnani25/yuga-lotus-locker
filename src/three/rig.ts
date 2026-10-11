import type * as THREE from 'three';

/** Live object references shared between model files (leaf anchors, ring, petals...). */
export const rig: {
  leafAnchors: (THREE.Object3D | null)[];
  ring: THREE.Object3D | null;
  petals: (THREE.Object3D | null)[];
} = { leafAnchors: [null, null, null, null], ring: null, petals: [null, null, null, null] };
