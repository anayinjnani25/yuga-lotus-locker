# Yuga Lotus Locker – interactive explainer website

## What this project is

The Yuga Lotus Locker is a school design project: a carved, ancient-Indian-style puzzle money box.
A child solves five locks in a row to open a copper lotus that holds four coins, one for each yuga
(Satya, Treta, Dwapara, Kali). The box can work in two ways:

- **Electronic:** an Arduino reads a keypad and sensors and drives two servos.
- **Mechanical:** springs, a dial lock and a catch lever do the same job with no power.

This repo is the website that explains the box. Visitors explore a 3D model, zoom into any part,
click it, and read what it is, why it is used and how it works.

## Reference files (read these before building)

| File | What to take from it |
|---|---|
| `reference/yuga-locker-cutaway.html` | The cutaway scene. It has all the part geometry, positions, materials, wiring paths and callouts, built in three.js r128. Treat its coordinates and proportions as the source of truth for the 3D model. |
| `reference/lotus-locker-3d.html` | The play-through version: the step-by-step puzzle animation, the carved-panel texture baking (height map to normal map), peepal leaf and petal geometry, yuga coins, and the yuga info panels. |
| `reference/yuga-locker-manual.html` | The build manual: the full circuit diagram, parts list, build steps, test mode, manual override, the mechanical spring version, and troubleshooting. Use its text as content. |
| `firmware/yuga_lotus_locker_v2.ino` | The real Arduino program: pin numbers, states and test mode. Pin data on the site must match this file. |

Reuse the procedural code (texture baking, leaf/petal `sheet()` geometry, coins) rather than rewriting it.
Port it to the new stack; do not import the HTML files as-is.

## The five stages

1. **Code lock:** the child enters 1709 on a keypad (electronic) or turns four number wheels (mechanical). The lid unlocks and pops up.
2. **Walls fold open:** clothespin torsion springs at the hinges fold the four carved walls outward.
3. **Picture puzzle:** three bands turn around the central tube. The four yuga pictures are whole in only one position. When solved, notches in the bottom band uncover the leaf sockets.
4. **Leaves and ring:** four bronze peepal leaves have shaped pegs (circle, triangle, square, star), so each fits only its own socket. The leaves are the only handles for turning the brass ring until its hole lines up with the tube hole.
5. **Lotus:** the button goes through the lined-up holes. In the mechanical version it trips a catch lever and the main spring shoots the push rod up. In the electronic version it presses a microswitch and a servo lifts the rod. The collar and struts open four copper petals like an umbrella, each holding one coin.

Reset: press the petals closed until the catch clicks (or press * on the keypad), take the leaves out, mix up the bands, and close the lid.

## Parts data (use this text; don't invent specs)

Every part needs: name, group, stage, version (electronic, mechanical or both), what it is,
why it is used, how it works, specs, connections (pins where relevant), material, build tip,
and related parts.

### Electronics
- **Arduino Uno R3.** Microcontroller board (ATmega328P, 16 MHz, 5 V logic, 14 digital I/O, 6 analog inputs). It is used as the brain: it reads the keypad and every sensor, decides which stage the player is on, and drives the servos, screen, LEDs and buzzer. Pins used: keypad D2–D8, lid servo D9, lotus servo D10, NeoPixel D11, buzzer D12, button A0, lid reed A1, I2C A4 (SDA) and A5 (SCL).
- **PCF8574 I/O expander.** An I2C module that adds 8 input/output pins over just two wires. It is used because the Uno runs out of pins. It reads 8 reed switches: P0–P3 are the Satya, Treta, Dwapara and Kali leaf sockets, P4–P6 are bands 1–3, and P7 is ring aligned. Address 0x20 (A0–A2 to GND). Its pins have weak built-in pull-ups, so a switch to GND reads as 0.
- **16×2 LCD with I2C backpack.** Shows instructions ("Solve the puzzle", "Bands Y Y –"). It shares the I2C bus at address 0x27 (or 0x3F).
- **3×4 membrane keypad.** A row/column matrix. Pressing a key joins one row wire to one column wire. 7 pins: rows D2–D5, columns D6–D8.
- **SG90 micro servos (×2).** Small motors that turn to an exact angle set by a PWM signal. The lid servo (D9) swings the latch hook clear. The lotus servo (D10) lifts the push rod 2–3 cm. Powered from the 5 V rail, never from the Uno's 5 V pin.
- **Reed switches (×10).** Two metal reeds sealed in glass that touch when a magnet comes within about 5 mm. Used as contact-free position sensors: 3 bands, 4 leaf sockets, 1 ring, 1 lid, 1 spare.
- **Neodymium magnets 6×2 mm (×10).** Hidden in each band, leaf peg, the ring and the lid to trigger the reed switches.
- **Lever microswitch.** Detects that the button has been pushed all the way in (A0).
- **NeoPixel ring, 8 × WS2812B.** Addressable RGB LEDs under the lotus. Each yuga gets 2 LEDs in its metal colour. D11 through a 330 Ω resistor.
- **Passive buzzer.** Beeps and the opening tune (D12, `tone()`).
- **Breadboard, 1000 µF capacitor, 5 V 3 A adapter.** These make the power rail. The capacitor smooths the current spikes when the servos start.
- **Test mode.** Code 0000 shows every sensor live. Keys 1/2/3/4 test the latch, lotus, close-all and LEDs.

### Mechanical
- **Number wheels (×4).** Card discs on one axle with digits 0–9 and one notch each, cut where the rim faces the bolt when 1, 7, 0 and 9 are showing.
- **Spring-loaded bolt.** An ice-cream-stick bar with four teeth, pulled toward the wheels by a spring. It slides in only when all four notches line up, freeing the lid hook.
- **Lid hook and pop-up spring.** A paper-clip hook under the lid. A ball-pen spring lifts the lid as soon as the bolt lets go.
- **Clothespin hinge springs (×4–6).** Torsion springs that fold the walls open.
- **Picture bands (×3)** with bead click-stops (pen spring and bead pressing into dimples).
- **Brass leaf ring** with a stopper (about a quarter turn) and a click-stop when the holes align.
- **Bronze peepal leaves (×4).** Heart-shaped base, long drip tip, raised veins and verdigris patina, with a yuga coin emblem.
- **Push rod, main coil spring, catch lever, catch spring, button and button spring, stop collar.** Together these work like a jack-in-the-box trigger. The rod rises only 2–3 cm.
- **Copper lotus (4 petals), collar and struts.** Petals are hinged at the tube rim and opened like umbrella ribs.
- **Yuga coins:** Satya gold, Treta silver, Dwapara copper, Kali iron.
- **Carved teak box.**
  - Front: a temple arch (torana).
  - Sides: a Konark-style chakra, a lotus mandala, and a jaali lattice.
  - Lid: a lotus mandala with four small wheels.
  - Inside each wall: the yuga's name, a painted miniature of the dharma bull, and facts.
  - Back: clear acrylic.

### Yuga facts (use exactly)

| Yuga | Coin | Dharma's legs | Length | People lived | Path to God | Avatars |
|---|---|---|---|---|---|---|
| Satya | Gold | 4 | 1,728,000 years | 100,000 years | Meditation | Matsya, Kurma, Varaha, Narasimha |
| Treta | Silver | 3 | 1,296,000 years | 10,000 years | Yajna (fire offerings) | Vamana, Parashurama, Shri Ram |
| Dwapara | Copper | 2 | 864,000 years | 1,000 years | Temple worship | Shri Krishna, Balarama |
| Kali | Iron | 1 | 432,000 years | 100 years | Chanting God's name | Kalki (yet to come) |

## Tech stack

- Vite + React + TypeScript.
- three.js through `@react-three/fiber` and `@react-three/drei` (for camera controls, outlines, HTML labels and bounds).
- Parts data in `src/data/parts.ts`. Every 3D mesh is tagged with a part id, so clicking a mesh opens that part.
- Builds to static files (`npm run build`) that can be hosted anywhere.

## Design direction

The site should feel like a museum exhibit for a handmade object, not a tech dashboard.

- **Stage:** dark warm studio for the 3D view.
- **Colours:** teak, brass and copper tones.
- **Fonts:** "Yatra One" for headings, Nunito for body text.
- **Theme:** the page around the stage supports both light and dark mode.
- **Motion:**
  - Camera fly-to when a part is selected.
  - The stage play-through.
  - Respect `prefers-reduced-motion`.
- **Mobile:** must work on a phone, with the detail panel as a bottom sheet and pinch zoom.

## Done means

- `npm run dev` runs with no console errors.
- Every part in the list above can be clicked and has a filled detail panel.
- The pin numbers match `firmware/yuga_lotus_locker_v2.ino`.
- It is checked with a screenshot at desktop and phone width.
