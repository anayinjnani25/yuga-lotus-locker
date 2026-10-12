// "Mechanisms": the hinges, springs, catches, click-stops, linkages and guides students can use
// to build the box for real, each with a small looping diagram and links to where it sits in 3D.
import type { CSSProperties, ReactNode } from 'react';
import { partHref } from '../App';
import { PART_BY_ID } from '../data/parts';

const C = { wood: '#B07A4A', dark: '#6B4428', brass: '#C9A04A', metal: '#9AA0A8', copper: '#D9825A', red: '#D8402F', blue: '#3A7FD6', tape: '#5B8DD6' };
const ink = 'var(--a-ink)', mute = 'var(--a-mute)';

/** CSS custom properties for the generic keyframes in styles.css */
const v = (o: Record<string, string | number>) => Object.fromEntries(Object.entries(o).map(([k, x]) => [`--${k}`, x])) as CSSProperties;
const origin = (x: number, y: number, extra: Record<string, string | number> = {}): CSSProperties => ({ transformOrigin: `${x}px ${y}px`, ...v(extra) });

function zig(x1: number, y1: number, x2: number, y2: number, n: number, amp: number) {
  const pts: string[] = [];
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  for (let i = 0; i <= n; i++) {
    const t = i / n, s = i === 0 || i === n ? 0 : (i % 2 ? amp : -amp);
    pts.push(`${x1 + dx * t - uy * s},${y1 + dy * t + ux * s}`);
  }
  return pts.join(' ');
}
function gear(cx: number, cy: number, r: number, teeth: number) {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2, rr = i % 4 < 2 ? r + 5 : r;
    pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
  }
  return pts.join(' ');
}
const Svg = ({ children, label }: { children: ReactNode; label: string }) => (
  <svg viewBox="0 0 200 120" role="img" aria-label={label}>{children}</svg>
);

// ───────── diagrams ─────────
const D: Record<string, () => JSX.Element> = {
  butt: () => (<Svg label="Butt hinge opening">
    <rect x="30" y="62" width="70" height="14" fill={C.brass} /><circle cx="100" cy="69" r="8" fill={C.brass} stroke={C.dark} />
    <g className="m-rot" style={origin(100, 69, { a: '-120deg' })}><rect x="100" y="62" width="70" height="14" fill={C.brass} stroke={C.dark} /><circle cx="150" cy="69" r="2.5" fill={C.dark} /><circle cx="125" cy="69" r="2.5" fill={C.dark} /></g>
    <circle cx="50" cy="69" r="2.5" fill={C.dark} /><circle cx="75" cy="69" r="2.5" fill={C.dark} /><circle cx="100" cy="69" r="2" fill={C.dark} />
  </Svg>),
  fabric: () => (<Svg label="Fabric tape hinge folding">
    <rect x="20" y="78" width="80" height="16" fill={C.wood} />
    <g className="m-rot" style={origin(100, 78, { a: '-90deg' })}><rect x="100" y="78" width="80" height="16" fill={C.wood} stroke={C.dark} /></g>
    <rect x="88" y="74" width="24" height="5" rx="2" fill={C.tape} />
  </Svg>),
  piano: () => (<Svg label="Piano hinge along a long panel">
    <rect x="20" y="92" width="160" height="10" fill={C.wood} />
    {[30, 50, 70, 90, 110, 130, 150, 170].map((x, i) => <rect key={x} x={x - 8} y="86" width="16" height="6" fill={i % 2 ? C.brass : '#A88838'} />)}
    <g className="m-rot" style={origin(20, 88, { a: '-70deg' })}><rect x="20" y="78" width="160" height="10" fill={C.wood} stroke={C.dark} /></g>
  </Svg>),
  straw: () => (<Svg label="Straw and wire hinge on a petal">
    <rect x="40" y="86" width="120" height="10" rx="5" fill="#EDE6D6" stroke={mute} /><line x1="30" y1="91" x2="170" y2="91" stroke={C.metal} strokeWidth="2" />
    <g className="m-rot" style={origin(100, 86, { a: '-45deg' })}><path d="M70 86 Q60 40 100 10 Q140 40 130 86Z" fill={C.copper} stroke="#8a4a2a" /></g>
  </Svg>),
  pivot: () => (<Svg label="Lever swinging on a pivot pin">
    <g className="m-rot alt" style={origin(100, 60, { a: '22deg' })}><rect x="30" y="54" width="140" height="12" rx="6" fill="#D9B98A" /></g>
    <circle cx="100" cy="60" r="6" fill={C.brass} stroke={C.dark} />
  </Svg>),

  compression: () => (<Svg label="Compression spring being squeezed">
    <rect x="60" y="104" width="80" height="8" fill={C.dark} />
    <polyline className="m-sy" style={origin(100, 104, { s: 0.55 })} points={zig(100, 104, 100, 34, 10, 22)} fill="none" stroke={C.metal} strokeWidth="3" />
    <g className="m-ty" style={v({ d: '31px' })}><rect x="66" y="24" width="68" height="10" fill={C.wood} /></g>
  </Svg>),
  tension: () => (<Svg label="Tension spring being stretched">
    <rect x="14" y="40" width="10" height="40" fill={C.dark} />
    <polyline className="m-sx" style={origin(24, 60, { s: 1.6 })} points={zig(24, 60, 100, 60, 12, 10)} fill="none" stroke={C.metal} strokeWidth="3" />
    <g className="m-tx" style={v({ d: '46px' })}><rect x="100" y="52" width="40" height="16" fill={C.wood} /></g>
  </Svg>),
  torsion: () => (<Svg label="Torsion spring twisting">
    <line x1="100" y1="60" x2="30" y2="96" stroke={C.metal} strokeWidth="4" strokeLinecap="round" />
    <g className="m-rot" style={origin(100, 60, { a: '-60deg' })}><line x1="100" y1="60" x2="170" y2="96" stroke={C.metal} strokeWidth="4" strokeLinecap="round" /></g>
    {[0, 1, 2].map((i) => <circle key={i} cx={96 + i * 4} cy="60" r="12" fill="none" stroke={C.metal} strokeWidth="3" />)}
  </Svg>),
  leaf: () => (<Svg label="Leaf spring bending">
    <rect x="16" y="40" width="20" height="40" fill={C.dark} />
    <g className="m-rot" style={origin(36, 56, { a: '-10deg' })}><rect x="36" y="53" width="140" height="6" rx="3" fill="#D9B98A" /></g>
    <g className="m-ty" style={v({ d: '-22px' })}><rect x="150" y="84" width="24" height="24" fill={C.wood} /></g>
  </Svg>),
  rubber: () => (<Svg label="Rubber band stretching between two pegs">
    <circle cx="40" cy="60" r="8" fill={C.dark} />
    <ellipse className="m-sx" style={origin(40, 60, { s: 1.5 })} cx="80" cy="60" rx="40" ry="10" fill="none" stroke="#C0603A" strokeWidth="4" />
    <g className="m-tx" style={v({ d: '40px' })}><circle cx="120" cy="60" r="8" fill={C.dark} /></g>
  </Svg>),

  hookeye: () => (<Svg label="Hook lifting out of an eye">
    <rect x="40" y="10" width="120" height="12" fill={C.wood} />
    <g className="m-ty" style={v({ d: '-26px' })}><path d="M100 22 V78 a12 12 0 1 1 -18 -8" fill="none" stroke={C.metal} strokeWidth="4" /></g>
    <circle cx="94" cy="86" r="10" fill="none" stroke={C.brass} strokeWidth="4" /><rect x="60" y="96" width="80" height="10" fill={C.wood} />
  </Svg>),
  bolt: () => (<Svg label="Sliding bolt moving into a keeper">
    <rect x="20" y="40" width="100" height="40" fill={C.wood} />
    <g className="m-tx" style={v({ d: '50px' })}><rect x="30" y="54" width="90" height="12" rx="3" fill={C.brass} /><circle cx="60" cy="50" r="6" fill={C.brass} /></g>
    <rect x="44" y="50" width="10" height="20" fill="none" stroke={C.dark} strokeWidth="2" /><rect x="90" y="50" width="10" height="20" fill="none" stroke={C.dark} strokeWidth="2" />
    <rect x="160" y="44" width="16" height="32" fill={C.dark} /><rect x="160" y="54" width="10" height="12" fill="var(--a-bg)" />
  </Svg>),
  pawl: () => (<Svg label="Spring catch tooth leaving a notch and the rod rising">
    <g className="m-ty" style={v({ d: '-24px', dl: '.4s' })}><rect x="40" y="20" width="18" height="96" fill="#D9B98A" /><rect x="52" y="64" width="6" height="10" fill="#2a1a10" /></g>
    <g className="m-rot" style={origin(110, 70, { a: '-18deg' })}><rect x="56" y="66" width="110" height="8" rx="4" fill={C.wood} /></g>
    <circle cx="110" cy="70" r="4" fill={ink} />
    <polyline points={zig(150, 74, 150, 104, 6, 6)} fill="none" stroke={C.metal} strokeWidth="2" />
  </Svg>),
  ballcatch: () => (<Svg label="Ball catch clicking into a dent">
    <rect x="60" y="30" width="40" height="70" fill={C.dark} /><polyline points={zig(80, 96, 80, 66, 6, 7)} fill="none" stroke={C.metal} strokeWidth="2" />
    <circle className="m-tx alt" style={v({ d: '-6px' })} cx="104" cy="58" r="9" fill={C.metal} />
    <g className="m-ty alt" style={v({ d: '-30px' })}><rect x="112" y="40" width="50" height="70" fill={C.wood} /><circle cx="112" cy="58" r="5" fill="var(--a-bg)" /></g>
  </Svg>),
  magcatch: () => (<Svg label="Magnetic catch snapping shut">
    <rect x="20" y="40" width="40" height="40" fill={C.dark} /><rect x="60" y="48" width="14" height="24" fill={C.red} />
    <g className="m-tx snap" style={v({ d: '-60px' })}><rect x="134" y="48" width="8" height="24" fill={C.metal} /><rect x="142" y="30" width="40" height="60" fill={C.wood} /></g>
  </Svg>),
  pushlatch: () => (<Svg label="Push-to-open latch: press in, then it springs out">
    <rect x="20" y="44" width="90" height="32" rx="4" fill={C.dark} />
    <g className="m-push"><rect x="100" y="52" width="40" height="16" rx="3" fill="#E8E2D6" /><rect x="138" y="40" width="40" height="40" fill={C.wood} /></g>
  </Svg>),
  trigger: () => (<Svg label="A small trigger releases a big stored spring">
    <g className="m-rot" style={origin(60, 90, { a: '-80deg', dl: '.3s' })}><rect x="56" y="20" width="10" height="72" fill={C.wood} /></g>
    <polyline points={zig(20, 90, 60, 60, 6, 6)} fill="none" stroke={C.metal} strokeWidth="2" />
    <g className="m-rot" style={origin(110, 90, { a: '20deg' })}><rect x="66" y="26" width="48" height="8" fill={C.brass} /></g>
    <circle cx="110" cy="90" r="4" fill={ink} /><rect x="104" y="30" width="10" height="64" fill="none" />
    <g className="m-tx" style={v({ d: '-14px' })}><rect x="140" y="70" width="44" height="12" rx="3" fill="#C9A27A" /></g>
  </Svg>),

  balldetent: () => (<Svg label="Bead pressed by a spring clicks into dimples">
    <g className="m-tx steps" style={v({ d: '-80px' })}>
      <rect x="0" y="20" width="290" height="20" fill={C.wood} />
      {[30, 70, 110, 150, 190, 230, 270].map((x) => <circle key={x} cx={x} cy="40" r="6" fill="var(--a-bg)" />)}
    </g>
    <circle cx="110" cy="46" r="7" fill={C.red} />
    <polyline points={zig(110, 54, 110, 96, 7, 7)} fill="none" stroke={C.metal} strokeWidth="2" /><rect x="96" y="96" width="28" height="8" fill={C.dark} />
  </Svg>),
  leafdetent: () => (<Svg label="Ratchet wheel clicking past a leaf spring">
    <polygon className="m-spin steps8" style={origin(80, 62)} points={gear(80, 62, 34, 8)} fill={C.brass} stroke={C.dark} />
    <circle cx="80" cy="62" r="5" fill={ink} />
    <rect x="118" y="24" width="10" height="20" fill={C.dark} /><path d="M123 34 Q120 50 116 56" stroke="#D9B98A" strokeWidth="5" fill="none" />
  </Svg>),
  magdetent: () => (<Svg label="A band snaps to the magnet position">
    <rect x="20" y="70" width="160" height="12" fill={C.dark} /><rect x="94" y="70" width="12" height="12" fill={C.red} />
    <g className="m-tx snap" style={v({ d: '50px' })}><rect x="30" y="44" width="80" height="22" fill={C.wood} /><rect x="64" y="56" width="12" height="10" fill={C.blue} /></g>
  </Svg>),

  lever: () => (<Svg label="Lever on a fulcrum">
    <polygon points="100,70 86,100 114,100" fill={C.dark} />
    <g className="m-rot alt" style={origin(100, 66, { a: '14deg' })}><rect x="20" y="62" width="160" height="8" fill="#D9B98A" /><rect x="24" y="44" width="20" height="18" fill={C.metal} /></g>
  </Svg>),
  umbrella: () => (<Svg label="Umbrella linkage: collar rises and struts open the petals">
    <g className="m-ty" style={v({ d: '-12px' })}><rect x="96" y="56" width="8" height="60" fill="#D9B98A" /><rect x="86" y="54" width="28" height="8" fill={C.brass} /></g>
    <g className="m-rot" style={origin(84, 70, { a: '-30deg' })}><path d="M84 70 Q60 40 72 8 Q88 34 84 70Z" fill={C.copper} /></g>
    <g className="m-rot" style={origin(116, 70, { a: '30deg' })}><path d="M116 70 Q140 40 128 8 Q112 34 116 70Z" fill={C.copper} /></g>
    <rect x="70" y="70" width="60" height="8" fill={C.wood} />
  </Svg>),
  bellcrank: () => (<Svg label="Bell crank turning a sideways push into an upward one">
    <g className="m-tx" style={v({ d: '20px' })}><rect x="10" y="80" width="60" height="8" fill="#C9A27A" /></g>
    <g className="m-rot" style={origin(100, 84, { a: '-30deg' })}><path d="M70 84 H100 V44" stroke={C.brass} strokeWidth="10" fill="none" strokeLinejoin="round" /></g>
    <circle cx="100" cy="84" r="5" fill={ink} />
    <g className="m-ty" style={v({ d: '-16px' })}><rect x="96" y="6" width="8" height="40" fill="#D9B98A" /></g>
  </Svg>),
  rack: () => (<Svg label="Rack and pinion">
    <polygon className="m-rot" style={origin(100, 46, { a: '120deg' })} points={gear(100, 46, 22, 10)} fill={C.brass} stroke={C.dark} />
    <circle cx="100" cy="46" r="4" fill={ink} />
    <g className="m-tx" style={v({ d: '46px' })}>
      <rect x="10" y="78" width="180" height="12" fill={C.wood} />
      {Array.from({ length: 18 }, (_, i) => <rect key={i} x={12 + i * 10} y="72" width="5" height="6" fill={C.wood} />)}
    </g>
  </Svg>),
  cam: () => (<Svg label="Cam turning pushes a follower up and down">
    <path className="m-spin linear" style={origin(100, 84)} d="M100 54 C122 54 126 84 118 98 C110 112 90 112 82 98 C74 84 78 54 100 54Z" fill={C.brass} stroke={C.dark} />
    <circle cx="100" cy="84" r="4" fill={ink} />
    <g className="m-bob"><rect x="94" y="8" width="12" height="46" fill="#D9B98A" /></g>
    <rect x="84" y="20" width="32" height="6" fill="none" stroke={mute} />
  </Svg>),
  ratchet: () => (<Svg label="Ratchet and pawl: turns one way only">
    <polygon className="m-spin steps8" style={origin(84, 62)} points={gear(84, 62, 32, 12)} fill={C.metal} stroke={C.dark} />
    <circle cx="84" cy="62" r="5" fill={ink} />
    <g className="m-rot alt fast" style={origin(150, 30, { a: '-8deg' })}><path d="M150 30 L118 32" stroke={C.brass} strokeWidth="6" strokeLinecap="round" /></g>
    <circle cx="150" cy="30" r="4" fill={ink} />
  </Svg>),
  gears: () => (<Svg label="Two gears turning opposite ways">
    <polygon className="m-spin linear" style={origin(70, 60)} points={gear(70, 60, 30, 12)} fill={C.brass} stroke={C.dark} />
    <polygon className="m-spin linear rev" style={origin(134, 60)} points={gear(134, 60, 30, 12)} fill={C.metal} stroke={C.dark} />
    <circle cx="70" cy="60" r="4" fill={ink} /><circle cx="134" cy="60" r="4" fill={ink} />
  </Svg>),
  pulley: () => (<Svg label="Pulley and string lifting a weight">
    <circle className="m-rot" style={origin(100, 30, { a: '-200deg' })} cx="100" cy="30" r="18" fill="none" stroke={C.brass} strokeWidth="6" />
    <line className="m-ty" style={v({ d: '30px' })} x1="82" y1="30" x2="82" y2="70" stroke={ink} strokeWidth="2" />
    <g className="m-ty" style={v({ d: '30px' })}><circle cx="82" cy="74" r="6" fill={C.red} /></g>
    <line x1="118" y1="30" x2="118" y2="70" stroke={ink} strokeWidth="2" />
    <g className="m-ty" style={v({ d: '-30px' })}><rect x="106" y="70" width="24" height="24" fill={C.dark} /></g>
  </Svg>),

  guides: () => (<Svg label="Rod sliding straight through guide rings">
    <g className="m-ty" style={v({ d: '-24px' })}><rect x="94" y="20" width="12" height="100" fill="#D9B98A" /></g>
    {[40, 84].map((y) => <g key={y}><rect x="60" y={y} width="80" height="8" fill={C.dark} /><rect x="92" y={y} width="16" height="8" fill="var(--a-bg)" /></g>)}
  </Svg>),
  stops: () => (<Svg label="A collar on the rod hits a stop">
    <rect x="50" y="40" width="100" height="8" fill={C.dark} /><rect x="92" y="40" width="16" height="8" fill="var(--a-bg)" />
    <g className="m-ty" style={v({ d: '-22px' })}><rect x="94" y="20" width="12" height="100" fill="#D9B98A" /><rect x="84" y="72" width="32" height="10" fill={C.brass} /></g>
  </Svg>),
  bearings: () => (<Svg label="A washer lets two parts turn smoothly">
    <rect x="94" y="10" width="12" height="100" fill={C.metal} />
    <g className="m-sx alt" style={origin(100, 40, { s: -1 })}><rect x="50" y="30" width="100" height="20" fill={C.wood} /><rect x="56" y="34" width="10" height="12" fill={C.dark} /></g>
    <rect x="58" y="52" width="84" height="4" fill={C.brass} />
    <g className="m-sx alt slow" style={origin(100, 70, { s: -1 })}><rect x="50" y="58" width="100" height="20" fill={C.copper} /><rect x="134" y="62" width="10" height="12" fill={C.dark} /></g>
  </Svg>),
};

interface Mech { id: string; name: string; does: string; where: string; parts: string[]; make: string; level: 'Easy' | 'Medium' | 'Tricky' }
interface Family { id: string; title: string; intro: string; items: Mech[] }

const FAMILIES: Family[] = [
  { id: 'hinges', title: 'Hinges', intro: 'Anything that swings: the lid, the walls and the petals.', items: [
    { id: 'butt', name: 'Butt hinge', does: 'Two metal leaves joined by a pin. Strong and neat.', where: 'Lid to the wall.', parts: ['lid'], make: 'Small brass hinges from a hardware shop, screwed or glued.', level: 'Easy' },
    { id: 'fabric', name: 'Fabric or tape hinge', does: 'A strip of cloth or tape glued across the joint bends instead of turning on a pin.', where: 'Walls to the base (the manual uses fabric tape).', parts: ['wall-front', 'wall-left', 'wall-right'], make: 'Cloth strip or duct tape with strong glue. Free.', level: 'Easy' },
    { id: 'piano', name: 'Piano hinge', does: 'One long hinge along the whole edge, so a wide panel folds evenly.', where: 'Walls folding flat.', parts: ['wall-front'], make: 'Cut a length of piano hinge, or roll paper tubes around a wire.', level: 'Medium' },
    { id: 'straw', name: 'Straw-and-wire hinge', does: 'A straw glued to the moving part turns on a wire or toothpick.', where: 'Copper petals at the tube rim.', parts: ['petals'], make: 'Drinking straw, toothpick or bent paper clip. Light and smooth.', level: 'Easy' },
    { id: 'pivot', name: 'Pivot pin', does: 'A single pin that a lever swings on.', where: 'Catch lever, bolt knob.', parts: ['catch-lever'], make: 'A toothpick or small nail through the tube wall.', level: 'Easy' },
  ] },
  { id: 'springs', title: 'Springs', intro: 'Anything that pushes or pulls by itself and stores energy.', items: [
    { id: 'compression', name: 'Compression spring', does: 'Pushes back when squeezed.', where: 'Lid pop-up, main lotus spring, button return.', parts: ['lid-spring', 'main-spring', 'button-spring'], make: 'Ball-pen springs, stapler springs, or a spring kit.', level: 'Easy' },
    { id: 'tension', name: 'Tension spring', does: 'Pulls back when stretched.', where: 'The bolt, pulled toward the number wheels.', parts: ['bolt'], make: 'Spring kit, or use a rubber band.', level: 'Easy' },
    { id: 'torsion', name: 'Torsion spring', does: 'Twists, so it pushes something to rotate.', where: 'Wall hinges, catch lever.', parts: ['clothespins', 'catch-spring'], make: 'From wooden clothespins or an old mousetrap.', level: 'Easy' },
    { id: 'leaf', name: 'Leaf spring', does: 'A flat strip that bends and springs back.', where: 'Click-stops, catch lever.', parts: ['click-stops', 'catch-lever'], make: 'Ice-cream stick, a strip cut from a plastic bottle, or a hacksaw blade.', level: 'Easy' },
    { id: 'rubber', name: 'Rubber band', does: 'A pull spring you can make stronger or weaker by changing the band.', where: 'Anywhere instead of a coil spring.', parts: ['bolt', 'main-spring'], make: 'Free. Replace when it gets old.', level: 'Easy' },
  ] },
  { id: 'catches', title: 'Latches and catches', intro: 'Anything that holds something still and then lets go.', items: [
    { id: 'hookeye', name: 'Hook and eye', does: 'A hook drops into a loop. Lifting or sliding it out frees it.', where: 'The lid hook.', parts: ['lid-hook'], make: 'Bent paper clip and a small screw eye.', level: 'Easy' },
    { id: 'bolt', name: 'Sliding bolt', does: 'A bar slides through guides into a keeper.', where: 'The dial-lock bolt.', parts: ['bolt'], make: 'Ice-cream stick through two straw guides.', level: 'Easy' },
    { id: 'pawl', name: 'Spring catch (pawl)', does: 'A sprung tooth sits in a notch until something pushes it out.', where: 'Catch lever holding the push rod down.', parts: ['catch-lever', 'push-rod'], make: 'Ice-cream stick lever, toothpick pivot, pen spring.', level: 'Medium' },
    { id: 'ballcatch', name: 'Ball catch', does: 'A sprung ball clicks into a dent and holds gently.', where: 'Holding the lid closed softly.', parts: ['lid'], make: 'Buy a small cupboard ball catch.', level: 'Easy' },
    { id: 'magcatch', name: 'Magnetic catch', does: 'A magnet holds a steel plate. Pull hard enough and it lets go.', where: 'Holding the petals closed, or the lid.', parts: ['petals', 'lid'], make: 'Cupboard magnetic catch, or a magnet and a washer.', level: 'Easy' },
    { id: 'pushlatch', name: 'Push-to-open latch', does: 'Press once and it releases and pushes out. Press again and it locks.', where: 'Can replace the catch lever and catch spring in the lotus trigger.', parts: ['catch-lever', 'push-rod'], make: 'Furniture or cupboard push latch from a hardware shop.', level: 'Easy' },
    { id: 'trigger', name: 'Trigger (sear)', does: 'A small push releases a big stored force, like a jack-in-the-box.', where: 'Button → catch → spring-loaded rod.', parts: ['button', 'catch-lever', 'main-spring'], make: 'Two levers: a small trigger and the catch it releases.', level: 'Tricky' },
  ] },
  { id: 'detents', title: 'Click-stops (detents)', intro: 'Parts that click into place so the child can feel the right position.', items: [
    { id: 'balldetent', name: 'Bead detent', does: 'A spring pushes a bead into small dimples as the part turns.', where: 'Picture bands and the aligned ring (the manual\'s design).', parts: ['click-stops', 'picture-bands'], make: 'Pen spring and a bead in a short straw.', level: 'Medium' },
    { id: 'leafdetent', name: 'Leaf-spring detent', does: 'A springy strip rubs over notches and clicks at each one.', where: 'Picture bands, number wheels.', parts: ['picture-bands', 'number-wheels'], make: 'Ice-cream stick pressed against notched card.', level: 'Easy' },
    { id: 'magdetent', name: 'Magnet detent', does: 'Two small magnets pull a part to stop at exactly one spot.', where: 'Bands snapping to the solved position, the ring lining up.', parts: ['picture-bands', 'leaf-ring'], make: 'Two small magnets, glued in so they can\'t come out.', level: 'Easy' },
  ] },
  { id: 'linkages', title: 'Linkages and drives', intro: 'Ways to turn one kind of movement into another.', items: [
    { id: 'lever', name: 'Lever', does: 'A bar on a fulcrum: a small push at one end makes a bigger or turned movement at the other.', where: 'Catch lever, button.', parts: ['catch-lever'], make: 'Ice-cream stick and a toothpick pivot.', level: 'Easy' },
    { id: 'umbrella', name: 'Umbrella linkage', does: 'A rising collar pushes struts that open petals outward, like umbrella ribs.', where: 'The lotus.', parts: ['collar-struts', 'petals', 'push-rod'], make: 'Collar on the rod, ice-cream-stick struts, straw hinges.', level: 'Medium' },
    { id: 'bellcrank', name: 'Bell crank', does: 'An L-shaped lever that turns a sideways push into an up or down one.', where: 'Horizontal button → vertical release.', parts: ['button', 'push-rod'], make: 'L-shape cut from card or thin plywood, pivot pin at the corner.', level: 'Medium' },
    { id: 'rack', name: 'Rack and pinion', does: 'A gear turning moves a toothed bar in a straight line.', where: 'A knob that lifts the rod.', parts: ['push-rod'], make: 'LEGO Technic, 3D print, or a kit gear.', level: 'Medium' },
    { id: 'cam', name: 'Cam and follower', does: 'A turning egg-shaped wheel pushes a rod up and down.', where: 'Turning the ring could lift something.', parts: ['leaf-ring'], make: 'Cam cut from thick card or MDF.', level: 'Medium' },
    { id: 'ratchet', name: 'Ratchet and pawl', does: 'Lets a wheel turn only one way.', where: 'A ring that can\'t be turned back.', parts: ['leaf-ring'], make: 'Notched card wheel and an ice-cream-stick pawl.', level: 'Medium' },
    { id: 'gears', name: 'Gears', does: 'Change speed or direction of turning.', where: 'Leaves turning the ring through a small gear.', parts: ['leaf-ring', 'leaves'], make: 'LEGO, 3D print, or gears from an old toy.', level: 'Medium' },
    { id: 'pulley', name: 'Pulley and string', does: 'Pulls from a distance or around corners.', where: 'Button opening the petals by a string.', parts: ['button', 'petals'], make: 'A cotton reel on a pencil and fishing line.', level: 'Easy' },
  ] },
  { id: 'guides', title: 'Guides, stops and bearings', intro: 'The small parts that keep everything moving straight and smoothly.', items: [
    { id: 'guides', name: 'Guides', does: 'Rings or tubes that keep a rod sliding straight.', where: 'Push rod, bolt.', parts: ['guide-discs', 'bolt'], make: 'Straws, paper tubes, or card discs with a hole.', level: 'Easy' },
    { id: 'stops', name: 'Stops', does: 'A block, peg or collar that limits how far something moves.', where: 'Stop collar on the rod, ring stopper.', parts: ['stop-collar', 'leaf-ring'], make: 'A glued block, bead or a short piece of tube.', level: 'Easy' },
    { id: 'bearings', name: 'Bearings and washers', does: 'A smooth layer between two turning parts so they don\'t stick.', where: 'Between the bands, between the number wheels.', parts: ['picture-bands', 'number-wheels'], make: 'Metal or plastic washers, or a disc cut from a plastic lid.', level: 'Easy' },
  ] },
];

const PICKS: [string, string][] = [
  ['Lid', 'Butt hinge + compression spring (pen) + hook and eye'],
  ['Walls', 'Fabric hinges + clothespin torsion springs'],
  ['Bands', 'Washers as bearings + magnet click-stops'],
  ['Ring', 'Ratchet or magnet detent + peg stop'],
  ['Lotus', 'Push-to-open latch (or catch + compression spring), umbrella linkage, straw-and-wire petal hinges'],
];

export default function MechanismsPage() {
  const go = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); document.getElementById('m-' + id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  return (
    <>
      <h1>Mechanisms</h1>
      <p className="lede">The hinges, springs, catches and linkages you can use to build the box for real, with what each one does, where it goes in the box, and how to make it from things students can find. Tap a part name to see it in 3D.</p>
      <nav className="toc" aria-label="Mechanism families">
        {FAMILIES.map((f) => <a key={f.id} href="#/mechanisms" onClick={go(f.id)}>{f.title}</a>)}
        <a href="#/mechanisms" onClick={go('picks')}>What to use where</a>
      </nav>

      {FAMILIES.map((f) => (
        <section key={f.id} id={'m-' + f.id} className="mech-family" aria-labelledby={'mh-' + f.id}>
          <h2 id={'mh-' + f.id}>{f.title}</h2>
          <p className="muted">{f.intro}</p>
          <div className="mech-grid">
            {f.items.map((m) => {
              const Diagram = D[m.id];
              return (
                <article key={m.id} className="mech-card">
                  <div className="mech-anim">{Diagram && <Diagram />}</div>
                  <div className="mech-text">
                    <div className="mech-head"><h3>{m.name}</h3><span className={`lvl lvl-${m.level.toLowerCase()}`}>{m.level}</span></div>
                    <p>{m.does}</p>
                    <dl>
                      <dt>In the box</dt><dd>{m.where}</dd>
                      <dt>Make it from</dt><dd>{m.make}</dd>
                    </dl>
                    <div className="related">
                      {m.parts.map((id) => <a key={id} className="rel" href={partHref(id)} style={{ textDecoration: 'none' }}>{PART_BY_ID[id]?.name ?? id} ↗</a>)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <h2 id="m-picks">What to use where</h2>
      <div className="table-wrap"><table>
        <thead><tr><th>Job</th><th>Mechanism</th></tr></thead>
        <tbody>{PICKS.map(([j, m]) => <tr key={j}><td><b>{j}</b></td><td>{m}</td></tr>)}</tbody>
      </table></div>
      <div className="note small"><b>Tips:</b> a spring kit has all sizes, so test the strength first and cut coils off if a spring is too strong. Glue magnets in so they can't come out (they are dangerous if swallowed), and keep strong springs covered so they can't pinch fingers.</div>
    </>
  );
}
