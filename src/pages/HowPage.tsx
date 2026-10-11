import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { STEPS, lcd, leds } from '../data/playthrough';
import { setPose, cancelTweens, EXPLORE_POSE } from '../three/pose';
import { camApi } from '../three/Stage';
import { PART_BY_ID } from '../data/parts';
import { partHref } from '../App';

const EXPLORE_LEDS = STEPS[5].endLeds;

export function HowPage() {
  const step = useStore((s) => s.step);
  const mode = useStore((s) => s.mode);
  const ready = useStore((s) => s.ready);
  const playing = useStore((s) => s.playing);
  const lcdLines = useStore((s) => s.lcd);
  const ledCols = useStore((s) => s.leds);
  const first = useRef(true);

  async function goTo(n: number, animate = true) {
    cancelTweens();
    const s = STEPS[n];
    const before = STEPS[Math.max(0, n - 1)];
    useStore.setState({ step: n, playing: animate && n > 0 });
    camApi.look(s.view[useStore.getState().mode].pos, s.view[useStore.getState().mode].target);
    if (!animate || n === 0) {
      setPose(s.endPose); lcd(...s.endLcd); leds(s.endLeds);
      useStore.setState({ playing: false });
      return;
    }
    setPose(before.endPose); lcd(...before.endLcd); leds(before.endLeds);
    try {
      await s.run(useStore.getState().mode);
      lcd(...s.endLcd); leds(s.endLeds);
      useStore.setState({ playing: false });
    } catch { /* cancelled by another step */ }
  }

  // enter: start at the step in the URL (or 0); leave: restore the Explore pose
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams(location.hash.split('?')[1] ?? '');
    const n = Math.min(5, Math.max(0, Number(q.get('step') ?? 0) || 0));
    useStore.setState({ selected: null, hovered: null, glow: null, drawer: false });
    goTo(n, n > 0);
    first.current = false;
    return () => {
      cancelTweens();
      setPose(EXPLORE_POSE); lcd(...STEPS[5].endLcd); leds(EXPLORE_LEDS);
      useStore.setState({ playing: false });
      camApi.home(false);
    };
  }, [ready]);

  // switching version replays the current step
  useEffect(() => { if (!first.current && ready) goTo(useStore.getState().step, true); }, [mode]);

  const s = STEPS[step];
  return (
    <>
      {mode === 'electronic' && (
        <div className="hw-overlay" aria-live="polite">
          <div>
            <div className="lcd-label">LCD 16×2</div>
            <div className="lcd" aria-label={`Screen: ${lcdLines[0]} / ${lcdLines[1]}`}>
              <div className="lcd-screen">{lcdLines[0].padEnd(16).slice(0, 16)}{'\n'}{lcdLines[1].padEnd(16).slice(0, 16)}</div>
            </div>
          </div>
          <div>
            <div className="leds-label">NeoPixel ring</div>
            <div className="leds" aria-label={`LEDs: ${ledCols.map((c) => (c ? 'on' : 'off')).join(', ')}`}>
              {ledCols.map((c, i) => <i key={i} style={c ? { background: c, boxShadow: `0 0 10px ${c}` } : undefined} />)}
            </div>
          </div>
        </div>
      )}
      <div className="mode-pill">
        <div className="seg glass-seg" role="radiogroup" aria-label="Version">
          {(['electronic', 'mechanical'] as const).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => useStore.setState({ mode: m })}>
              {m === 'electronic' ? 'Electronic' : 'Mechanical'}
            </button>
          ))}
        </div>
      </div>
      <aside className="how-panel" aria-label="Play-through">
        <div className="how-top">
          <div className="chips"><span className="chip">{step === 0 ? 'Start' : `Stage ${step} of 5`}</span><span className={`chip ver-${mode}`}>{mode === 'electronic' ? 'Electronic' : 'Mechanical'}</span></div>
          <h2>{s.title}</h2>
        </div>
        <div className="how-body">
          <p className="caption-sub">{s.sub}</p>
          <p className="caption" aria-live="polite">{s.caption[mode]}</p>
          <div className="involved">
            {s.parts[mode].map((id) => <a key={id} className="chip link" href={partHref(id)}>{PART_BY_ID[id]?.name}</a>)}
          </div>
          <ol className="how-steps">
            {STEPS.map((t) => (
              <li key={t.n}>
                <button className={t.n < step ? 'done' : t.n === step ? 'cur' : ''} onClick={() => goTo(t.n, true)} aria-current={t.n === step ? 'step' : undefined}>
                  <span className="num">{t.n < step ? '✓' : t.n}</span>
                  <span><b>{t.title}</b><span className="sub">{t.sub}</span></span>
                </button>
              </li>
            ))}
          </ol>
          {step === 5 && !playing && (
            <p className="note small">Reset: press the petals closed until the catch clicks (or press * on the keypad), take the leaves out, mix up the bands and close the lid.</p>
          )}
        </div>
        <div className="how-nav">
          <button className="btn ghost" onClick={() => goTo(Math.max(0, step - 1), false)} disabled={step === 0}>← Previous</button>
          <button className="btn ghost" onClick={() => goTo(step, true)} disabled={step === 0}>{playing ? 'Playing…' : '↻ Replay'}</button>
          {step < 5
            ? <button className="btn grow" onClick={() => goTo(step + 1, true)}>Next →</button>
            : <button className="btn grow" onClick={() => goTo(0, false)}>Restart</button>}
        </div>
      </aside>
    </>
  );
}
