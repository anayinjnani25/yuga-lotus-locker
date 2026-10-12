// Build guide. Text from reference/yuga-locker-manual.html; part names link into the 3D view.
import { partHref } from '../App';
import { PART_BY_ID } from '../data/parts';

const L = ({ id, children }: { id: string; children?: React.ReactNode }) => (
  <a href={partHref(id)} title={`Show ${PART_BY_ID[id]?.name} in 3D`}>{children ?? PART_BY_ID[id]?.name}</a>
);

const PARTS_LIST: [React.ReactNode, string, string][] = [
  [<L id="arduino">Arduino Uno R3 + USB cable</L>, '1', 'The controller'],
  [<L id="keypad">3×4 membrane keypad</L>, '1', 'Entering 1709'],
  [<L id="lcd">16×2 LCD with I2C backpack</L>, '1', 'Step-by-step instructions'],
  [<L id="pcf8574">PCF8574 I/O expander module</L>, '1', 'Reads the 8 leaf, band and ring sensors'],
  [<><L id="servo-lid">SG90</L> or MG90S micro servo</>, '2', 'Lid latch and lotus push rod (MG90S has metal gears, stronger)'],
  [<L id="neopixel">WS2812B NeoPixel ring, 8 LEDs</L>, '1', 'Glow under the lotus in each yuga\'s metal colour'],
  [<L id="buzzer">Passive buzzer</L>, '1', 'Beeps and the opening tune'],
  [<L id="reed-bands">Reed switch, normally open</L>, '10', '4 leaves, 3 bands, 1 ring, 1 lid, 1 spare'],
  [<L id="magnets">Neodymium disc magnet, 6×2 mm</L>, '10', 'One per reed switch'],
  [<L id="microswitch">Lever microswitch</L>, '1', 'Detects the pushed button'],
  [<L id="power-adapter">5 V 3 A adapter + DC jack terminal</L>, '1', 'Power for everything'],
  [<><L id="capacitor">1000 µF 10 V capacitor</L>, <L id="resistor">330 Ω resistor</L></>, '1 each', 'Steady servo power, protects the LED data line'],
  [<L id="breadboard">Half breadboard or perfboard, jumper wires</L>, '1 + 40', 'Connections in the base'],
  [<L id="wiring">Thin multicore or ribbon wire</L>, '1 m', 'The turning leaf ring and the fold-down wall'],
];

const SPRINGS: [React.ReactNode, string, string, string][] = [
  [<L id="bolt">Bolt spring</L>, '1', 'Pulls the bolt into the wheel notches', 'Rubber band or small tension spring'],
  [<L id="lid-spring" />, '1–2', 'Lifts the lid when the bolt lets go', 'Retractable ball-pen spring'],
  [<L id="clothespins">Wall springs</L>, '4', 'Fold the walls open', 'Wooden clothespins'],
  [<L id="click-stops">Click-stop springs</L>, '4', 'Click for each band position and the aligned ring', 'Pen springs with small beads'],
  [<L id="main-spring" />, '1', 'Shoots the rod up', 'Stapler spring or a 30–40 mm spring from a spring kit'],
  [<L id="catch-spring" />, '1', 'Keeps the tooth in the notch', 'Pen spring or small rubber band'],
  [<L id="button-spring" />, '1', 'Pushes the button back out', 'Pen spring slid over the dowel'],
];

const FIX: [string, string, React.ReactNode][] = [
  ['Screen is lit but blank', 'Contrast or address', <>Turn the blue screw on the <L id="lcd">backpack</L>; change <code>LCD_ADDR</code> to 0x3F</>],
  ['Uno restarts when a servo moves', 'Servos on the Uno\'s 5 V pin', <>Power servos from the <L id="breadboard">rail</L>, add the <L id="capacitor">1000 µF capacitor</L></>],
  ['A sensor digit never changes', 'Magnet too far, or wire not to GND', <><L id="magnets">Magnet</L> within about 5 mm, side-on to the reed; check its GND leg</>],
  ['All eight PCF digits stuck', 'Wrong address or SDA/SCL swapped', <>A0–A2 jumpers to GND (0x20); swap the two I2C wires on the <L id="pcf8574">PCF8574</L></>],
  ['A digit flickers', 'Long wire picks up noise', 'Add a 10 kΩ resistor from that P pin to +5 V'],
  ['Wrong keys typed', 'Keypad pins in a different order', <>Swap the order in <code>rowPins</code> and <code>colPins</code></>],
  ['LEDs dark or wrong colours', 'Data wire on the output side, or colour order', <>Use the DIN pad on the <L id="neopixel">ring</L>; try <code>NEO_RGB</code> instead of <code>NEO_GRB</code></>],
  ['Servo buzzes or jitters', 'Grounds not joined', 'Connect the adapter GND to the Uno GND'],
];

export default function BuildPage() {
  return (
    <>
      <h1>Build guide</h1>
      <p className="lede">How to build both versions of the box: the electronic one with an Arduino, and the spring-powered one with no electronics at all. Underlined part names open that part in 3D. For other hinges, springs and catches you could use, see <a href="#/mechanisms">Mechanisms</a>.</p>
      <nav className="toc" aria-label="On this page">
        {[['parts', 'Parts list'], ['springs', 'Springs'], ['electronic', 'Electronic build'], ['mechanical', 'Mechanical build'], ['test', 'Test mode'], ['override', 'Manual override'], ['play', 'How to play'], ['fix', 'Troubleshooting']].map(([id, t]) => (
          <a key={id} href="#/build" onClick={(e) => { e.preventDefault(); document.getElementById('b-' + id)?.scrollIntoView({ behavior: 'smooth' }); }}>{t}</a>
        ))}
      </nav>

      <h2 id="b-parts">Parts list (electronic version)</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Part</th><th>Qty</th><th>Used for</th></tr></thead>
        <tbody>{PARTS_LIST.map(([a, q, u], i) => <tr key={i}><td>{a}</td><td className="mono">{q}</td><td>{u}</td></tr>)}</tbody>
      </table></div>
      <div className="note warn"><b>Power rule:</b> never run the two servos and the LED ring from the Uno's own 5 V pin. They draw too much current and the Uno will restart mid-game. Feed them from the 5 V adapter rail and join all the grounds.</div>

      <h2 id="b-springs">Springs you need (mechanical version)</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Spring</th><th>Qty</th><th>Job</th><th>Easy source</th></tr></thead>
        <tbody>{SPRINGS.map(([a, q, j, s], i) => <tr key={i}><td>{a}</td><td className="mono">{q}</td><td>{j}</td><td>{s}</td></tr>)}</tbody>
      </table></div>

      <h2 id="b-electronic">Electronic build</h2>
      <p>Build the mechanical parts first and check that each one moves freely before you add any sensor.</p>
      <div className="grid2">
        <section className="card"><h3 className="part-h"><span className="tag">Part A</span>Box, lid latch and lid sensor</h3><ol className="steps">
          <li><div><b>Make a hollow <L id="base">base</L></b> about 20 × 20 cm and 6 cm deep with a removable bottom plate. This is the electronics bay.</div></li>
          <li><div><b>Hinge the four walls</b> to the base with fabric tape so they fold down, and hinge the <L id="lid" /> to the back wall.</div></li>
          <li><div><b>Fit the latch.</b> Bend a <L id="lid-hook">paper-clip loop</L> under the front edge of the lid. Mount the <L id="servo-lid">lid servo</L> inside the top of the front wall so its horn hooks the loop at 0° and swings clear at 90°.</div></li>
          <li><div><b>Add the lid sensor.</b> Glue a <L id="magnets">magnet</L> under the lid's front edge and a <L id="lid-reed">reed switch</L> in the top of the front wall directly below it.</div></li>
          <li><div><b>Cut windows</b> in the front of the base for the <L id="keypad" /> and the <L id="lcd">screen</L>. Run the wall wires down through the hinge gap with a loose loop so the wall can fold.</div></li>
        </ol></section>
        <section className="card"><h3 className="part-h"><span className="tag">Part B</span>Picture puzzle bands</h3><ol className="steps">
          <li><div><b>Fix the <L id="core-tube">core tube</L></b> (50 mm PVC pipe or a strong card tube) upright in the centre of the base.</div></li>
          <li><div><b>Make three card rings</b> slightly wider than the tube so they turn freely. Stack them with thin spacers between.</div></li>
          <li><div><b>Cut each yuga picture</b> into three horizontal strips. Glue the top strips around band 1, the middle strips around band 2 and the bottom strips around band 3, in the same order.</div></li>
          <li><div><b>Hide a magnet</b> inside each band behind the Satya strip. Tape a <L id="reed-bands">reed switch</L> inside the tube at each band's height, at the front mark.</div></li>
          <li><div><b>Cut four notches</b> in the lower edge of band 3. Only when the puzzle is solved do the notches sit over the four leaf sockets.</div></li>
        </ol></section>
        <section className="card"><h3 className="part-h"><span className="tag">Part C</span>Leaf ring, sockets and leaves</h3><ol className="steps">
          <li><div><b>Make the <L id="leaf-ring">leaf ring</L></b> below the bands. Add a stopper peg so it can turn only about a quarter turn. That keeps its wires from twisting.</div></li>
          <li><div><b>Cut four <L id="leaf-sockets">shaped sockets</L></b> (circle, triangle, square, star), one per yuga, and glue a <L id="reed-leaves">reed switch</L> behind each.</div></li>
          <li><div><b>Make the <L id="leaves">leaves</L></b> from card covered in copper tape. Give each a peg of its yuga's shape with a magnet in the tip.</div></li>
          <li><div><b>Line up the holes.</b> Drill a 10 mm hole in the ring and one in the core at the same height. Glue a magnet on the ring beside its hole and a <L id="reed-ring">reed switch</L> on the core.</div></li>
          <li><div><b>Route the ring wires</b> as one bundle through a slot into the tube and down to the bay, leaving a loose loop.</div></li>
        </ol></section>
        <section className="card"><h3 className="part-h"><span className="tag">Part D</span>Push rod, lotus and button</h3><ol className="steps">
          <li><div><b>Fit the <L id="push-rod">push rod</L></b> (5 mm dowel or skewer) up the centre of the tube through two card <L id="guide-discs">guide discs</L>.</div></li>
          <li><div><b>Mount the <L id="servo-lotus">lotus servo</L></b> under the tube so its horn lifts the rod's foot about 2–3 cm. Do not glue the rod to the horn; it just rests on it.</div></li>
          <li><div><b>Build the umbrella:</b> a <L id="collar-struts">collar</L> on top of the rod, four ice-cream-stick struts to the <L id="petals">petals</L>, petals hinged at the rim with tape. Add a pen spring under the collar to help the petals close.</div></li>
          <li><div><b>Place the <L id="neopixel">NeoPixel ring</L></b> on the top disc under the lotus, facing up, with its wires down the tube.</div></li>
          <li><div><b>Fit the <L id="microswitch">microswitch</L></b> inside the tube opposite the button hole, so the button presses its lever only when pushed all the way in.</div></li>
          <li><div><b><L id="coins">Coin</L> holders:</b> a small pocket on each petal, or a magnet if your coins stick to one.</div></li>
        </ol></section>
        <section className="card"><h3 className="part-h"><span className="tag">Part E</span>Electronics bay</h3><ol className="steps">
          <li><div><b>Mount the <L id="arduino">Uno</L>, <L id="pcf8574">PCF8574</L> and <L id="breadboard">breadboard</L></b> on the bottom plate with double-sided foam tape.</div></li>
          <li><div><b>Make the power rail</b> on the breadboard: adapter +5 V and GND in, <L id="capacitor">capacitor</L> across the rail (long leg to +5 V).</div></li>
          <li><div><b>Wire in this order,</b> testing after each: LCD and PCF8574 on I2C, keypad, reed switches, microswitch, servos, LED ring, buzzer. Follow the <a href="#/circuit">circuit diagram</a>.</div></li>
          <li><div><b>Label every wire</b> with masking tape (for example "P2 Dwapara").</div></li>
        </ol></section>
      </div>

      <h2 id="b-mechanical">Mechanical build (no electronics)</h2>
      <p>No Arduino, no batteries and no wires. Springs do all the work: the lid pops up when the code is right, the walls spring open, the bands and ring click into place, and the lotus bursts open when the button trips a catch, like a jack-in-the-box.</p>
      <div className="table-wrap"><table>
        <thead><tr><th>Stage</th><th>Mechanical lock</th><th>Springs used</th></tr></thead>
        <tbody>
          <tr><td>1 Code</td><td>Four <L id="number-wheels">number wheels</L> on one axle. A spring-pulled <L id="bolt">bolt</L> drops into their notches only at 1-7-0-9 and lets go of the lid.</td><td>Bolt spring, lid pop-up spring</td></tr>
          <tr><td>2 Walls</td><td>The lid holds the walls up. Once it lifts, the walls fold out on their own.</td><td>4 <L id="clothespins">clothespin springs</L> at the hinges</td></tr>
          <tr><td>3 Puzzle</td><td>Notches in the bottom band uncover the leaf sockets only when the pictures are whole.</td><td>3 <L id="click-stops">click springs</L> (one per band)</td></tr>
          <tr><td>4 Leaves</td><td>Shaped pegs fit only their own socket. The ring is smooth and sunk, so the leaves are the only handles.</td><td>1 click spring for the aligned holes</td></tr>
          <tr><td>5 Lotus</td><td>A strong spring pushes the rod up, held down by a catch. The button trips the catch.</td><td><L id="main-spring">Main lotus spring</L>, <L id="catch-spring">catch spring</L>, <L id="button-spring">button return spring</L></td></tr>
        </tbody>
      </table></div>
      <div className="grid2" style={{ marginTop: 14 }}>
        <section className="card"><h3>Stage 1: dial lock</h3><ol className="steps">
          <li><div><b>Cut four wheels</b> 6 cm across from three layers of card glued together (or foam board), each with a centre hole for a 5 mm dowel axle.</div></li>
          <li><div><b>Mark 0–9</b> evenly round each rim (every 36°). Mount the axle inside the front wall so one row of digits shows through a slot window.</div></li>
          <li><div><b>Cut the notches.</b> Turn the wheels to 1, 7, 0 and 9. Mark the point on each rim that faces the bolt, then cut an 8 mm notch there.</div></li>
          <li><div><b>Make the <L id="bolt">bolt</L></b> from an ice-cream stick with four stick-piece teeth, one touching each wheel. Slide it through two straw guides and hook the spring on.</div></li>
          <li><div><b>Fit the <L id="lid-hook">hook</L> and <L id="lid-spring">pop-up spring</L>.</b> Glue a paper-clip hook under the lid so the bolt's end passes through its eye. Put a pen spring in a short straw pocket on top of the wall.</div></li>
          <li><div><b>Add a knob</b> (a bead on the bolt, poking out of the side) so you can pull the bolt back when relocking.</div></li>
        </ol><p className="small muted">To change the code, cut new notches in fresh wheels. A washer between the wheels adds friction so they don't spin on their own.</p></section>
        <section className="card"><h3>Stages 2 to 4: walls, click-stops and leaf ring</h3>
          <p><b>Walls that spring open.</b> Take the springs out of four wooden clothespins. Tape one leg of each spring to the base and the other leg to the bottom of a wall, next to its hinge. A rim under the lid holds their tops in. When the lid pops up, the box opens out like a flower. Glue a small stopper so each wall stops flat.</p>
          <p><b>Click-stops for the bands.</b> Push a pen spring and a bead into a short straw glued inside the tube at each band's height, so the bead presses out through a hole in the tube wall. Poke four shallow dimples inside each band, one per picture position.</p>
          <p><b>Leaf ring and aligned holes.</b> Sink the ring slightly into a smooth sleeve so it can't be gripped. Give each leaf peg its yuga's shape. Add one more bead click-stop with a single dimple where the ring hole lines up with the tube hole, and a stopper peg so the ring turns only about a quarter turn.</p>
        </section>
        <section className="card"><h3>Stage 5: spring-loaded lotus trigger</h3><ol className="steps">
          <li><div><b>Make the <L id="push-rod">rod</L></b> from a 5 mm dowel. Glue a card disc (the foot) near the bottom and cut a 3 mm notch 2 cm above the foot.</div></li>
          <li><div><b>Put the <L id="main-spring">main spring</L></b> in the bottom of the tube, under the foot.</div></li>
          <li><div><b>Fit the <L id="catch-lever">catch lever</L></b>, a 5 cm piece of ice-cream stick. Push a toothpick through the tube wall as its pivot. Glue a small tooth on its lower end and add a pen spring behind it.</div></li>
          <li><div><b>Line up the button hole.</b> Drill the tube hole at exactly the height of the lever's top end, so the <L id="button">button</L> presses the lever and not the rod.</div></li>
          <li><div><b>Limit the stroke.</b> Glue a <L id="stop-collar">stop collar</L> on the rod so it can only rise 2–3 cm.</div></li>
          <li><div><b>Cock it:</b> close the petals by hand and press down until you hear the click. Test the button several times before you add the coins.</div></li>
        </ol><div className="note small">Start with a gentle spring. If the lotus snaps open too hard, cut a coil off the spring or use a weaker one. Keep fingers out of the petals when you press the button.</div></section>
        <section className="card"><h3>Reset: locking the mechanical box again</h3><ol className="steps">
          <li><div>Put the coins back and press the petals closed until the catch clicks.</div></li>
          <li><div>Turn the ring back with the leaves, then pull the leaves out.</div></li>
          <li><div>Turn the picture bands to mix up the pictures.</div></li>
          <li><div>Lift the walls up and hold them. Pull the bolt knob back, close the lid (squeezing its spring), then let the bolt go into the hook's eye.</div></li>
          <li><div>Spin the number wheels away from 1-7-0-9.</div></li>
        </ol></section>
      </div>

      <h2 id="b-test">Test mode and calibration</h2>
      <section className="card"><ol className="steps">
        <li><div><b>Install the libraries</b> in Arduino IDE (Tools → Manage Libraries): Keypad, LiquidCrystal I2C, Adafruit NeoPixel. Upload <a href="#/code"><code>yuga_lotus_locker_v2.ino</code></a>.</div></li>
        <li><div><b>Enter test mode:</b> type <code>0000</code>. The screen shows every sensor live, for example <code>Lf1000 Bd110 R0</code>. A 1 means that magnet or button is detected.</div></li>
        <li><div><b>Check each sensor</b> by moving its magnet or pressing it and watching its digit change. Move reed switches closer if a digit does not change.</div></li>
        <li><div><b>Test the motors:</b> in test mode, <code>1</code> opens the latch, <code>2</code> opens the lotus, <code>3</code> closes both and <code>4</code> lights the LEDs. If a movement is too small or too big, change <code>LID_OPEN</code> or <code>LOTUS_OPEN</code> at the top of the code and upload again.</div></li>
        <li><div><b>Press * to leave test mode</b> and play through the whole game once.</div></li>
      </ol></section>

      <h2 id="b-override">Manual override (no power needed)</h2>
      <p>All the puzzles are physical, so they keep working without electricity. Only the lid latch and the lotus need power, and each has a hidden manual release.</p>
      <div className="grid2">
        <section className="card"><h3>Lid: hidden latch release</h3><p>Drill a 3 mm pin hole in the back wall where it lines up with the <L id="servo-lid">servo horn</L>, and hide it behind a small carved slide. Push a straightened paper clip in to nudge the horn off the loop. An unpowered servo can be turned by hand.</p></section>
        <section className="card"><h3>Lotus: push from below</h3><p>The <L id="push-rod">rod</L> only rests on the servo horn, so it can be lifted without the motor. Leave a finger hole in the bay's bottom plate under the rod, or use a longer button with a ramp tip that lifts the rod by itself when pushed in.</p></section>
        <section className="card"><h3>Teacher code</h3><p>With power on, code <code>0000</code> opens test mode, where key <code>1</code> opens the latch and <code>2</code> opens the lotus without solving anything. Change <code>TEST_CODE</code> in the program before the children play.</p></section>
      </div>

      <h2 id="b-play">How to play</h2>
      <section className="card"><ol className="steps">
        <li><div>Type the secret code on the keypad. The lid unlocks. Open it and fold the walls down.</div></li>
        <li><div>Turn the three picture bands until all four yuga pictures are whole. The screen shows a Y for each correct band.</div></li>
        <li><div>Match each leaf to its yuga socket and push it in. The lotus lights up in that yuga's metal colour.</div></li>
        <li><div>Use the leaves as handles and turn the ring until the screen says the holes line up.</div></li>
        <li><div>Push the button all the way in. The lotus opens: collect a coin from each petal.</div></li>
        <li><div>Press * to close the lotus, take the leaves out and close the lid. The box locks itself.</div></li>
      </ol><p><a className="btn" href="#/how" style={{ textDecoration: 'none', display: 'inline-block' }}>Watch the play-through ▸</a></p></section>

      <h2 id="b-fix">Troubleshooting</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Problem</th><th>Likely cause</th><th>Fix</th></tr></thead>
        <tbody>{FIX.map(([p, c, f], i) => <tr key={i}><td><b>{p}</b></td><td>{c}</td><td>{f}</td></tr>)}</tbody>
      </table></div>
    </>
  );
}
