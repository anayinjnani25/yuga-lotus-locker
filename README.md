# Yuga Lotus Locker: interactive explainer

A museum-style website for the Yuga Lotus Locker school project: a 3D cutaway you can explore part by part,
a guided play-through of the five locks, the circuit, the annotated Arduino code, the four yugas and the build guide.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. To build static files for hosting: `npm run build` (output in `dist/`).

Live site: https://anayinjnani25.github.io/yuga-lotus-locker/

To publish changes: commit and push your source to `main`, then run `npm run deploy`. It builds the site and
pushes `dist/` to the `gh-pages` branch, which GitHub Pages serves.

Checks:

| Command | What it does |
|---|---|
| `npm run check:pins` | Compares every pin in `src/data/parts.ts` with `firmware/yuga_lotus_locker_v2.ino` |
| `npm run shots` | Screenshots every section at 1440×900 and 390×844 into `shots/` (dev server must be running) |
| `npm run test:ui` | Clicks through Explore (drawer, search, toggles, Esc, 3D hover/click), dark theme and reduced motion |

The screenshot scripts use the installed Microsoft Edge (`PW_CHANNEL=chrome` to use Chrome instead).

## Folder structure

```
firmware/              the real Arduino program (the Code page imports it directly)
reference/             original three.js scenes and build manual
src/
  data/
    parts.ts           every part: one typed entry, the single source for panels, drawer and pin table
    yugas.ts           yuga facts, colours, LED RGB, PCF bits
    playthrough.ts     the five stages: animation, captions, LCD text and LED states per firmware
  art/                 2D canvas painting ported from the reference (carvings, miniatures, coins, pictures)
  three/
    assets.ts          textures/materials baked once and cached
    BoxShell.tsx       walls on fold pivots, lid, base, dial lock
    Mechanism.tsx      tube, bands, ring, leaves, trigger, lotus, NeoPixel ring
    Electronics.tsx    bay modules and tagged wiring
    Part.tsx           tags meshes with part ids, hover/click, version filter, exploded offsets
    display.ts         dim / ghost / glow by swapping cached materials
    outline.ts         constant-width hull outline for hovered/selected part
    pose.ts            the moving state + tween engine
    Stage.tsx          canvas, lights, camera fly-to, on-demand shadows
  pages/               Explore, How it works, Circuit, Code, Yugas, Build guide
  components/HowAnims.tsx   small SVG "how it works" animations
scripts/               screenshot, interaction and pin-check scripts
```

## Marked TBD (not in the source material)

Specs
- Lid hook: size
- Lid pop-up spring, button spring, catch spring: spring force
- Core tube: height
- Bronze peepal leaves, shaped leaf sockets, guide discs, copper petals: size
- Push button: travel
- Stop collar: size and material
- Yuga coins: diameter
- 330 Ω resistor: power rating and material
- 5 V 3 A adapter: material
- Front wall, both side walls, mandala lid: size
- Clear acrylic back wall: thickness and build tip

Choices made where the sources were silent (also flagged on the site)
- Which yuga gets which peg shape: assumed Satya circle, Treta triangle, Dwapara square, Kali star (listed order).
- The back is acrylic, so the Kali panel is painted on the underside of the lid; Satya is inside the front wall,
  Treta the left (lotus mandala) wall, Dwapara the right (chakra) wall.
- The jaali lattice is carved on the sides of the electronics bay.
- The lid servo sits in the bay, where the cutaway model puts it; the manual says inside the top of the front wall.

## Notes

- Firmware: `show("Puzzle solved!", "Attach the leaves")` prints 17 characters on a 16-character LCD, so the
  real screen shows "Attach the leave". The play-through shows exactly that. "Add leaves" would fit.
- The play-through's green/red band LEDs are brightened from the firmware's (0,120,0)/(40,0,0) so they read on screen.
