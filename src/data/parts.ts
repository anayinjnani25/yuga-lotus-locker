// Every part of the Yuga Lotus Locker, one typed entry each.
// Text comes only from CLAUDE.md, the build manual and the firmware. Missing facts say "TBD".
// Pin numbers must match firmware/yuga_lotus_locker_v2.ino. The pin table on the Circuit
// page is generated from the `connections` below, so this file is the single source.

export type GroupId = 'code' | 'puzzle' | 'leaves' | 'trigger' | 'lotus' | 'bank' | 'electronics' | 'box';
export type Version = 'electronic' | 'mechanical' | 'both';
export type AnimId =
  | 'reed' | 'catch' | 'servo' | 'keypad' | 'wheels' | 'umbrella' | 'i2c' | 'clothespin'
  | 'bands' | 'neopixel' | 'microswitch' | 'popup';

export const GROUPS: { id: GroupId; name: string }[] = [
  { id: 'code', name: 'Code lock' },
  { id: 'puzzle', name: 'Puzzle' },
  { id: 'leaves', name: 'Leaves' },
  { id: 'trigger', name: 'Lotus trigger' },
  { id: 'lotus', name: 'Lotus' },
  { id: 'bank', name: 'Piggy bank' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'box', name: 'Box' },
];

export const STAGES: Record<number, string> = {
  0: 'Whole box',
  1: 'Stage 1 · Code lock',
  2: 'Stage 2 · Walls fold open',
  3: 'Stage 3 · Picture puzzle',
  4: 'Stage 4 · Leaves and ring',
  5: 'Stage 5 · Lotus',
};

export interface Connection {
  /** what this line is, e.g. "Signal" */
  label: string;
  /** board the pin is on */
  board?: 'Uno' | 'PCF8574' | 'Rail';
  /** pin name exactly as in the firmware comments, e.g. "D9", "A0", "P4" */
  pin?: string;
  /** firmware symbol that names the pin */
  code?: string;
  /** 3D wire ids that light up on hover */
  wires?: string[];
  /** other part at the far end of the wire */
  to?: string;
}

export interface Part {
  id: string;
  name: string;
  qty?: string;
  group: GroupId;
  stages: number[];
  version: Version;
  what: string;
  why: string;
  how: string;
  anim?: AnimId;
  specs: [string, string][];
  connections: Connection[];
  material: string;
  buildTip: string;
  related: string[];
}

const GND: Connection = { label: 'Other leg to GND', board: 'Rail', pin: 'GND' };

export const PARTS: Part[] = [
  // ───────────────────────── Code lock ─────────────────────────
  {
    id: 'keypad', name: '3×4 membrane keypad', qty: '1', group: 'code', stages: [1], version: 'electronic',
    what: 'A flat keypad with 12 keys (1–9, *, 0, #) set out in 4 rows and 3 columns.',
    why: 'It is the electronic code lock. The child types 1709 on it to unlock the lid.',
    how: 'The keypad is a row/column matrix. Pressing a key joins one row wire to one column wire. The Arduino checks the rows and columns very quickly to see which pair is joined, so 12 keys need only 7 pins.',
    anim: 'keypad',
    specs: [['Layout', '3 columns × 4 rows'], ['Pins', '7 (4 rows, 3 columns)'], ['Code', '1709 (SECRET_CODE)'], ['Test code', '0000 (TEST_CODE)'], ['Library', 'Keypad (Mark Stanley)'], ['Power', 'Needs no GND or 5 V']],
    connections: [
      { label: 'Row 1', board: 'Uno', pin: 'D2', code: 'rowPins[0]', wires: ['keypad'], to: 'arduino' },
      { label: 'Row 2', board: 'Uno', pin: 'D3', code: 'rowPins[1]', wires: ['keypad'], to: 'arduino' },
      { label: 'Row 3', board: 'Uno', pin: 'D4', code: 'rowPins[2]', wires: ['keypad'], to: 'arduino' },
      { label: 'Row 4', board: 'Uno', pin: 'D5', code: 'rowPins[3]', wires: ['keypad'], to: 'arduino' },
      { label: 'Column 1', board: 'Uno', pin: 'D6', code: 'colPins[0]', wires: ['keypad'], to: 'arduino' },
      { label: 'Column 2', board: 'Uno', pin: 'D7', code: 'colPins[1]', wires: ['keypad'], to: 'arduino' },
      { label: 'Column 3', board: 'Uno', pin: 'D8', code: 'colPins[2]', wires: ['keypad'], to: 'arduino' },
    ],
    material: 'Membrane keypad (shown behind a brass-look faceplate)',
    buildTip: 'Cut a window in the front of the base for the keypad and the screen. If the wrong keys are typed, the keypad pins are in a different order: swap the order in rowPins and colPins.',
    related: ['arduino', 'lcd', 'servo-lid', 'number-wheels'],
  },
  {
    id: 'number-wheels', name: 'Number wheels', qty: '4', group: 'code', stages: [1], version: 'mechanical',
    what: 'Four card discs on one axle, each with the digits 0–9 round the rim and one notch.',
    why: 'They are the mechanical code lock. With no power, the child turns them to 1-7-0-9.',
    how: 'Each notch is cut where the rim faces the bolt when the right digit is showing in the window. The bolt rests on the rims. Only when all four notches face it at once can the bolt slide in.',
    anim: 'wheels',
    specs: [['Diameter', '6 cm'], ['Digits', '0–9, one every 36°'], ['Notch', '8 mm, one per wheel'], ['Axle', '5 mm dowel'], ['Code', '1-7-0-9']],
    connections: [],
    material: 'Three layers of card glued together, or foam board',
    buildTip: 'Turn wheel 1 to show 1, wheel 2 to 7, wheel 3 to 0 and wheel 4 to 9. Mark the point on each rim that faces the bolt and cut the notch there. A washer between the wheels adds friction so they don\'t spin on their own. To change the code, cut new notches in fresh wheels.',
    related: ['bolt', 'lid-hook', 'lid-spring', 'keypad'],
  },
  {
    id: 'bolt', name: 'Spring-loaded bolt', qty: '1', group: 'code', stages: [1], version: 'mechanical',
    what: 'An ice-cream-stick bar with four teeth, one touching each number wheel, pulled toward the wheels by a spring.',
    why: 'It holds the lid shut until the right code is set.',
    how: 'The bolt\'s end sits in the eye of the lid hook. The spring pulls the bolt toward the wheels, but the teeth rest on the rims. When all four notches line up, the teeth drop in, the bolt slides, leaves the hook\'s eye and frees the lid.',
    anim: 'wheels',
    specs: [['Teeth', '4'], ['Spring', 'Rubber band or small tension spring'], ['Guides', 'Straw pieces'], ['Relock knob', 'A bead on the bolt, poking out of the side']],
    connections: [],
    material: 'Ice-cream stick with stick-piece teeth',
    buildTip: 'Slide the bolt through two straw guides so it moves straight, then hook the spring on. Add a bead knob so you can pull the bolt back when relocking.',
    related: ['number-wheels', 'lid-hook', 'lid-spring'],
  },
  {
    id: 'lid-hook', name: 'Lid hook', qty: '1', group: 'code', stages: [1], version: 'mechanical',
    what: 'A bent paper clip that hangs down from the underside of the lid.',
    why: 'It is what the bolt (or, in the electronic box, the latch servo horn) holds on to, so the lid stays shut.',
    how: 'The end of the bolt passes through the hook\'s eye. While the bolt is in the eye, the lid cannot lift. When the bolt slides out, the hook is free and the pop-up spring lifts the lid.',
    specs: [['Made from', 'Paper clip'], ['Size', 'TBD']],
    connections: [],
    material: 'Steel paper clip',
    buildTip: 'Glue the hook under the lid so the bolt\'s end passes through its eye. In the electronic box, bend a paper-clip loop under the front edge of the lid for the servo horn to hook.',
    related: ['bolt', 'lid-spring', 'servo-lid', 'lid'],
  },
  {
    id: 'lid-spring', name: 'Lid pop-up spring', qty: '1–2', group: 'code', stages: [1], version: 'mechanical',
    what: 'A small coil spring from a retractable ball pen, standing in a pocket on top of the wall.',
    why: 'It makes the lid jump up by itself the moment the code is right.',
    how: 'Closing the lid squeezes the spring. As soon as the bolt lets go of the hook, the spring pushes back and lifts the lid.',
    anim: 'popup',
    specs: [['Source', 'Retractable ball-pen spring'], ['Pocket', 'Short straw on top of the wall'], ['Spring force', 'TBD']],
    connections: [],
    material: 'Steel spring wire',
    buildTip: 'Put the pen spring in a short straw pocket on top of the wall so it can\'t fall over.',
    related: ['lid-hook', 'bolt', 'lid'],
  },
  {
    id: 'lid-reed', name: 'Lid reed switch', qty: '1', group: 'code', stages: [1], version: 'electronic',
    what: 'A reed switch in the top edge of the front wall, with a magnet glued under the lid\'s front edge.',
    why: 'It tells the Arduino the lid is shut, so the box can lock itself again after a game.',
    how: 'When the lid closes, the magnet comes within about 5 mm and the reeds touch, pulling A1 to GND. In the RESETTING state the firmware waits until all leaves are out and A1 reads LOW, then locks.',
    anim: 'reed',
    specs: [['Type', 'Reed switch, normally open'], ['Closes at', 'Magnet within about 5 mm'], ['Pin mode', 'INPUT_PULLUP'], ['Reads', 'LOW = lid closed']],
    connections: [{ label: 'Lid closed', board: 'Uno', pin: 'A1', code: 'PIN_LID_CLOSED', wires: ['lid-reed'], to: 'arduino' }, GND],
    material: 'Glass capsule with metal reeds',
    buildTip: 'Glue a magnet under the lid\'s front edge and a reed switch in the top of the front wall directly below it. Run the wall wires down through the hinge gap with a loose loop so the wall can fold.',
    related: ['magnets', 'arduino', 'lid', 'reed-bands'],
  },

  // ───────────────────────── Puzzle ─────────────────────────
  {
    id: 'core-tube', name: 'Core tube', qty: '1', group: 'puzzle', stages: [3, 4, 5], version: 'both',
    what: 'The upright tube in the middle of the box. The bands and the leaf ring turn around it and the push rod runs up inside it.',
    why: 'It is the spine of the puzzle: everything turns on it or slides through it, and it hides the trigger.',
    how: 'It stays still. A hole in its wall lines up with the hole in the leaf ring only in one position, and the button has to pass through both.',
    specs: [['Made from', '50 mm PVC pipe or a strong card tube'], ['Button hole', '10 mm'], ['Height', 'TBD']],
    connections: [],
    material: 'PVC pipe or card tube',
    buildTip: 'Fix the core tube upright in the centre of the base before anything else. Drill the tube hole at exactly the height of the catch lever\'s top end.',
    related: ['picture-bands', 'leaf-ring', 'push-rod', 'guide-discs'],
  },
  {
    id: 'picture-bands', name: 'Picture bands', qty: '3', group: 'puzzle', stages: [3], version: 'both',
    what: 'Three card rings stacked on the core tube. Each carries one horizontal strip of all four yuga pictures.',
    why: 'They are the picture puzzle. The four yuga pictures are only whole in one position.',
    how: 'Each yuga picture is cut into three strips: tops on band 1, middles on band 2, bottoms on band 3. Turn the bands until every picture lines up. Notches in the lower edge of band 3 then sit over the four leaf sockets; otherwise the band covers them and no leaf fits. In the electronic box a magnet behind each Satya strip closes that band\'s reed switch.',
    anim: 'bands',
    specs: [['Bands', '3 (top, middle, bottom)'], ['Pictures', '4, each cut in 3 strips'], ['Notches', '4, in the lower edge of band 3'], ['Sensors', 'PCF P4, P5, P6'], ['Click-stops', '4 dimples per band']],
    connections: [
      { label: 'Band 1 (top)', board: 'PCF8574', pin: 'P4', code: 'BIT_BAND[0]', wires: ['band-1'], to: 'reed-bands' },
      { label: 'Band 2 (middle)', board: 'PCF8574', pin: 'P5', code: 'BIT_BAND[1]', wires: ['band-2'], to: 'reed-bands' },
      { label: 'Band 3 (bottom)', board: 'PCF8574', pin: 'P6', code: 'BIT_BAND[2]', wires: ['band-3'], to: 'reed-bands' },
    ],
    material: 'Card rings with printed pictures',
    buildTip: 'Make the rings slightly wider than the tube so they turn freely, with thin spacers between. Glue the strips in the same order on all three bands.',
    related: ['click-stops', 'reed-bands', 'core-tube', 'leaf-sockets'],
  },
  {
    id: 'click-stops', name: 'Bead click-stops', qty: '4', group: 'puzzle', stages: [3, 4], version: 'mechanical',
    what: 'A pen spring and a bead in a short straw inside the tube, pressing the bead out through a hole in the tube wall.',
    why: 'They make the bands and the ring click at each position, so the puzzle feels precise.',
    how: 'Each band has four shallow dimples inside, one per picture position. The bead drops into a dimple with a click. One more click-stop with a single dimple marks where the ring hole lines up with the tube hole.',
    specs: [['Count', '3 for the bands + 1 for the ring'], ['Spring', 'Pen spring'], ['Dimples', '4 per band, 1 on the ring']],
    connections: [],
    material: 'Pen springs, small beads, straw',
    buildTip: 'Push the pen spring and bead into a short straw glued inside the tube at each band\'s height, then poke the dimples.',
    related: ['picture-bands', 'leaf-ring', 'core-tube'],
  },
  {
    id: 'reed-bands', name: 'Band reed switches', qty: '3', group: 'puzzle', stages: [3], version: 'electronic',
    what: 'Three reed switches taped inside the core tube, one at each band\'s height at the front mark.',
    why: 'They let the Arduino see which bands are in the right place.',
    how: 'Each band hides a magnet behind its Satya strip. When the band is turned to the correct spot the magnet passes within about 5 mm, the reeds touch and pull that PCF8574 input to GND. The screen shows "Bands Y Y –" and NeoPixels 0–2 turn green for each solved band.',
    anim: 'reed',
    specs: [['Type', 'Reed switch, normally open'], ['Closes at', 'Magnet within about 5 mm'], ['Reads', '0 = magnet present (pull-up)']],
    connections: [
      { label: 'Band 1 (top)', board: 'PCF8574', pin: 'P4', code: 'BIT_BAND[0]', wires: ['band-1'], to: 'pcf8574' },
      { label: 'Band 2 (middle)', board: 'PCF8574', pin: 'P5', code: 'BIT_BAND[1]', wires: ['band-2'], to: 'pcf8574' },
      { label: 'Band 3 (bottom)', board: 'PCF8574', pin: 'P6', code: 'BIT_BAND[2]', wires: ['band-3'], to: 'pcf8574' },
      GND,
    ],
    material: 'Glass capsule with metal reeds',
    buildTip: 'If a sensor digit never changes in test mode, the magnet is too far: keep it within about 5 mm and side-on to the reed, and check the GND leg.',
    related: ['picture-bands', 'magnets', 'pcf8574', 'neopixel'],
  },

  // ───────────────────────── Leaves ─────────────────────────
  {
    id: 'leaves', name: 'Bronze peepal leaves', qty: '4', group: 'leaves', stages: [4], version: 'both',
    what: 'Four peepal leaves with a heart-shaped base, a long drip tip, raised veins and a verdigris patina. Each carries its yuga\'s coin emblem.',
    why: 'They are keys and handles in one: each fits only its own socket, and they are the only way to grip and turn the ring.',
    how: 'Each leaf has a peg shaped as a circle, triangle, square or star, so it only fits the matching socket. In the electronic box a magnet in the peg tip closes the reed switch behind its socket, and the lotus lights 2 LEDs in that yuga\'s metal colour.',
    specs: [['Count', '4, one per yuga'], ['Peg shapes', 'Circle, triangle, square, star'], ['Magnet', '6×2 mm in the peg tip (electronic)'], ['Size', 'TBD']],
    connections: [
      { label: 'Satya leaf', board: 'PCF8574', pin: 'P0', code: 'BIT_LEAF[0]', wires: ['leaf-0'], to: 'reed-leaves' },
      { label: 'Treta leaf', board: 'PCF8574', pin: 'P1', code: 'BIT_LEAF[1]', wires: ['leaf-1'], to: 'reed-leaves' },
      { label: 'Dwapara leaf', board: 'PCF8574', pin: 'P2', code: 'BIT_LEAF[2]', wires: ['leaf-2'], to: 'reed-leaves' },
      { label: 'Kali leaf', board: 'PCF8574', pin: 'P3', code: 'BIT_LEAF[3]', wires: ['leaf-3'], to: 'reed-leaves' },
    ],
    material: 'Bronze look: card covered in copper tape',
    buildTip: 'Make the leaves from card covered in copper tape. Give each a peg of its yuga\'s shape with a magnet in the tip, so it only fits and only triggers its own socket.',
    related: ['leaf-sockets', 'leaf-ring', 'reed-leaves', 'coins'],
  },
  {
    id: 'leaf-sockets', name: 'Shaped leaf sockets', qty: '4', group: 'leaves', stages: [4], version: 'both',
    what: 'Four sockets in the leaf ring, cut as a circle, a triangle, a square and a star.',
    why: 'The shape makes sure each leaf can only go into its own yuga\'s place.',
    how: 'A peg only slides in if its shape matches. While the picture puzzle is unsolved, band 3 covers the sockets; its notches uncover them only when the pictures are whole.',
    specs: [['Shapes', 'Circle, triangle, square, star'], ['Sensors', 'Reed switch behind each (PCF P0–P3)'], ['Size', 'TBD']],
    connections: [
      { label: 'Satya socket', board: 'PCF8574', pin: 'P0', code: 'BIT_LEAF[0]', wires: ['leaf-0'], to: 'reed-leaves' },
      { label: 'Treta socket', board: 'PCF8574', pin: 'P1', code: 'BIT_LEAF[1]', wires: ['leaf-1'], to: 'reed-leaves' },
      { label: 'Dwapara socket', board: 'PCF8574', pin: 'P2', code: 'BIT_LEAF[2]', wires: ['leaf-2'], to: 'reed-leaves' },
      { label: 'Kali socket', board: 'PCF8574', pin: 'P3', code: 'BIT_LEAF[3]', wires: ['leaf-3'], to: 'reed-leaves' },
    ],
    material: 'Cut into the ring; rimmed in each yuga\'s metal colour',
    buildTip: 'Cut the four shaped sockets and glue a reed switch behind each before you fit the ring.',
    related: ['leaves', 'leaf-ring', 'picture-bands', 'reed-leaves'],
  },
  {
    id: 'leaf-ring', name: 'Brass leaf ring', qty: '1', group: 'leaves', stages: [4], version: 'both',
    what: 'A ring below the picture bands that holds the four leaf sockets and has one 10 mm hole.',
    why: 'The button can only reach the trigger when the ring\'s hole lines up with the tube hole.',
    how: 'The ring is smooth and sunk into a sleeve, so it can\'t be gripped: the leaves are the only handles. A stopper peg lets it turn only about a quarter turn, and a click-stop marks the aligned position. In the electronic box a magnet beside the hole closes the ring reed switch (P7).',
    specs: [['Turn', 'About a quarter turn (stopper peg)'], ['Hole', '10 mm'], ['Click-stop', '1, at the aligned position'], ['Sensor', 'PCF P7']],
    connections: [{ label: 'Ring aligned', board: 'PCF8574', pin: 'P7', code: 'BIT_RING', wires: ['ring'], to: 'reed-ring' }],
    material: 'Brass look',
    buildTip: 'Add the stopper peg so the ring can turn only about a quarter turn. That keeps its wires from twisting. Route the ring wires as one bundle through a slot into the tube, with a loose loop.',
    related: ['leaves', 'leaf-sockets', 'reed-ring', 'button'],
  },
  {
    id: 'reed-leaves', name: 'Leaf socket reed switches', qty: '4', group: 'leaves', stages: [4], version: 'electronic',
    what: 'Four reed switches, one glued behind each leaf socket.',
    why: 'They tell the Arduino which leaves are in, so it can name the yuga and light its colour.',
    how: 'The magnet in a leaf\'s peg tip closes its switch. The firmware shows the yuga name and "n of 4 leaves", beeps, and lights LEDs 2k and 2k+1 in that yuga\'s colour. When all four are in it moves to the RING state.',
    anim: 'reed',
    specs: [['Type', 'Reed switch, normally open'], ['Closes at', 'Magnet within about 5 mm'], ['Reads', '0 = leaf in']],
    connections: [
      { label: 'Satya leaf', board: 'PCF8574', pin: 'P0', code: 'BIT_LEAF[0]', wires: ['leaf-0'], to: 'pcf8574' },
      { label: 'Treta leaf', board: 'PCF8574', pin: 'P1', code: 'BIT_LEAF[1]', wires: ['leaf-1'], to: 'pcf8574' },
      { label: 'Dwapara leaf', board: 'PCF8574', pin: 'P2', code: 'BIT_LEAF[2]', wires: ['leaf-2'], to: 'pcf8574' },
      { label: 'Kali leaf', board: 'PCF8574', pin: 'P3', code: 'BIT_LEAF[3]', wires: ['leaf-3'], to: 'pcf8574' },
      GND,
    ],
    material: 'Glass capsule with metal reeds',
    buildTip: 'Label every wire with masking tape, for example "P2 Dwapara". It saves a lot of time when something needs fixing.',
    related: ['leaf-sockets', 'leaves', 'pcf8574', 'magnets'],
  },
  {
    id: 'reed-ring', name: 'Ring reed switch', qty: '1', group: 'leaves', stages: [4], version: 'electronic',
    what: 'A reed switch on the core wall, beside the button hole.',
    why: 'It tells the Arduino when the ring hole lines up with the tube hole.',
    how: 'A magnet glued on the ring beside its hole reaches the switch only when the holes line up. The firmware then shows "Holes lined up! Push the button". If the ring moves away again it goes back to "Ring moved / Line holes up".',
    anim: 'reed',
    specs: [['Type', 'Reed switch, normally open'], ['Closes at', 'Magnet within about 5 mm'], ['Reads', '0 = aligned']],
    connections: [{ label: 'Ring aligned', board: 'PCF8574', pin: 'P7', code: 'BIT_RING', wires: ['ring'], to: 'pcf8574' }, GND],
    material: 'Glass capsule with metal reeds',
    buildTip: 'Drill a 10 mm hole in the ring and one in the core at the same height, then glue the magnet on the ring beside its hole and the reed switch on the core.',
    related: ['leaf-ring', 'pcf8574', 'magnets', 'button'],
  },

  // ───────────────────────── Lotus trigger ─────────────────────────
  {
    id: 'button', name: 'Push button', qty: '1', group: 'trigger', stages: [5], version: 'both',
    what: 'A dowel button with a brass cap and a red jewel, sitting in the leaf ring\'s hole.',
    why: 'It is the final key: it only reaches the trigger when the ring and tube holes line up.',
    how: 'Pushed in, it passes through both holes. In the mechanical box its tip presses the top of the catch lever. In the electronic box it presses the lever microswitch at the end of its path. A spring pushes it back out.',
    specs: [['Made from', '8 mm dowel'], ['Return', 'Button spring'], ['Travel', 'TBD']],
    connections: [],
    material: 'Wooden dowel, brass cap, red jewel',
    buildTip: 'Drill the tube hole at exactly the height of the lever\'s top end, so the button presses the lever and not the rod.',
    related: ['button-spring', 'catch-lever', 'microswitch', 'leaf-ring'],
  },
  {
    id: 'button-spring', name: 'Button spring', qty: '1', group: 'trigger', stages: [5], version: 'mechanical',
    what: 'A pen spring slid over the button dowel.',
    why: 'It pushes the button back out after use.',
    how: 'Pushing the button squeezes it; letting go, it pushes the button back.',
    specs: [['Source', 'Pen spring'], ['Spring force', 'TBD']],
    connections: [],
    material: 'Steel spring wire',
    buildTip: 'Slide the pen spring over the dowel before you fit the cap.',
    related: ['button', 'catch-spring'],
  },
  {
    id: 'catch-lever', name: 'Catch lever', qty: '1', group: 'trigger', stages: [5], version: 'mechanical',
    what: 'A 5 cm piece of ice-cream stick pivoting on a toothpick, with a small tooth on one end.',
    why: 'It holds the push rod (and the squeezed main spring) down until the button trips it.',
    how: 'Its tooth sits in a notch in the rod. The button pushes the other end of the lever, which swings the tooth out of the notch. The rod is free and the main spring shoots it up, like a jack-in-the-box.',
    anim: 'catch',
    specs: [['Length', '5 cm'], ['Pivot', 'Toothpick through the tube wall'], ['Rod notch', '3 mm, 2 cm above the foot']],
    connections: [],
    material: 'Ice-cream stick, toothpick pivot',
    buildTip: 'Push a toothpick through the tube wall as the pivot. Glue a small tooth on its lower end and add a pen spring behind it.',
    related: ['catch-spring', 'push-rod', 'main-spring', 'button'],
  },
  {
    id: 'catch-spring', name: 'Catch spring', qty: '1', group: 'trigger', stages: [5], version: 'mechanical',
    what: 'A small spring behind the catch lever.',
    why: 'It keeps the lever\'s tooth pressed into the rod\'s notch so the lotus can\'t open by itself.',
    how: 'It pushes on the lever all the time. Only the button pushes harder, swinging the tooth out.',
    anim: 'catch',
    specs: [['Source', 'Pen spring or small rubber band'], ['Spring force', 'TBD']],
    connections: [],
    material: 'Steel spring wire or rubber band',
    buildTip: 'Test the catch several times before you add the coins.',
    related: ['catch-lever', 'button-spring'],
  },
  {
    id: 'main-spring', name: 'Main lotus spring', qty: '1', group: 'trigger', stages: [5], version: 'mechanical',
    what: 'A strong compression spring under the push rod\'s foot.',
    why: 'It is the power source of the mechanical lotus: it shoots the rod up when the catch lets go.',
    how: 'Closing the petals pushes the rod down and squeezes the spring until the catch clicks into the notch. When the catch is tripped, the spring pushes the rod up 2–3 cm.',
    anim: 'catch',
    specs: [['Size', '30–40 mm compression spring'], ['Source', 'Spring kit or a stapler spring'], ['Stroke', '2–3 cm (set by the stop collar)']],
    connections: [],
    material: 'Steel spring wire',
    buildTip: 'Start with a gentle spring. If the lotus snaps open too hard, cut a coil off or use a weaker one. Keep fingers out of the petals when you press the button.',
    related: ['push-rod', 'catch-lever', 'stop-collar'],
  },
  {
    id: 'push-rod', name: 'Push rod', qty: '1', group: 'trigger', stages: [5], version: 'both',
    what: 'A thin rod running up the centre of the tube, with a foot at the bottom and the collar on top.',
    why: 'It carries the push from below (spring or servo) up to the collar that opens the petals.',
    how: 'In the mechanical box the main spring under its foot pushes it up once the catch lets go. In the electronic box it rests on the lotus servo horn, which lifts it 2–3 cm. It is not glued to the horn, so it can still be lifted by hand from below.',
    specs: [['Made from', '5 mm dowel or skewer'], ['Foot', 'Card disc'], ['Notch', '3 mm, 2 cm above the foot'], ['Rise', '2–3 cm']],
    connections: [],
    material: 'Wooden dowel, card foot',
    buildTip: 'Fit the rod up the centre of the tube through two card guide discs. Do not glue it to the servo horn: it just rests on it (this matters for the manual override).',
    related: ['main-spring', 'collar-struts', 'servo-lotus', 'guide-discs', 'stop-collar'],
  },
  {
    id: 'stop-collar', name: 'Stop collar', qty: '1', group: 'trigger', stages: [5], version: 'mechanical',
    what: 'A collar glued on the push rod below the lower guide disc.',
    why: 'It limits the stroke, so the spring can\'t fling the petals off their hinges.',
    how: 'When the rod shoots up, the collar hits the guide disc and stops the rod after 2–3 cm.',
    specs: [['Stroke', '2–3 cm'], ['Size', 'TBD']],
    connections: [],
    material: 'TBD',
    buildTip: 'Glue the stop collar on the rod so it can only rise 2–3 cm. Check the stroke by hand before you load the spring.',
    related: ['push-rod', 'guide-discs', 'main-spring'],
  },
  {
    id: 'guide-discs', name: 'Guide discs', qty: '2', group: 'trigger', stages: [5], version: 'both',
    what: 'Two card discs inside the tube with a centre hole for the push rod.',
    why: 'They keep the rod running straight up the middle of the tube.',
    how: 'The rod slides through their centre holes. The top disc also carries the NeoPixel ring under the lotus.',
    specs: [['Count', '2'], ['Size', 'TBD']],
    connections: [],
    material: 'Card',
    buildTip: 'Place the NeoPixel ring on the top disc under the lotus, facing up, with its wires down the tube.',
    related: ['push-rod', 'core-tube', 'neopixel'],
  },
  {
    id: 'microswitch', name: 'Lever microswitch', qty: '1', group: 'trigger', stages: [5], version: 'electronic',
    what: 'A small switch with a metal lever, inside the tube opposite the button hole.',
    why: 'It tells the Arduino the button has been pushed all the way in.',
    how: 'The button presses its lever only at the very end of its path. The switch pulls A0 to GND, and in the BUTTON state the firmware runs goOpen(): the lotus servo lifts the rod and the tune plays.',
    anim: 'microswitch',
    specs: [['Type', 'Lever microswitch'], ['Pin mode', 'INPUT_PULLUP'], ['Reads', 'LOW = pressed (checked twice, 10 ms apart)']],
    connections: [{ label: 'Button pressed', board: 'Uno', pin: 'A0', code: 'PIN_BUTTON', wires: ['button'], to: 'arduino' }, GND],
    material: 'Plastic body, metal lever',
    buildTip: 'Fit the microswitch inside the tube opposite the button hole, so the button presses its lever only when pushed all the way in.',
    related: ['button', 'arduino', 'servo-lotus'],
  },

  // ───────────────────────── Lotus ─────────────────────────
  {
    id: 'petals', name: 'Copper lotus petals', qty: '4', group: 'lotus', stages: [5], version: 'both',
    what: 'Four copper petals around a brass seed pod on top of the tube, each holding one yuga coin.',
    why: 'They are the treasure chest: closed, they hide the coins; open, they show all four yugas.',
    how: 'Each petal is hinged at the tube rim. The collar and struts push them open like umbrella ribs when the rod rises. A pen spring under the collar helps them close again.',
    anim: 'umbrella',
    specs: [['Petals', '4'], ['Hinges', 'Taped, at the tube rim'], ['Coin holder', 'A pocket on each petal, or a magnet'], ['Size', 'TBD']],
    connections: [],
    material: 'Copper',
    buildTip: 'Hinge the petals at the rim with tape. Close them by hand and press down until you hear the click (mechanical) before testing.',
    related: ['collar-struts', 'coins', 'push-rod', 'neopixel'],
  },
  {
    id: 'collar-struts', name: 'Collar and struts', qty: '1 + 4', group: 'lotus', stages: [5], version: 'both',
    what: 'A collar on top of the push rod with four struts reaching out to the petals.',
    why: 'They turn the rod\'s small upward push into the petals opening outward.',
    how: 'They work like the ribs of an umbrella: as the collar rises, each strut pushes its petal outward around its hinge.',
    anim: 'umbrella',
    specs: [['Struts', '4, ice-cream sticks'], ['Closing help', 'Pen spring under the collar']],
    connections: [],
    material: 'Ice-cream sticks; brass-look collar',
    buildTip: 'Build the umbrella: a collar on top of the rod, four ice-cream-stick struts from the collar to the petals, petals hinged at the rim with tape.',
    related: ['petals', 'push-rod'],
  },
  {
    id: 'coins', name: 'Yuga coins', qty: '4', group: 'lotus', stages: [5], version: 'both',
    what: 'One coin for each yuga: Satya gold, Treta silver, Dwapara copper and Kali iron.',
    why: 'They are the reward, and each shows the dharma bull with one leg fewer as the ages go by.',
    how: 'Each sits in a pocket on its petal. When the lotus opens, the electronic box names each coin on the screen in turn.',
    specs: [['Satya', 'Gold'], ['Treta', 'Silver'], ['Dwapara', 'Copper'], ['Kali', 'Iron'], ['Diameter', 'TBD']],
    connections: [],
    material: 'Gold, silver, copper and iron (colours)',
    buildTip: 'Use a small pocket on each petal, or a magnet if your coins stick to one.',
    related: ['petals', 'leaves'],
  },

  // ───────────────────────── Piggy bank ─────────────────────────
  {
    id: 'coin-slot', name: 'Money slot', qty: '1', group: 'bank', stages: [0], version: 'both',
    what: 'A long slit with a brass rim in the front of the treasury drawer, where a handle would normally be.',
    why: 'It turns the box into a real piggy bank: coins and folded notes can be saved at any time, even while every puzzle is locked.',
    how: 'Coins and notes go straight through the slit into the drawer. The drawer needs no handle, because its spring pushes it out when the lotus opens.',
    specs: [['Position', 'Centre of the drawer front'], ['Slit size', 'TBD (longer than a folded note, wider than your thickest coin)']],
    connections: [],
    material: 'Brass-look rim cut into the carved drawer front',
    buildTip: 'Keep the slit narrow enough that fingers cannot pull money back out, but test it with your thickest coin and a folded note.',
    related: ['treasury-drawer', 'drawer-catch', 'base'],
  },
  {
    id: 'treasury-drawer', name: 'Treasury drawer', qty: '1', group: 'bank', stages: [5], version: 'both',
    what: 'A carved drawer in a new layer under the electronics bay. Coins and notes go in through the money slot in its front.',
    why: 'It is the piggy bank’s safe: savings go in any time, but come out only after all five locks are solved.',
    how: 'A catch holds the drawer shut. When the lotus opens, the rising push rod pulls the release string, the catch lifts, and a small spring behind the drawer pushes it out.',
    specs: [['Opens', 'After stage 5, when the lotus petals open'], ['Push-out spring', 'Compression (pen) spring behind the drawer'], ['Size', 'TBD']],
    connections: [],
    material: 'Teak with a carved front and a brass knob',
    buildTip: 'Make the drawer slide on two smooth runners and test that it pops out on its own before you fit the catch.',
    related: ['coin-slot', 'drawer-catch', 'release-string', 'base'],
  },
  {
    id: 'drawer-catch', name: 'Drawer catch', qty: '1', group: 'bank', stages: [5], version: 'both',
    what: 'A small sprung lever (pawl) under the bay floor whose tooth drops into a notch on the drawer.',
    why: 'It keeps the savings locked until the lotus opens.',
    how: 'A light spring keeps the tooth in the drawer’s notch. The release string lifts the lever, the tooth comes out, and the drawer is free.',
    anim: 'catch',
    specs: [['Type', 'Spring catch (pawl)'], ['Spring', 'Pen spring or small rubber band'], ['Size', 'TBD']],
    connections: [],
    material: 'Ice-cream stick with a toothpick pivot',
    buildTip: 'Use a light spring here: the push rod has to lift the catch easily, or the lotus may not open fully.',
    related: ['release-string', 'treasury-drawer', 'catch-lever'],
  },
  {
    id: 'release-string', name: 'Release string', qty: '1', group: 'bank', stages: [5], version: 'both',
    what: 'A strong thread tied to the push rod’s foot, running down through the floor to the drawer catch.',
    why: 'It links the lotus to the piggy bank: the same push that opens the petals unlocks the drawer, in both versions.',
    how: 'When the rod rises 2–3 cm (main spring or lotus servo), the string pulls the catch up. When the lotus is pressed closed again, the string goes slack and the catch drops back.',
    specs: [['Made from', 'Fishing line or strong thread'], ['Travel', '2–3 cm (the push rod stroke)']],
    connections: [],
    material: 'Fishing line',
    buildTip: 'Leave a little slack when the lotus is closed, then tighten until the catch just lifts as the rod reaches the top.',
    related: ['push-rod', 'drawer-catch', 'treasury-drawer'],
  },

  // ───────────────────────── Electronics ─────────────────────────
  {
    id: 'arduino', name: 'Arduino Uno R3', qty: '1', group: 'electronics', stages: [1, 3, 4, 5], version: 'electronic',
    what: 'A microcontroller board with an ATmega328P chip.',
    why: 'It is the brain. It reads the keypad and every sensor, decides which stage the player is on, and drives the servos, screen, LEDs and buzzer.',
    how: 'It runs yuga_lotus_locker_v2.ino in a loop. A state machine (LOCKED, LOCKOUT, PUZZLE, LEAVES, RING, BUTTON, OPEN, RESETTING, TEST) decides what each input means at each moment.',
    specs: [['Chip', 'ATmega328P'], ['Clock', '16 MHz'], ['Logic', '5 V'], ['Digital I/O', '14'], ['Analog inputs', '6']],
    connections: [
      { label: 'Keypad rows 1–4', board: 'Uno', pin: 'D2–D5', code: 'rowPins', wires: ['keypad'], to: 'keypad' },
      { label: 'Keypad columns 1–3', board: 'Uno', pin: 'D6–D8', code: 'colPins', wires: ['keypad'], to: 'keypad' },
      { label: 'Lid servo signal', board: 'Uno', pin: 'D9', code: 'PIN_LID_SERVO', wires: ['servo-lid'], to: 'servo-lid' },
      { label: 'Lotus servo signal', board: 'Uno', pin: 'D10', code: 'PIN_LOTUS_SERVO', wires: ['servo-lotus'], to: 'servo-lotus' },
      { label: 'NeoPixel data (via 330 Ω)', board: 'Uno', pin: 'D11', code: 'PIN_LEDS', wires: ['neopixel'], to: 'neopixel' },
      { label: 'Buzzer', board: 'Uno', pin: 'D12', code: 'PIN_BUZZER', wires: ['buzzer'], to: 'buzzer' },
      { label: 'Button microswitch', board: 'Uno', pin: 'A0', code: 'PIN_BUTTON', wires: ['button'], to: 'microswitch' },
      { label: 'Lid reed switch', board: 'Uno', pin: 'A1', code: 'PIN_LID_CLOSED', wires: ['lid-reed'], to: 'lid-reed' },
      { label: 'I2C data (SDA)', board: 'Uno', pin: 'A4', code: 'Wire', wires: ['i2c-pcf', 'i2c-lcd'], to: 'pcf8574' },
      { label: 'I2C clock (SCL)', board: 'Uno', pin: 'A5', code: 'Wire', wires: ['i2c-pcf', 'i2c-lcd'], to: 'lcd' },
      { label: 'GND (joined to the rail)', board: 'Uno', pin: 'GND', wires: ['power'], to: 'breadboard' },
    ],
    material: 'Printed circuit board',
    buildTip: 'Mount the Uno, PCF8574 and breadboard on the bottom plate with double-sided foam tape. Wire in this order, testing after each: LCD and PCF8574 on I2C, keypad, reed switches, microswitch, servos, LED ring, buzzer.',
    related: ['pcf8574', 'lcd', 'keypad', 'breadboard', 'wiring'],
  },
  {
    id: 'pcf8574', name: 'PCF8574 I/O expander', qty: '1', group: 'electronics', stages: [3, 4], version: 'electronic',
    what: 'A small I2C module that adds 8 input/output pins over just two wires.',
    why: 'The Uno runs out of pins: the keypad alone uses seven. The PCF8574 reads all 8 band, leaf and ring sensors over the I2C bus it shares with the screen.',
    how: 'The Arduino asks it for one byte. Each bit is one input. Its pins have weak built-in pull-ups, so an open switch reads 1 and a switch closed to GND reads 0. The firmware reads twice, 5 ms apart, to ignore bounces.',
    anim: 'i2c',
    specs: [['Bus', 'I2C (SDA A4, SCL A5)'], ['Address', '0x20 (A0–A2 to GND)'], ['Inputs', '8, weak internal pull-ups'], ['Library', 'Wire (built in)']],
    connections: [
      { label: 'SDA', board: 'Uno', pin: 'A4', wires: ['i2c-pcf'], to: 'arduino' },
      { label: 'SCL', board: 'Uno', pin: 'A5', wires: ['i2c-pcf'], to: 'arduino' },
      { label: 'Satya leaf', board: 'PCF8574', pin: 'P0', code: 'BIT_LEAF[0]', wires: ['leaf-0'], to: 'reed-leaves' },
      { label: 'Treta leaf', board: 'PCF8574', pin: 'P1', code: 'BIT_LEAF[1]', wires: ['leaf-1'], to: 'reed-leaves' },
      { label: 'Dwapara leaf', board: 'PCF8574', pin: 'P2', code: 'BIT_LEAF[2]', wires: ['leaf-2'], to: 'reed-leaves' },
      { label: 'Kali leaf', board: 'PCF8574', pin: 'P3', code: 'BIT_LEAF[3]', wires: ['leaf-3'], to: 'reed-leaves' },
      { label: 'Band 1 (top)', board: 'PCF8574', pin: 'P4', code: 'BIT_BAND[0]', wires: ['band-1'], to: 'reed-bands' },
      { label: 'Band 2 (middle)', board: 'PCF8574', pin: 'P5', code: 'BIT_BAND[1]', wires: ['band-2'], to: 'reed-bands' },
      { label: 'Band 3 (bottom)', board: 'PCF8574', pin: 'P6', code: 'BIT_BAND[2]', wires: ['band-3'], to: 'reed-bands' },
      { label: 'Ring aligned', board: 'PCF8574', pin: 'P7', code: 'BIT_RING', wires: ['ring'], to: 'reed-ring' },
      { label: '+5 V and GND from the rail', board: 'Rail', pin: '5V', wires: ['power'], to: 'breadboard' },
    ],
    material: 'Printed circuit board',
    buildTip: 'If all eight PCF digits are stuck, the address is wrong or SDA/SCL are swapped: set the A0–A2 jumpers to GND (0x20) and swap the two I2C wires. If one digit flickers, add a 10 kΩ resistor from that P pin to +5 V.',
    related: ['arduino', 'reed-bands', 'reed-leaves', 'reed-ring', 'lcd'],
  },
  {
    id: 'lcd', name: '16×2 LCD with I2C backpack', qty: '1', group: 'electronics', stages: [1, 3, 4, 5], version: 'electronic',
    what: 'A two-line, 16-character screen with a small I2C board on its back.',
    why: 'It tells the child what to do next, for example "Solve the puzzle" and "Bands Y Y –".',
    how: 'The firmware\'s show() function clears the screen and prints two lines. The backpack lets it share the same two I2C wires as the PCF8574.',
    specs: [['Size', '16 characters × 2 lines'], ['Address', '0x27 (try 0x3F if blank)'], ['Library', 'LiquidCrystal I2C (Frank de Brabander)']],
    connections: [
      { label: 'SDA', board: 'Uno', pin: 'A4', wires: ['i2c-lcd'], to: 'arduino' },
      { label: 'SCL', board: 'Uno', pin: 'A5', wires: ['i2c-lcd'], to: 'arduino' },
      { label: '+5 V and GND from the rail', board: 'Rail', pin: '5V', wires: ['power'], to: 'breadboard' },
    ],
    material: 'LCD module',
    buildTip: 'If the screen is lit but blank, turn the blue contrast screw on the backpack, or change LCD_ADDR to 0x3F.',
    related: ['arduino', 'pcf8574', 'keypad'],
  },
  {
    id: 'servo-lid', name: 'Lid latch servo (SG90)', qty: '1', group: 'electronics', stages: [1], version: 'electronic',
    what: 'A small blue motor that turns its horn to an exact angle.',
    why: 'It is the electronic latch: its horn hooks the lid\'s loop and swings clear when the code is right.',
    how: 'The angle is set by a PWM signal on D9. LID_LOCKED is 0° (horn hooks the loop) and LID_OPEN is 90° (horn swings clear). An unpowered servo can be turned by hand, which is how the hidden manual release works.',
    anim: 'servo',
    specs: [['Model', 'SG90 (or MG90S, metal gears)'], ['Locked angle', '0° (LID_LOCKED)'], ['Open angle', '90° (LID_OPEN)'], ['Power', '5 V rail, never the Uno\'s 5 V pin']],
    connections: [
      { label: 'Signal (orange)', board: 'Uno', pin: 'D9', code: 'PIN_LID_SERVO', wires: ['servo-lid'], to: 'arduino' },
      { label: '+5 V (red) from the rail', board: 'Rail', pin: '5V', wires: ['servo-lid'], to: 'breadboard' },
      { label: 'GND (brown)', board: 'Rail', pin: 'GND', wires: ['servo-lid'], to: 'breadboard' },
    ],
    material: 'Plastic case',
    buildTip: 'The manual mounts this servo inside the top of the front wall so its horn hooks the lid loop at 0° and swings clear at 90°. (The cutaway model shows it in the bay.) If a movement is too small or too big, change LID_OPEN at the top of the code.',
    related: ['lid-hook', 'arduino', 'servo-lotus', 'breadboard'],
  },
  {
    id: 'servo-lotus', name: 'Lotus servo (SG90)', qty: '1', group: 'electronics', stages: [5], version: 'electronic',
    what: 'A small motor in the bay under the tube that lifts the push rod.',
    why: 'In the electronic box it replaces the main spring and catch: it opens the lotus smoothly.',
    how: 'In goOpen() the firmware moves it one degree at a time (every 15 ms) from LOTUS_CLOSED (10°) to LOTUS_OPEN (150°), lifting the rod 2–3 cm. Pressing * moves it back.',
    anim: 'servo',
    specs: [['Model', 'SG90 (or MG90S, metal gears)'], ['Closed angle', '10° (LOTUS_CLOSED)'], ['Open angle', '150° (LOTUS_OPEN)'], ['Rod lift', '2–3 cm'], ['Power', '5 V rail, never the Uno\'s 5 V pin']],
    connections: [
      { label: 'Signal (orange)', board: 'Uno', pin: 'D10', code: 'PIN_LOTUS_SERVO', wires: ['servo-lotus'], to: 'arduino' },
      { label: '+5 V (red) from the rail', board: 'Rail', pin: '5V', wires: ['servo-lotus'], to: 'breadboard' },
      { label: 'GND (brown)', board: 'Rail', pin: 'GND', wires: ['servo-lotus'], to: 'breadboard' },
    ],
    material: 'Plastic case',
    buildTip: 'Mount it under the tube so its horn lifts the rod\'s foot about 2–3 cm. Leave a finger hole in the bay\'s bottom plate under the rod so the lotus can be pushed open by hand.',
    related: ['push-rod', 'arduino', 'servo-lid', 'capacitor'],
  },
  {
    id: 'neopixel', name: 'NeoPixel ring, 8 × WS2812B', qty: '1', group: 'electronics', stages: [3, 4, 5], version: 'electronic',
    what: 'A ring of 8 addressable RGB LEDs under the lotus.',
    why: 'It makes the lotus glow: each yuga gets 2 LEDs in its metal colour, and during the puzzle LEDs 0–2 show red or green for each band.',
    how: 'All 8 LEDs share one data wire. The Arduino sends a colour for each in turn and they pass the rest down the chain. yugaLeds(k) lights LEDs 2k and 2k+1. Brightness is set to 80.',
    anim: 'neopixel',
    specs: [['LEDs', '8 × WS2812B'], ['Data', 'D11 through 330 Ω'], ['Colour order', 'NEO_GRB'], ['Brightness', '80'], ['Library', 'Adafruit NeoPixel']],
    connections: [
      { label: 'Data in (DIN)', board: 'Uno', pin: 'D11', code: 'PIN_LEDS', wires: ['neopixel'], to: 'resistor' },
      { label: '+5 V and GND from the rail', board: 'Rail', pin: '5V', wires: ['neopixel'], to: 'breadboard' },
    ],
    material: 'LED ring module',
    buildTip: 'If the LEDs stay dark or show wrong colours, check the data wire is on the DIN pad (not the output side), or try NEO_RGB instead of NEO_GRB.',
    related: ['resistor', 'arduino', 'petals', 'guide-discs'],
  },
  {
    id: 'resistor', name: '330 Ω resistor', qty: '1', group: 'electronics', stages: [3, 4, 5], version: 'electronic',
    what: 'A small resistor in the NeoPixel data line.',
    why: 'It protects the LED data line.',
    how: 'It sits between D11 and the ring\'s data input.',
    specs: [['Value', '330 Ω'], ['Power rating', 'TBD']],
    connections: [{ label: 'From D11', board: 'Uno', pin: 'D11', code: 'PIN_LEDS', wires: ['neopixel'], to: 'neopixel' }],
    material: 'Carbon film (TBD)',
    buildTip: 'Put it on the breadboard in the data wire, close to the ring.',
    related: ['neopixel', 'breadboard'],
  },
  {
    id: 'buzzer', name: 'Passive buzzer', qty: '1', group: 'electronics', stages: [1, 3, 4, 5], version: 'electronic',
    what: 'A small round speaker that makes tones.',
    why: 'It beeps on each key and plays the opening tune when the lotus opens.',
    how: 'A passive buzzer needs a changing signal: tone(PIN_BUZZER, f, ms) sends a square wave at frequency f. The opening tune is 523, 659, 784, 1047, 784, 1047 Hz.',
    specs: [['Type', 'Passive'], ['Driven by', 'tone() on D12'], ['Key beep', '1200 Hz, 40 ms'], ['Wrong code', '200 Hz, 500 ms']],
    connections: [{ label: 'Signal', board: 'Uno', pin: 'D12', code: 'PIN_BUZZER', wires: ['buzzer'], to: 'arduino' }, GND],
    material: 'Plastic case',
    buildTip: 'The other leg of the buzzer goes to the GND rail.',
    related: ['arduino', 'keypad'],
  },
  {
    id: 'breadboard', name: 'Breadboard power rail', qty: '1', group: 'electronics', stages: [0], version: 'electronic',
    what: 'A half breadboard (or perfboard) that makes the +5 V and GND rail for everything.',
    why: 'Servos and the LED ring draw too much current for the Uno\'s own 5 V pin, so they all take power from this rail fed by the adapter.',
    how: 'The adapter\'s +5 V and GND go into the rail. The servos, NeoPixel ring, LCD and PCF8574 all take +5 V and GND from it. Every GND is joined, including the Uno\'s.',
    specs: [['Size', 'Half breadboard or perfboard'], ['Jumper wires', '40'], ['Feeds', 'Servos, NeoPixel ring, LCD, PCF8574']],
    connections: [
      { label: '+5 V in from the adapter', board: 'Rail', pin: '5V', wires: ['power', 'dc-in'], to: 'power-adapter' },
      { label: 'GND, joined to the Uno', board: 'Rail', pin: 'GND', wires: ['power'], to: 'arduino' },
    ],
    material: 'Plastic breadboard',
    buildTip: 'Power rule: never run the two servos and the LED ring from the Uno\'s 5 V pin, or the Uno will restart mid-game. If a servo buzzes or jitters, connect the adapter GND to the Uno GND.',
    related: ['capacitor', 'power-adapter', 'arduino', 'resistor'],
  },
  {
    id: 'capacitor', name: '1000 µF capacitor', qty: '1', group: 'electronics', stages: [0], version: 'electronic',
    what: 'A large capacitor across the +5 V rail.',
    why: 'It smooths the current spikes when the servos start, so the Uno doesn\'t restart.',
    how: 'It stores a little energy and gives it back during the short spike when a servo starts moving.',
    specs: [['Value', '1000 µF'], ['Voltage', '10 V'], ['Polarity', 'Long leg to +5 V']],
    connections: [{ label: 'Across the rail', board: 'Rail', pin: '5V', wires: ['power'], to: 'breadboard' }],
    material: 'Electrolytic capacitor',
    buildTip: 'Put the capacitor across the rail with the long leg to +5 V.',
    related: ['breadboard', 'servo-lid', 'servo-lotus'],
  },
  {
    id: 'power-adapter', name: '5 V 3 A adapter', qty: '1', group: 'electronics', stages: [0], version: 'electronic',
    what: 'A mains adapter with a DC jack screw terminal, its lead entering at the back of the bay.',
    why: 'It powers everything through the breadboard rail.',
    how: 'It gives a steady 5 V and up to 3 A, enough for both servos and the LED ring at once.',
    specs: [['Output', '5 V, 3 A'], ['Connector', 'DC jack screw terminal']],
    connections: [{ label: '+5 V and GND to the rail', board: 'Rail', pin: '5V', wires: ['dc-in'], to: 'breadboard' }],
    material: 'TBD',
    buildTip: 'Feed the servos and LED ring from the adapter rail and join all the grounds.',
    related: ['breadboard', 'capacitor'],
  },
  {
    id: 'magnets', name: 'Neodymium magnets 6×2 mm', qty: '10', group: 'electronics', stages: [1, 3, 4], version: 'electronic',
    what: 'Small strong disc magnets, one for each reed switch.',
    why: 'They trigger the reed switches without touching them, so nothing wears out and no wires go to the moving parts.',
    how: 'They are hidden in each band, each leaf peg, the ring and the lid. When one comes within about 5 mm of its reed switch, the switch closes.',
    anim: 'reed',
    specs: [['Size', '6×2 mm discs'], ['Count', '10 (one per reed switch)'], ['Range', 'About 5 mm']],
    connections: [],
    material: 'Neodymium',
    buildTip: 'Place each magnet side-on to its reed switch and within about 5 mm.',
    related: ['reed-bands', 'reed-leaves', 'reed-ring', 'lid-reed'],
  },
  {
    id: 'wiring', name: 'Colour-coded wiring', qty: '—', group: 'electronics', stages: [0], version: 'electronic',
    what: 'All the wires in the box, coloured by job.',
    why: 'Colours make the circuit easy to follow and fix.',
    how: 'Purple wires are sensor inputs, green and yellow are the I2C bus, blue is the keypad ribbon and LED feed, red and black are +5 V and GND, and brown/red/orange are servo leads.',
    specs: [['Jumpers', '40'], ['Ribbon / multicore', '1 m, for the turning ring and the fold-down wall']],
    connections: [],
    material: 'Jumper wire and thin multicore or ribbon wire',
    buildTip: 'Run the wall wires down through the hinge gap with a loose loop so the wall can fold. Label every wire with masking tape.',
    related: ['arduino', 'pcf8574', 'breadboard'],
  },

  // ───────────────────────── Box ─────────────────────────
  {
    id: 'wall-front', name: 'Front wall: temple arch', qty: '1', group: 'box', stages: [2], version: 'both',
    what: 'The carved teak front wall with a temple arch (torana). Inside it is painted the Satya Yuga panel.',
    why: 'It is the face of the box, and carries the dial lock on its inside.',
    how: 'It is hinged at the bottom. Once the lid lifts, the clothespin springs fold it outward (mechanical); in the electronic box the child folds it down.',
    anim: 'clothespin',
    specs: [['Carving', 'Temple arch (torana)'], ['Inside', 'Satya Yuga name, dharma-bull miniature and facts'], ['Size', 'TBD']],
    connections: [],
    material: 'Carved teak',
    buildTip: 'Hinge the four walls to the base with fabric tape so they fold down.',
    related: ['wall-left', 'wall-right', 'clothespins', 'number-wheels'],
  },
  {
    id: 'wall-left', name: 'Side wall: lotus mandala', qty: '1', group: 'box', stages: [2], version: 'both',
    what: 'A carved teak side wall with a lotus mandala. Inside: the Treta Yuga panel.',
    why: 'One of the four walls that hide the puzzle until the lid opens.',
    how: 'Hinged at the bottom, it folds outward when the lid lets go.',
    anim: 'clothespin',
    specs: [['Carving', 'Lotus mandala'], ['Inside', 'Treta Yuga name, dharma-bull miniature and facts'], ['Size', 'TBD']],
    connections: [],
    material: 'Carved teak',
    buildTip: 'Glue a small stopper so each wall stops flat.',
    related: ['wall-right', 'wall-front', 'clothespins'],
  },
  {
    id: 'wall-right', name: 'Side wall: Konark chakra', qty: '1', group: 'box', stages: [2], version: 'both',
    what: 'A carved teak side wall with a Konark-style chakra (wheel). Inside: the Dwapara Yuga panel.',
    why: 'One of the four walls that hide the puzzle until the lid opens.',
    how: 'Hinged at the bottom, it folds outward when the lid lets go.',
    anim: 'clothespin',
    specs: [['Carving', 'Konark-style chakra'], ['Inside', 'Dwapara Yuga name, dharma-bull miniature and facts'], ['Size', 'TBD']],
    connections: [],
    material: 'Carved teak',
    buildTip: 'Glue a small stopper so each wall stops flat.',
    related: ['wall-left', 'wall-front', 'clothespins'],
  },
  {
    id: 'back-acrylic', name: 'Clear acrylic back wall', qty: '1', group: 'box', stages: [2], version: 'both',
    what: 'A clear acrylic back wall framed in brass.',
    why: 'It lets you see the whole mechanism from behind.',
    how: 'It folds outward like the carved walls.',
    specs: [['Material', 'Clear acrylic'], ['Thickness', 'TBD']],
    connections: [],
    material: 'Clear acrylic, brass frame',
    buildTip: 'TBD',
    related: ['wall-front', 'base'],
  },
  {
    id: 'lid', name: 'Mandala lid', qty: '1', group: 'box', stages: [1, 2], version: 'both',
    what: 'The carved teak lid with a lotus mandala and four small wheels. Its underside carries the Kali Yuga panel.',
    why: 'Closed, it holds the walls up; the whole puzzle starts when it lifts.',
    how: 'A rim under the lid holds the tops of the walls in. When the lid pops up, the walls are free to fold out.',
    anim: 'popup',
    specs: [['Carving', 'Lotus mandala with four small wheels'], ['Underside', 'Kali Yuga panel'], ['Size', 'TBD']],
    connections: [],
    material: 'Carved teak',
    buildTip: 'To relock the mechanical box: lift the walls up and hold them, pull the bolt knob back, close the lid (squeezing its spring), then let the bolt go into the hook\'s eye.',
    related: ['lid-hook', 'lid-spring', 'lid-reed', 'wall-front'],
  },
  {
    id: 'clothespins', name: 'Clothespin hinge springs', qty: '4–6', group: 'box', stages: [2], version: 'mechanical',
    what: 'Torsion springs taken out of wooden clothespins, fixed at the wall hinges.',
    why: 'They fold the walls open by themselves when the lid lifts.',
    how: 'One leg is taped to the base and the other to the bottom of a wall, next to its hinge. The springs try to fold the walls outward, but a rim under the lid holds their tops in. When the lid pops up, the box opens out like a flower.',
    anim: 'clothespin',
    specs: [['Count', '4–6'], ['Source', 'Wooden clothespins'], ['Type', 'Torsion spring']],
    connections: [],
    material: 'Steel spring wire',
    buildTip: 'Take the springs out of four wooden clothespins. Tape one leg of each spring to the base and the other leg to the bottom of a wall, next to its hinge.',
    related: ['wall-front', 'wall-left', 'wall-right', 'lid'],
  },
  {
    id: 'base', name: 'Base and electronics bay', qty: '1', group: 'box', stages: [0], version: 'both',
    what: 'The hollow base under the box floor, with brass plinth, feet and corner straps. Its sides carry a jaali lattice. Below it is the treasury drawer layer.',
    why: 'It holds the core tube and, in the electronic box, all the electronics.',
    how: 'The bay has a removable bottom plate so you can reach the wiring. The keypad and screen sit in windows in its front.',
    specs: [['Size', 'About 20 × 20 cm, 6 cm deep'], ['Bottom', 'Removable plate'], ['Windows', 'Keypad and screen']],
    connections: [],
    material: 'Teak with brass plinth and feet',
    buildTip: 'Make a hollow base about 20 × 20 cm and 6 cm deep with a removable bottom plate. Leave a finger hole under the rod for the manual lotus release.',
    related: ['arduino', 'core-tube', 'keypad'],
  },
];

export const PART_BY_ID: Record<string, Part> = Object.fromEntries(PARTS.map((p) => [p.id, p]));

export const partName = (id: string) => PART_BY_ID[id]?.name ?? id;

export function visibleInMode(p: Part, mode: 'electronic' | 'mechanical') {
  return p.version === 'both' || p.version === mode;
}

/** Pin table rows, generated from the connections above (one row per pin/part pair). */
export interface PinRow { board: string; pin: string; signal: string; code: string; part: string; wires: string[] }
export function pinTable(): PinRow[] {
  const rows: PinRow[] = [];
  const seen = new Set<string>();
  for (const p of PARTS) {
    if (p.id === 'arduino' || p.id === 'pcf8574') continue; // hubs: list the far end instead
    for (const c of p.connections) {
      if (!c.board || !c.pin || c.board === 'Rail') continue;
      const key = c.board + c.pin + p.id;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ board: c.board, pin: c.pin, signal: c.label, code: c.code ?? '', part: p.id, wires: c.wires ?? [] });
    }
  }
  const order = (r: PinRow) => {
    const m = /^([DAP])(\d+)/.exec(r.pin);
    const b = r.board === 'Uno' ? 0 : 1;
    if (!m) return b * 1000 + 999;
    return b * 1000 + (m[1] === 'A' ? 100 : 0) + Number(m[2]);
  };
  return rows.sort((a, b) => order(a) - order(b));
}
