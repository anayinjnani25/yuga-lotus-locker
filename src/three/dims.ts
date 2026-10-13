// Dimensions and positions from reference/yuga-locker-cutaway.html (the source of truth).
export const S = 4.4, T = 0.14, HW = 4.6, BH = 1.56;
export const P = S / 2 + T / 2;          // wall centre line
export const FY = -T - BH;               // electronics bay floor top
export const R = 0.9, CH = 2.8;          // core tube radius and height
export const TH0 = (-110 * Math.PI) / 180, THL = (220 * Math.PI) / 180; // cutaway tube arc
export const WZ = P - T / 2 - 0.42, WYc = 4.05; // dial lock axle
/** band 1 (top), band 2 (middle), band 3 (bottom), as in the firmware */
export const BAND_Y = [2.35, 1.8, 1.25];
export const LEAF_ANGLES = [45, 135, -135, -45].map((d) => (d * Math.PI) / 180);
export const RING_START = -1.35;         // ring angle at its stopper (about a quarter turn)
export const LIFT = 0.45;                // push-rod rise (2–3 cm at this scale)
export const LID_OPEN = 1.9;             // lid prop angle in the cutaway
export const BUTTON_Y = 0.42;
/** Piggy-bank drawer layer under the electronics bay. */
export const DRAWER_H = 0.55;
