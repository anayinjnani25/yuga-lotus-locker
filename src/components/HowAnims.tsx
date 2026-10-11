// Tiny looping SVG diagrams for the "How it works" section of the detail panel.
// CSS-driven; with prefers-reduced-motion they stop and show the end state with a caption.
import type { AnimId } from '../data/parts';

const C = { ink: 'var(--a-ink)', mute: 'var(--a-mute)', brass: '#C9A04A', copper: '#D9825A', red: '#D8402F', green: '#2FB36B', blue: '#3A7FD6', purple: '#8E5BD8', glass: '#BFE6F7' };

function Frame({ children, caption, label }: { children: React.ReactNode; caption: string; label: string }) {
  return (
    <figure className="how-anim">
      <svg viewBox="0 0 320 130" role="img" aria-label={label}>{children}</svg>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

const Reed = () => (
  <Frame label="A magnet slides past a reed switch and the two reeds touch" caption="Magnet within about 5 mm → the reeds touch → the input reads 0 (closed).">
    <rect x="70" y="50" width="180" height="30" rx="15" fill={C.glass} opacity=".45" stroke={C.mute} />
    <line x1="30" y1="65" x2="160" y2="65" stroke={C.ink} strokeWidth="3" className="a-reed-l" />
    <line x1="290" y1="65" x2="150" y2="65" stroke={C.ink} strokeWidth="3" className="a-reed-r" />
    <g className="a-magnet"><rect x="125" y="92" width="70" height="20" rx="3" fill={C.red} /><rect x="160" y="92" width="35" height="20" rx="3" fill={C.blue} /><text x="140" y="106" fontSize="11" fill="#fff" fontWeight="800">N</text><text x="173" y="106" fontSize="11" fill="#fff" fontWeight="800">S</text></g>
    <circle cx="300" cy="24" r="8" className="a-reed-led" />
    <text x="220" y="28" fontSize="11" fill={C.mute}>input</text>
  </Frame>
);

const Catch = () => (
  <Frame label="The button pushes the catch lever, its tooth leaves the notch and the spring pushes the rod up" caption="Button pushes the lever → the tooth leaves the notch → the main spring shoots the rod up.">
    <g className="a-rod"><rect x="52" y="20" width="16" height="100" fill={C.brass} /><rect x="62" y="70" width="6" height="8" fill="#2a1a10" /></g>
    <path d="M40 125 l40 0" stroke={C.mute} strokeWidth="2" />
    <polyline points="44,124 76,118 44,112 76,106 44,100" fill="none" stroke={C.mute} strokeWidth="2" className="a-spring" />
    <g className="a-lever" style={{ transformOrigin: '120px 74px' }}><line x1="66" y1="74" x2="180" y2="74" stroke="#D9B98A" strokeWidth="8" strokeLinecap="round" /><circle cx="120" cy="74" r="4" fill={C.ink} /></g>
    <g className="a-button"><rect x="200" y="62" width="90" height="12" rx="3" fill="#C9A27A" /><circle cx="296" cy="68" r="10" fill={C.brass} /></g>
  </Frame>
);

const Servo = () => (
  <Frame label="A servo turns its horn to the angle set by a PWM signal" caption="The PWM pulse width sets the angle; the horn turns and holds it.">
    <rect x="40" y="40" width="110" height="60" rx="6" fill={C.blue} />
    <circle cx="120" cy="40" r="10" fill="#eee" />
    <g className="a-horn" style={{ transformOrigin: '120px 40px' }}><rect x="118" y="36" width="70" height="8" rx="4" fill="#f4f4f4" stroke={C.mute} /></g>
    <polyline points="200,100 210,100 210,80 222,80 222,100 260,100 270,100 270,80 282,80 282,100 300,100" fill="none" stroke={C.green} strokeWidth="2.5" />
    <polyline points="200,120 210,120 210,104 238,104 238,120 260,120 270,120 270,104 298,104 298,120" fill="none" stroke={C.copper} strokeWidth="2.5" className="a-pwm2" />
    <text x="200" y="68" fontSize="11" fill={C.mute}>PWM signal</text>
  </Frame>
);

const Keypad = () => (
  <Frame label="Pressing a key joins one row wire to one column wire" caption="A key joins one row (D2–D5) to one column (D6–D8): 12 keys, 7 pins.">
    {[0, 1, 2, 3].map((r) => <line key={r} x1="30" y1={22 + r * 26} x2="190" y2={22 + r * 26} stroke={r === 2 ? C.green : C.mute} strokeWidth={r === 2 ? 3 : 1.5} className={r === 2 ? 'a-hot' : ''} />)}
    {[0, 1, 2].map((c) => <line key={c} x1={70 + c * 50} y1="10" x2={70 + c * 50} y2="110" stroke={c === 0 ? C.green : C.mute} strokeWidth={c === 0 ? 3 : 1.5} className={c === 0 ? 'a-hot' : ''} />)}
    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k, i) => (
      <g key={k} className={k === '7' ? 'a-key' : ''}><circle cx={70 + (i % 3) * 50} cy={22 + Math.floor(i / 3) * 26} r="10" fill={k === '7' ? C.brass : 'var(--a-bg)'} stroke={C.mute} /><text x={70 + (i % 3) * 50} y={26 + Math.floor(i / 3) * 26} fontSize="11" textAnchor="middle" fill={C.ink} fontWeight="800">{k}</text></g>
    ))}
    <text x="210" y="74" fontSize="12" fill={C.ink}>Row 3 (D4)</text><text x="210" y="92" fontSize="12" fill={C.ink}>+ Col 1 (D6)</text><text x="210" y="110" fontSize="12" fill={C.green} fontWeight="800">= key 7</text>
  </Frame>
);

const Wheels = () => (
  <Frame label="Four wheels turn until all four notches face the bolt, then the bolt slides in" caption="Only at 1-7-0-9 do all four notches face the bolt, so its teeth can drop in.">
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`translate(${60 + i * 62} 50)`}>
        <g className={`a-wheel a-wheel-${i}`}><circle r="26" fill="#7A5033" stroke={C.mute} /><rect x="-5" y="20" width="10" height="8" fill="var(--a-bg)" /></g>
        <text y="5" textAnchor="middle" fontSize="16" fill="#F2E2C0" fontWeight="800">{'1709'[i]}</text>
      </g>
    ))}
    <g className="a-bolt"><rect x="30" y="94" width="250" height="10" fill="#D9B98A" />{[0, 1, 2, 3].map((i) => <rect key={i} x={55 + i * 62} y="84" width="10" height="10" fill="#D9B98A" />)}</g>
  </Frame>
);

const Umbrella = () => (
  <Frame label="The rod lifts the collar and the struts push the petals open" caption="Like umbrella ribs: the collar rises and the struts push each petal out.">
    <rect x="152" y="70" width="16" height="60" fill={C.brass} className="a-urod" />
    <g className="a-pl" style={{ transformOrigin: '140px 70px' }}><path d="M140 70 Q110 40 120 6 Q140 30 140 70Z" fill={C.copper} /></g>
    <g className="a-pr" style={{ transformOrigin: '180px 70px' }}><path d="M180 70 Q210 40 200 6 Q180 30 180 70Z" fill={C.copper} /></g>
    <rect x="130" y="66" width="60" height="8" fill={C.brass} />
  </Frame>
);

const I2C = () => (
  <Frame label="The Uno reads one byte from the PCF8574 over two wires" caption="One byte over SDA/SCL. Each bit is one sensor: 1 = open, 0 = closed.">
    <rect x="10" y="40" width="70" height="50" rx="6" fill={C.blue} /><text x="45" y="70" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="800">Uno</text>
    <rect x="240" y="40" width="70" height="50" rx="6" fill="#2A2F8F" /><text x="275" y="70" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800">PCF8574</text>
    <line x1="80" y1="55" x2="240" y2="55" stroke={C.green} strokeWidth="3" /><line x1="80" y1="75" x2="240" y2="75" stroke="#E2C23A" strokeWidth="3" />
    <g className="a-bits">{'10110111'.split('').map((b, i) => <text key={i} x={104 + i * 15} y="48" fontSize="13" fontWeight="800" fill={b === '0' ? C.green : C.mute}>{b}</text>)}</g>
    <text x="96" y="102" fontSize="10" fill={C.mute}>P7 … P0</text>
  </Frame>
);

const Clothespin = () => (
  <Frame label="A torsion spring at the hinge folds the wall outward" caption="One leg on the base, one on the wall: when the lid lets go, the spring folds the wall out.">
    <rect x="30" y="100" width="260" height="12" fill="#6B4428" />
    <g className="a-wall" style={{ transformOrigin: '160px 100px' }}><rect x="152" y="10" width="16" height="90" fill="#8A5A36" /></g>
    <circle cx="160" cy="100" r="9" fill="none" stroke={C.mute} strokeWidth="3" />
  </Frame>
);

const Bands = () => (
  <Frame label="Three bands slide until the picture lines up" caption="Three bands, one strip each. The picture is whole in only one position.">
    {[0, 1, 2].map((r) => (
      <g key={r} className={`a-band a-band-${r}`}>
        {[0, 1, 2, 3, 4, 5].map((k) => <rect key={k} x={-80 + k * 80} y={14 + r * 36} width="78" height="34" fill={['#E9C874', '#D2D8DE', '#D99A6C', '#5A5E66'][k % 4]} />)}
      </g>
    ))}
    <rect x="120" y="12" width="80" height="110" fill="none" stroke={C.brass} strokeWidth="3" />
  </Frame>
);

const Neopixel = () => (
  <Frame label="Eight LEDs in a ring, two per yuga" caption="One data wire, 8 LEDs. LEDs 2k and 2k+1 light in yuga k's metal colour.">
    {Array.from({ length: 8 }, (_, j) => { const a = (j / 8) * Math.PI * 2; return <circle key={j} cx={160 + Math.cos(a) * 44} cy={65 + Math.sin(a) * 44} r="9" className={`a-led a-led-${j >> 1}`} />; })}
  </Frame>
);

const Micro = () => (
  <Frame label="The button presses the microswitch lever at the end of its travel" caption="At the end of its travel the button presses the lever and A0 reads LOW.">
    <rect x="40" y="70" width="70" height="40" rx="4" fill="#1a1a1a" />
    <g className="a-mlever" style={{ transformOrigin: '50px 70px' }}><line x1="50" y1="70" x2="120" y2="52" stroke="#BFC4C8" strokeWidth="4" /></g>
    <g className="a-mbtn"><rect x="150" y="44" width="130" height="14" rx="3" fill="#C9A27A" /><circle cx="286" cy="51" r="10" fill={C.brass} /></g>
    <circle cx="80" cy="30" r="8" className="a-reed-led" /><text x="94" y="34" fontSize="11" fill={C.mute}>A0</text>
  </Frame>
);

const Popup = () => (
  <Frame label="The pen spring lifts the lid when the bolt lets go" caption="The squeezed pen spring pushes the lid up as soon as the bolt lets go.">
    <rect x="60" y="100" width="200" height="14" fill="#6B4428" />
    <polyline points="150,100 170,94 150,88 170,82 150,76 170,70" fill="none" stroke={C.mute} strokeWidth="3" className="a-pspring" />
    <g className="a-lid" style={{ transformOrigin: '60px 64px' }}><rect x="60" y="58" width="200" height="12" fill="#8A5A36" /></g>
  </Frame>
);

const MAP: Record<AnimId, () => JSX.Element> = {
  reed: Reed, catch: Catch, servo: Servo, keypad: Keypad, wheels: Wheels, umbrella: Umbrella, i2c: I2C,
  clothespin: Clothespin, bands: Bands, neopixel: Neopixel, microswitch: Micro, popup: Popup,
};
export function HowAnim({ id }: { id: AnimId }) {
  const A = MAP[id];
  return <A />;
}
