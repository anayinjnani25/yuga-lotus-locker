// Annotated walk-through of the real firmware file (imported raw, so it can never drift).
import { useMemo, useState } from 'react';
import source from '../../firmware/yuga_lotus_locker_v2.ino?raw';
import { PART_BY_ID } from '../data/parts';
import { partHref } from '../App';

interface Sec { id: string; title: string; start: string; parts: string[]; note: string }

// Each section starts at the first line containing `start` and runs to the next section.
const SECTIONS: Sec[] = [
  { id: 'header', title: 'What the program does', start: '/*', parts: ['arduino', 'keypad', 'servo-lid', 'servo-lotus', 'neopixel', 'buzzer', 'microswitch', 'lid-reed', 'pcf8574', 'lcd'],
    note: 'The comment at the top is the whole story in one place: the five stages, the reset, the test mode, the libraries to install and the complete wiring list. Every pin shown on this website comes from here.' },
  { id: 'libs', title: 'Libraries', start: '#include <Keypad.h>', parts: ['keypad', 'servo-lid', 'lcd', 'neopixel', 'pcf8574'],
    note: 'Keypad reads the 3×4 matrix, Servo drives the two SG90s, Wire talks I2C to the LCD and the PCF8574, LiquidCrystal_I2C prints on the screen and Adafruit_NeoPixel colours the LED ring.' },
  { id: 'settings', title: 'Settings you can change', start: '// ---------- settings', parts: ['keypad', 'servo-lid', 'servo-lotus', 'lcd', 'pcf8574'],
    note: 'The secret code (1709) and the teacher test code (0000), the servo angles for the latch (0° / 90°) and the lotus (10° / 150°), and the two I2C addresses. If a servo moves too little or too much, change these numbers and upload again.' },
  { id: 'pins', title: 'Pins', start: '// ---------- pins', parts: ['keypad', 'servo-lid', 'servo-lotus', 'neopixel', 'buzzer', 'microswitch', 'lid-reed', 'reed-leaves', 'reed-bands', 'reed-ring'],
    note: 'The keypad map and its 7 pins (rows D2–D5, columns D6–D8), the servo, LED and buzzer pins (D9–D12), the two direct inputs (A0, A1), and which PCF8574 bit belongs to each leaf, band and the ring.' },
  { id: 'yuga', title: 'Yuga data', start: '// ---------- yuga data', parts: ['neopixel', 'coins', 'lcd'],
    note: 'Names and coins for the screen, and the RGB colour of each yuga\'s metal for the LEDs: gold, silver, copper and iron.' },
  { id: 'objects', title: 'Objects and state', start: 'LiquidCrystal_I2C lcd(', parts: ['lcd', 'neopixel', 'servo-lid', 'servo-lotus'],
    note: 'The screen, LED ring and servos are created here. The State enum lists every mode the box can be in. The variables remember the typed code, wrong tries, which leaves are in and where the lotus servo is.' },
  { id: 'inputs', title: 'Reading the sensors', start: '// ---------- inputs', parts: ['pcf8574', 'reed-bands', 'reed-leaves', 'reed-ring', 'microswitch', 'lid-reed'],
    note: 'readPCF() asks the PCF8574 for one byte. pcfClosed() reads it twice, 5 ms apart, and only says "closed" if both readings agree, which ignores contact bounce. pinClosed() does the same for A0 and A1 with a 10 ms gap.' },
  { id: 'outputs', title: 'Screen, sound, lights and motion', start: '// ---------- outputs', parts: ['lcd', 'buzzer', 'neopixel', 'servo-lotus'],
    note: 'show() prints two lines, beep() plays a tone, yugaLeds(k) lights LEDs 2k and 2k+1 in yuga k\'s colour, and moveSlow() turns a servo one degree at a time so the lotus opens gently.' },
  { id: 'stages', title: 'Moving between stages', start: '// ---------- stage changes', parts: ['servo-lid', 'servo-lotus', 'lcd', 'neopixel', 'buzzer'],
    note: 'Each go…() function is one moment in the game: lock, unlock (latch servo to 90°), puzzle solved, all leaves in, holes lined up, and open (all LEDs on, lotus servo to 150°, then the six-note tune).' },
  { id: 'test', title: 'Test mode screen', start: '// ---------- test mode', parts: ['pcf8574', 'microswitch', 'lid-reed', 'lcd'],
    note: 'Shows every sensor live, for example "Lf1000 Bd110 R0" and "Btn0 Lid1". A 1 means that magnet or button is detected. Use it to check each reed switch before you play.' },
  { id: 'setup', title: 'setup()', start: '// ---------- setup', parts: ['microswitch', 'lid-reed', 'buzzer', 'pcf8574', 'lcd', 'neopixel', 'servo-lid', 'servo-lotus'],
    note: 'Runs once at power-on: inputs with pull-ups, all PCF8574 pins set as inputs by writing 0xFF, screen and LEDs started, servos attached and the lotus closed, a welcome message, then the box locks.' },
  { id: 'locked', title: 'loop(): LOCKED', start: '// ---------- main loop', parts: ['keypad', 'lcd', 'buzzer'],
    note: 'The loop reads one key and acts on the current state. While locked, digits are collected (shown as stars). Four digits are compared with 1709 (unlock) and 0000 (test mode). Three wrong tries lock the keypad. * clears the entry.' },
  { id: 'lockout', title: 'loop(): LOCKOUT', start: 'case LOCKOUT', parts: ['lcd'],
    note: 'After three wrong codes the screen counts down 10 seconds before the keypad works again.' },
  { id: 'puzzle', title: 'loop(): PUZZLE (stage 3)', start: 'case PUZZLE', parts: ['reed-bands', 'picture-bands', 'lcd', 'neopixel'],
    note: 'Twice a second it checks the three band reed switches, prints "Bands Y Y –" and colours LEDs 0–2 red or green. When all three are right it moves on to the leaves.' },
  { id: 'leaves', title: 'loop(): LEAVES (stage 4)', start: 'case LEAVES', parts: ['reed-leaves', 'leaves', 'neopixel', 'lcd', 'buzzer'],
    note: 'Watches the four leaf sockets. Each new leaf lights its two LEDs, names its yuga, counts "n of 4 leaves" and beeps a rising note. A leaf pulled out goes dark again.' },
  { id: 'ring', title: 'loop(): RING and BUTTON (stages 4–5)', start: 'case RING', parts: ['reed-ring', 'leaf-ring', 'microswitch', 'button'],
    note: 'RING waits for the ring reed (P7). BUTTON waits for the microswitch on A0. If a leaf comes out or the ring moves away, the box steps back and tells the child why.' },
  { id: 'open', title: 'loop(): OPEN (stage 5)', start: 'case OPEN', parts: ['coins', 'neopixel', 'lcd', 'servo-lotus', 'keypad'],
    note: 'Every 2.5 seconds it names the next coin and lights only that yuga\'s LEDs, then shows "Collect coins! * to close". Pressing * closes the lotus slowly.' },
  { id: 'resetting', title: 'loop(): RESETTING', start: 'case RESETTING', parts: ['reed-leaves', 'lid-reed', 'servo-lid'],
    note: 'The box locks itself once all leaves are out and the lid reed (A1) has stayed closed for 0.8 seconds.' },
  { id: 'testcase', title: 'loop(): TEST', start: 'case TEST', parts: ['servo-lid', 'servo-lotus', 'neopixel'],
    note: 'Teacher mode. 1 opens the latch, 2 opens the lotus, 3 closes both, 4 tests the LEDs and * leaves test mode and relocks.' },
];

const KW = /^(const|char|byte|int|bool|void|unsigned|long|uint8_t|enum|return|if|else|for|while|switch|case|break|true|false|default)$/;
const TYPES = /^(Keypad|Servo|LiquidCrystal_I2C|Adafruit_NeoPixel|State|Wire)$/;
function highlight(line: string) {
  const out: React.ReactNode[] = [];
  const re = /(\/\/.*$|\/\*.*?\*\/|\/\*.*$|^\s*\*.*$|^.*\*\/)|("(?:\\.|[^"])*"|'(?:\\.|[^'])*')|(#\w+)|(\b0x[0-9A-Fa-f]+\b|\b\d+\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [t] = m;
    const cls = m[1] ? 'tk-c' : m[2] ? 'tk-s' : m[3] ? 'tk-p' : m[4] ? 'tk-n' : m[5] ? (KW.test(t) ? 'tk-k' : 'tk-f') : KW.test(t) ? 'tk-k' : TYPES.test(t) ? 'tk-t' : '';
    out.push(cls ? <span key={k++} className={cls}>{t}</span> : t);
    last = m.index + t.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

export default function CodePage() {
  const lines = useMemo(() => source.replace(/\r/g, '').split('\n'), []);
  const blocks = useMemo(() => {
    const starts = SECTIONS.map((s) => lines.findIndex((l) => l.includes(s.start)));
    return SECTIONS.map((s, i) => {
      const a = starts[i];
      const b = i + 1 < starts.length ? starts[i + 1] : lines.length;
      // keep trailing blank lines out of the block
      let e = b; while (e > a && !lines[e - 1].trim()) e--;
      return { ...s, from: a, lines: lines.slice(a, e) };
    }).filter((s) => s.from >= 0);
  }, [lines]);
  const [copied, setCopied] = useState('');

  async function copy() {
    try { await navigator.clipboard.writeText(source); setCopied('Copied'); }
    catch { setCopied('Copy failed: select the code and press Ctrl+C'); }
    setTimeout(() => setCopied(''), 2500);
  }

  return (
    <>
      <h1>Code</h1>
      <p className="lede">The real Arduino program, <code>firmware/yuga_lotus_locker_v2.ino</code> ({lines.length} lines), split into sections. Each note links to the parts that section reads or drives.</p>
      <p><button className="btn" onClick={copy}>{copied || 'Copy the whole program'}</button></p>
      <div className="code-layout">
        <nav className="code-toc card" aria-label="Code sections">
          <ol>{blocks.map((b) => <li key={b.id}><a href={`#/code`} onClick={(e) => { e.preventDefault(); document.getElementById('code-' + b.id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }}>{b.title}</a></li>)}</ol>
        </nav>
        <div>
          {blocks.map((b) => (
            <section key={b.id} id={'code-' + b.id} className="code-sec" aria-labelledby={'h-' + b.id}>
              <pre className="code" tabIndex={0} aria-label={`${b.title}, lines ${b.from + 1} to ${b.from + b.lines.length}`}>
                {b.lines.map((l, i) => <div key={i}><span className="ln">{b.from + i + 1}</span>{highlight(l)}</div>)}
              </pre>
              <div className="code-note">
                <h3 id={'h-' + b.id}>{b.title}</h3>
                <p>{b.note}</p>
                <div className="related">
                  {b.parts.map((id) => <a key={id} className="rel" href={partHref(id)} style={{ textDecoration: 'none' }}>{PART_BY_ID[id]?.name ?? id} ↗</a>)}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
