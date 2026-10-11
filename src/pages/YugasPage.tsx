import { useEffect, useRef } from 'react';
import { YUGAS, rgbCss, type PegShape } from '../data/yugas';
import { drawScene, coinCanvas, fontsReady } from '../art/paint';
import { partHref } from '../App';

function Painted({ k }: { k: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    fontsReady().then(() => {
      const c = ref.current; if (!c || !live) return;
      const g = c.getContext('2d')!; g.clearRect(0, 0, c.width, c.height);
      drawScene(k, g, 0, 0, 300, 300);
    });
    return () => { live = false; };
  }, [k]);
  return <canvas ref={ref} width={300} height={300} role="img" aria-label={`Painted miniature: the dharma bull standing on ${YUGAS[k].legs} ${YUGAS[k].legs > 1 ? 'legs' : 'leg'} in ${YUGAS[k].en} Yuga`} />;
}

function Coin({ k }: { k: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    fontsReady().then(() => { const c = ref.current; if (c) c.getContext('2d')!.drawImage(coinCanvas(k, 152), 0, 0); });
  }, [k]);
  return <canvas ref={ref} width={152} height={152} role="img" aria-label={`${YUGAS[k].metalName} coin of ${YUGAS[k].en} Yuga`} />;
}

export function PegIcon({ shape, color }: { shape: PegShape; color: string }) {
  const p = shape === 'circle' ? <circle cx="17" cy="17" r="12" />
    : shape === 'square' ? <rect x="6" y="6" width="22" height="22" />
      : shape === 'triangle' ? <polygon points="17,4 30,28 4,28" />
        : <polygon points={Array.from({ length: 10 }, (_, j) => { const a = -Math.PI / 2 + (j * Math.PI) / 5, r = j % 2 ? 6 : 14; return `${17 + Math.cos(a) * r},${17 + Math.sin(a) * r}`; }).join(' ')} />;
  return <svg viewBox="0 0 34 34" aria-hidden="true"><g fill={color} stroke="rgba(0,0,0,.35)" strokeWidth="1.5">{p}</g></svg>;
}

export default function YugasPage() {
  return (
    <>
      <h1>The four yugas</h1>
      <p className="lede">Each age has its own coin, metal colour and painted panel inside the box. In every picture the dharma bull stands on one leg fewer: 4 in Satya, 3 in Treta, 2 in Dwapara and 1 in Kali.</p>
      <nav className="yuga-nav" aria-label="Yugas">
        {YUGAS.map((y) => <a key={y.id} href={`#/yugas`} onClick={(e) => { e.preventDefault(); document.getElementById('yuga-' + y.id)?.scrollIntoView({ behavior: 'smooth' }); }} style={{ ['--metal' as string]: y.metal }}>{y.en}</a>)}
      </nav>
      {YUGAS.map((y, k) => (
        <article key={y.id} id={'yuga-' + y.id} className="yuga" style={{ ['--metal' as string]: y.metal }} aria-labelledby={'yh-' + y.id}>
          <div>
            <Painted k={k} />
            <p className="small muted" style={{ marginTop: 6 }}>Painted miniature, as on the {k === 3 ? 'underside of the lid' : ['front', 'left', 'right'][k] + ' wall'} inside the box.</p>
          </div>
          <div>
            <h2 id={'yh-' + y.id}>{y.en} Yuga</h2>
            <p className="sub">{y.sub}</p>
            <p>{y.about}</p>
            <div className="facts">
              <div className="fact"><b>Lasts</b><span>{y.years}</span></div>
              <div className="fact"><b>People lived</b><span>{y.life}</span></div>
              <div className="fact"><b>Path to God</b><span>{y.path}</span></div>
              <div className="fact"><b>Dharma bull</b>
                <span className="legs" aria-label={`${y.legs} of 4 legs`}>{[0, 1, 2, 3].map((i) => <i key={i} className={i < y.legs ? '' : 'gone'} />)}</span>
              </div>
              <div className="fact"><b>Avatars</b><span>{y.avatars.join(', ')}</span></div>
              <div className="fact"><b>Symbol</b><span>{y.symbol}</span></div>
            </div>
            <div className="coin-row">
              <Coin k={k} />
              <div>
                <div><span className="swatch" style={{ background: y.metal }} /> <b>{y.metalName}</b> coin and metal colour</div>
                <div className="small muted" style={{ marginTop: 4 }}>LED colour in the firmware: <span className="swatch" style={{ background: rgbCss(y.rgb), width: 16, height: 16 }} /> <code>{`{${y.rgb.join(',')}}`}</code>, LEDs {2 * k} and {2 * k + 1}</div>
                <div className="small muted peg">Leaf peg: <PegIcon shape={y.peg} color={y.metal} /> {y.peg} <span className="tbd">(pairing TBD)</span> · sensor PCF P{y.pcfBit}</div>
              </div>
            </div>
            <p className="small" style={{ marginTop: 12 }}>
              <a href={partHref('coins')}>Coins in 3D ↗</a> · <a href={partHref('leaves')}>Leaves in 3D ↗</a> · <a href={partHref(k === 3 ? 'lid' : ['wall-front', 'wall-left', 'wall-right'][k])}>Its panel in 3D ↗</a>
            </p>
          </div>
        </article>
      ))}
    </>
  );
}
