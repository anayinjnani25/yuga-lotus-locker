// The guided play-through. Animations follow reference/lotus-locker-3d.html; LCD text and LED
// colours follow firmware/yuga_lotus_locker_v2.ino (show(), yugaLeds(), the PUZZLE band LEDs).
import { animateTo, wait, setLeds, LOCKED_POSE, clonePose, pose, type Pose } from '../three/pose';
import { drawLcd } from '../three/assets';
import { useStore, type Mode } from '../store';
import { YUGAS, rgbCss } from './yugas';

type V3 = [number, number, number];
export interface Step {
  n: number;
  title: string;
  sub: string;
  caption: Record<Mode, string>;
  parts: Record<Mode, string[]>;
  view: Record<Mode, { pos: V3; target: V3 }>;
  endPose: Pose;
  endLcd: [string, string];
  endLeds: (string | null)[];
  run: (mode: Mode) => Promise<void>;
}

const OFF = Array(8).fill(null) as (string | null)[];
const Y = YUGAS.map((y) => rgbCss(y.rgb));
const ALL = [Y[0], Y[0], Y[1], Y[1], Y[2], Y[2], Y[3], Y[3]];
const RED = 'rgb(160,20,10)', GREEN = 'rgb(20,190,40)'; // firmware uses (40,0,0) and (0,120,0), brightened for the screen

export function lcd(a: string, b: string) { drawLcd(a, b); useStore.setState({ lcd: [a, b] }); }
export function leds(c: (string | null)[]) { setLeds(c); useStore.setState({ leds: c.slice() }); }

const p0 = clonePose(LOCKED_POSE);
const p1: Pose = { ...clonePose(p0), wheels: 1, bolt: 1, lidServo: 1, lid: 1 };
const p2: Pose = { ...clonePose(p1), walls: 1 };
const p3: Pose = { ...clonePose(p2), bands: [0, 0, 0] };
const p4: Pose = { ...clonePose(p3), leaves: [1, 1, 1, 1], ring: 1 };
const p5: Pose = { ...clonePose(p4), fire: 1, button: 0 };
const p6: Pose = { ...clonePose(p5), drawer: 1 };

const both = <T,>(v: T): Record<Mode, T> => ({ electronic: v, mechanical: v });

export const STEPS: Step[] = [
  {
    n: 0, title: 'Locked', sub: 'The box as the child finds it',
    caption: {
      electronic: 'The box is shut. The screen asks for a code, and every puzzle inside is scrambled. Coins can still be saved: one drops through the slot in the lid and down the clear chute into the locked treasury drawer.',
      mechanical: 'The box is shut. The number wheels show a wrong code, and every puzzle inside is scrambled. Coins can still be saved: one drops through the slot in the lid and down the clear chute into the locked treasury drawer.',
    },
    parts: { electronic: ['lid', 'keypad', 'lcd', 'coin-slot', 'coin-chute', 'treasury-drawer'], mechanical: ['lid', 'number-wheels', 'bolt', 'coin-slot', 'coin-chute', 'treasury-drawer'] },
    view: both({ pos: [7.5, 6.5, -10.5] as V3, target: [1.2, 0.6, -1.2] as V3 }),
    endPose: p0, endLcd: ['Yuga Lotus Box', 'Code: '], endLeds: OFF,
    run: async () => { await wait(400); await animateTo({ coin: 1 }, 1500); pose.coin = 0; },
  },
  {
    n: 1, title: 'Code lock', sub: 'Enter 1709 · the lid pops up',
    caption: {
      electronic: 'The child types 1709. Each key beeps and adds a star. The code matches SECRET_CODE, so the latch servo on D9 swings from 0° to 90°, freeing the lid hook, and the lid lifts.',
      mechanical: 'The child turns the four number wheels to 1-7-0-9. All four notches now face the bolt, so its spring pulls it in. The bolt leaves the hook\'s eye and the pen spring pops the lid up.',
    },
    parts: { electronic: ['keypad', 'lcd', 'arduino', 'servo-lid', 'lid-hook', 'buzzer'], mechanical: ['number-wheels', 'bolt', 'lid-hook', 'lid-spring', 'lid'] },
    view: {
      electronic: { pos: [5.6, 7.4, 15.5], target: [0, 2.3, 0] },
      mechanical: { pos: [-2.6, 6.8, -5.4], target: [0.2, 3.8, 1.5] },
    },
    endPose: p1, endLcd: ['Unlocked!', 'Open the box'], endLeds: OFF,
    run: async (mode) => {
      if (mode === 'electronic') {
        for (let i = 1; i <= 4; i++) { await wait(450); lcd('Yuga Lotus Box', 'Code: ' + '*'.repeat(i)); }
        await wait(500);
        lcd('Unlocked!', 'Open the box');
        await animateTo({ lidServo: 1 }, 700);
        await animateTo({ lid: 1 }, 1100);
      } else {
        await animateTo({ wheels: 1 }, 2200);
        await animateTo({ bolt: 1 }, 500);
        await animateTo({ lid: 1 }, 1100);
      }
    },
  },
  {
    n: 2, title: 'Walls fold open', sub: 'Clothespin springs at the hinges',
    caption: {
      electronic: 'With the lid up, the four carved walls fold outward, showing the yuga panels painted inside. After two seconds the screen moves on to the puzzle and the first three LEDs glow red: no band is right yet.',
      mechanical: 'A rim under the lid was holding the walls in. Now the clothespin torsion springs at the hinges fold all four walls outward, and the box opens like a flower.',
    },
    parts: { electronic: ['wall-front', 'wall-left', 'wall-right', 'back-acrylic', 'neopixel'], mechanical: ['clothespins', 'wall-front', 'wall-left', 'wall-right', 'back-acrylic'] },
    view: both({ pos: [-9.5, 10.5, -12.5] as V3, target: [0, 0.4, 0] as V3 }),
    endPose: p2, endLcd: ['Solve the puzzle', 'Bands - - -'], endLeds: [RED, RED, RED, null, null, null, null, null],
    run: async (mode) => {
      await animateTo({ walls: 1 }, 1600);
      if (mode === 'electronic') { await wait(300); lcd('Solve the puzzle', 'Bands - - -'); leds([RED, RED, RED, null, null, null, null, null]); }
    },
  },
  {
    n: 3, title: 'Picture puzzle', sub: 'Three bands, four whole pictures',
    caption: {
      electronic: 'The child turns the three bands. When a band reaches the one right position, the magnet behind its Satya strip closes its reed switch (PCF P4, P5, P6): the screen shows a Y and that LED turns green. With all three right, notches in band 3 uncover the leaf sockets.',
      mechanical: 'The child turns the three bands, feeling a bead click-stop at every picture. Only in one position are all four yuga pictures whole. Then the notches in the bottom band sit over the four leaf sockets.',
    },
    parts: { electronic: ['picture-bands', 'reed-bands', 'magnets', 'pcf8574', 'lcd', 'neopixel'], mechanical: ['picture-bands', 'click-stops', 'leaf-sockets'] },
    view: both({ pos: [2.6, 3.4, 6.2] as V3, target: [0, 1.6, 0] as V3 }),
    endPose: p3, endLcd: ['Puzzle solved!', 'Attach the leaves'], endLeds: OFF,
    run: async (mode) => {
      const state = [RED, RED, RED, null, null, null, null, null] as (string | null)[];
      const yes = ['-', '-', '-'];
      for (let i = 0; i < 3; i++) {
        const b = [...useStateBands()]; b[i] = 0;
        await animateTo({ bands: b as Pose['bands'] }, 1100);
        if (mode === 'electronic') { yes[i] = 'Y'; state[i] = GREEN; lcd('Solve the puzzle', 'Bands ' + yes.join(' ')); leds(state); }
        await wait(200);
      }
      if (mode === 'electronic') { await wait(500); lcd('Puzzle solved!', 'Attach the leaves'); leds(OFF); }
    },
  },
  {
    n: 4, title: 'Leaves and ring', sub: 'Shaped pegs, then turn the ring',
    caption: {
      electronic: 'Each leaf\'s peg fits only its own socket. As each goes in, its magnet closes a reed switch (P0–P3): the screen names the yuga and two LEDs light in its metal colour. Then the child uses the leaves as handles to turn the ring until the ring reed (P7) sees the holes line up.',
      mechanical: 'Each leaf\'s peg (circle, triangle, square or star) fits only its own socket. The ring is smooth and sunk, so the leaves are the only handles: the child turns it until its hole lines up with the tube hole and the click-stop clicks.',
    },
    parts: { electronic: ['leaves', 'leaf-sockets', 'reed-leaves', 'leaf-ring', 'reed-ring', 'neopixel', 'lcd'], mechanical: ['leaves', 'leaf-sockets', 'leaf-ring', 'click-stops'] },
    view: both({ pos: [-6.5, 7.5, -8.5] as V3, target: [0, 0.8, 0] as V3 }),
    endPose: p4, endLcd: ['Holes lined up!', 'Push the button'], endLeds: ALL,
    run: async (mode) => {
      const lit: (string | null)[] = [...OFF];
      for (let k = 0; k < 4; k++) {
        const l = [...useStateLeaves()]; l[k] = 1;
        await animateTo({ leaves: l as Pose['leaves'] }, 1000);
        if (mode === 'electronic') { lit[2 * k] = Y[k]; lit[2 * k + 1] = Y[k]; leds(lit); lcd(YUGAS[k].en + ' Yuga', `${k + 1} of 4 leaves`); }
      }
      if (mode === 'electronic') { await wait(400); lcd('All 4 leaves in!', 'Turn the ring'); }
      await animateTo({ ring: 1 }, 2000);
      if (mode === 'electronic') lcd('Holes lined up!', 'Push the button');
    },
  },
  {
    n: 5, title: 'The lotus opens', sub: 'Button → trigger → four petals',
    caption: {
      electronic: 'The button passes through the lined-up holes and presses the microswitch (A0). The firmware lights all eight LEDs, moves the lotus servo (D10) slowly from 10° to 150° so the rod rises 2–3 cm, and plays the tune. The collar and struts open the copper petals like an umbrella, and the screen names each coin. The rising rod also pulls the release string, which lifts the piggy-bank catch.',
      mechanical: 'The button passes through the lined-up holes and pushes the catch lever. Its tooth swings out of the rod\'s notch, and the main spring shoots the push rod up until the stop collar halts it. The collar and struts open the four copper petals like an umbrella: gold, silver, copper and iron coins. The rising rod also pulls the release string, which lifts the piggy-bank catch.',
    },
    parts: { electronic: ['button', 'microswitch', 'servo-lotus', 'push-rod', 'collar-struts', 'petals', 'coins', 'neopixel', 'buzzer'], mechanical: ['button', 'catch-lever', 'catch-spring', 'main-spring', 'push-rod', 'stop-collar', 'collar-struts', 'petals', 'coins'] },
    view: both({ pos: [-4.6, 6.2, -7.2] as V3, target: [0.4, 2.3, 0] as V3 }),
    endPose: p5, endLcd: ['Collect coins!', '* to close'], endLeds: ALL,
    run: async (mode) => {
      await animateTo({ button: 1 }, 800);
      if (mode === 'electronic') {
        lcd('The lotus opens', '...'); leds(ALL);
        await animateTo({ fire: 1 }, 2100);
        await animateTo({ button: 0 }, 500);
        for (let k = 0; k < 4; k++) {
          await wait(900);
          const one: (string | null)[] = [...OFF]; one[2 * k] = Y[k]; one[2 * k + 1] = Y[k];
          lcd(YUGAS[k].en + ' Yuga', YUGAS[k].metalName + ' coin'); leds(one);
        }
        await wait(900); lcd('Collect coins!', '* to close'); leds(ALL);
      } else {
        await animateTo({ fire: 1 }, 450);
        await animateTo({ button: 0 }, 500);
      }
    },
  },
  {
    n: 6, title: 'The piggy bank opens', sub: 'Bonus · savings unlocked by the lotus',
    caption: {
      electronic: 'The lotus servo lifted the push rod, and the release string tied to its foot pulled the drawer catch up. A small spring behind the treasury drawer pushes it out, full of saved coins. The firmware does not need to change: the rod does the unlocking.',
      mechanical: 'When the main spring shot the push rod up, the release string tied to its foot pulled the drawer catch up. A small spring behind the treasury drawer pushes it out, full of saved coins. Press the lotus closed again and the string goes slack, so the catch can lock the drawer.',
    },
    parts: both(['release-string', 'drawer-catch', 'treasury-drawer', 'push-rod', 'coin-chute', 'coin-slot']),
    view: both({ pos: [7.5, 3.2, 12.5] as V3, target: [0.4, -1.4, 2.6] as V3 }),
    endPose: p6, endLcd: ['Collect coins!', '* to close'], endLeds: ALL,
    run: async () => { await wait(500); await animateTo({ drawer: 1 }, 1400); },
  },
];

function useStateBands() { return pose.bands; }
function useStateLeaves() { return pose.leaves; }
