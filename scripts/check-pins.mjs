// Verifies every pin in src/data/parts.ts against firmware/yuga_lotus_locker_v2.ino.
// Usage: node scripts/check-pins.mjs
import { readFileSync } from 'node:fs';

const fw = readFileSync('firmware/yuga_lotus_locker_v2.ino', 'utf8');
const parts = readFileSync('src/data/parts.ts', 'utf8');
const arr = (name) => fw.match(new RegExp(name + String.raw`\[[^\]]*\]\s*=\s*\{([^}]*)\}`))[1].split(',').map((s) => s.trim());
const num = (name) => fw.match(new RegExp(name + String.raw`\s*=\s*(\w+)`))[1];

const want = {};
arr('rowPins').forEach((p, i) => (want[`rowPins[${i}]`] = 'D' + p));
arr('colPins').forEach((p, i) => (want[`colPins[${i}]`] = 'D' + p));
for (const n of ['PIN_LID_SERVO', 'PIN_LOTUS_SERVO', 'PIN_LEDS', 'PIN_BUZZER']) want[n] = 'D' + num(n);
for (const n of ['PIN_BUTTON', 'PIN_LID_CLOSED']) want[n] = num(n);
arr('BIT_LEAF').forEach((p, i) => (want[`BIT_LEAF[${i}]`] = 'P' + p));
arr('BIT_BAND').forEach((p, i) => (want[`BIT_BAND[${i}]`] = 'P' + p));
want.BIT_RING = 'P' + num('BIT_RING');

let bad = 0, n = 0;
for (const m of parts.matchAll(/pin: '([^']+)', code: '([^']+)'/g)) {
  const [, pin, code] = m;
  if (!(code in want)) continue;
  n++;
  if (want[code] !== pin) { bad++; console.log(`MISMATCH ${code}: site says ${pin}, firmware says ${want[code]}`); }
}
console.log('firmware pins:', want);
console.log(`${n} pin references checked, ${bad} mismatches`);
process.exit(bad ? 1 : 0);
