Read CLAUDE.md and every file in reference/ and firmware/ first. Then build the Yuga Lotus Locker explainer website described there.

## What the site must do

### 1. Explore (main view)
A full-screen 3D model of the box, built from the geometry and materials in `reference/yuga-locker-cutaway.html`.
- Orbit, pan and zoom freely, with smooth damping. Pinch zoom on phones.
- Hovering a part highlights it with an outline and shows a small name tag.
- **Clicking a part:**
  - The camera flies in and frames that part.
  - Everything else dims and becomes semi-transparent.
  - A detail panel opens with these sections:
    - **What it is**
    - **Why it's used here**
    - **How it works**, with a small animation or diagram where it helps, for example the reed switch closing as a magnet passes, or the catch lever releasing
    - **Specs**
    - **Connections:** pins and wires, which light up in 3D when you hover them
    - **Which stage it belongs to**
    - **Build tip**
    - **Related parts:** clicking one flies to that part
- Escape or a "Back to full view" button returns to the whole box.
- A searchable parts list in a side drawer, grouped by Code lock, Puzzle, Leaves, Lotus trigger, Lotus, Electronics and Box. Clicking an item does the same as clicking it in 3D.
- **View controls:**
  - Cutaway on/off: hide the back wall and cut the tube open.
  - An exploded-view slider that pulls the parts apart along sensible axes.
  - Hide walls.
  - Show wiring only.
  - An Electronic / Mechanical switch that shows only the parts used in that version.

### 2. How it works (guided play-through)
A step-through of the five stages with Previous and Next buttons. Each step does three things:
- animates the real 3D parts, using the sequence from `reference/lotus-locker-3d.html`
- highlights the parts involved
- shows a short caption

For example, step 1 turns the wheels to 1-7-0-9, the bolt slides and the lid pops up. In Electronic mode, also show the screen text and LED states the firmware would produce at that step.

### 3. Circuit
An interactive version of the wiring diagram in `reference/yuga-locker-manual.html`, as SVG.
- Clicking a component or wire highlights it.
- A "Show in 3D" link flies to that part in the Explore view.
- A pin table generated from the same data as the parts list.

### 4. Code
An annotated walk-through of `firmware/yuga_lotus_locker_v2.ino`:
- the code with syntax highlighting
- side notes per section, each linking to the parts it controls
- a copy button

### 5. The four yugas
One section per yuga, using the facts in CLAUDE.md:
- its coin and colour
- its dharma bull picture (the painted miniatures from the reference)
- its leaf shape

### 6. Build guide
The parts list, the build steps for the electronic and mechanical versions, the springs list, test mode and troubleshooting, taken from the manual. Each part mentioned links to it in 3D.

## How to work

1. Start by writing a short plan and the folder structure, then scaffold Vite + React + TypeScript with @react-three/fiber and drei.
2. Put all part content in `src/data/parts.ts`, typed, with one entry per part and stable ids. Use only the facts given in CLAUDE.md and the reference files. If something is missing, write "TBD" rather than inventing it.
3. Port the procedural textures and geometry (carving bake, peepal leaf, petals, coins, picture bands) into reusable modules.
4. Build the Explore view first, check it works, then add the other sections.
5. Check your work: run the dev server, take Playwright screenshots at 1440×900 and 390×844 for each section and for one selected part, look at them, and fix what looks wrong. Make sure the console is free of errors.
6. Keep it fast: bake textures once, reuse materials, use instancing for repeated parts, and target 60 fps on a mid-range laptop.

When you finish, give me the commands to run it and a list of anything marked TBD.
