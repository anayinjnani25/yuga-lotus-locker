// Leaf and petal surface functions from the reference files (u in -1..1, v in 0..1).
export const LL = 2.3, LW = 0.58;
const lw = (v: number) => Math.pow(Math.sin(Math.PI * Math.pow(v, 0.62)), 1.25) + 0.35 * Math.pow(1 - v, 3);
export function leafPt(u: number, v: number): [number, number, number] {
  const w = LW * lw(v);
  return [u * w, v * LL - 0.12 * LL * Math.abs(u) * Math.pow(1 - v, 2),
    -0.16 * Math.abs(u) * w + 0.1 * Math.sin(Math.PI * v) + 0.03 * Math.sin(v * 20) * Math.pow(Math.abs(u), 3)];
}
export const PL = 2.4, PW = 0.62;
const pw = (v: number) => 0.25 * (1 - v) + Math.pow(Math.sin(Math.PI * Math.pow(v, 0.8)), 0.85);
export function petalPt(u: number, v: number): [number, number, number] {
  const w = PW * pw(v);
  return [u * w, v * PL, -0.4 * u * u * w + 0.22 * Math.pow(v, 3) - 0.05 * Math.sin(Math.PI * v)];
}
