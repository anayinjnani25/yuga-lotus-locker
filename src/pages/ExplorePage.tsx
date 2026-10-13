import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { camApi } from '../three/Stage';
import { GROUPS, PARTS, PART_BY_ID, STAGES, visibleInMode, type Part } from '../data/parts';
import { HowAnim } from '../components/HowAnims';
import { STEPS, lcd, leds } from '../data/playthrough';

export function ExplorePage() {
  const selected = useStore((s) => s.selected);
  const ready = useStore((s) => s.ready);
  const mode = useStore((s) => s.mode);
  const prev = useRef<string | null>(null);

  // the Explore pose has the lotus open, so show what the firmware shows then
  useEffect(() => { if (ready) { lcd(...STEPS[5].endLcd); leds(STEPS[5].endLeds); } }, [ready]);

  // fly to the selected part (switching version first if the part only exists in the other one)
  useEffect(() => {
    if (!ready) return;
    if (selected) {
      const p = PART_BY_ID[selected];
      if (!p) { useStore.getState().select(null); return; }
      if (!visibleInMode(p, mode)) { useStore.setState({ mode: p.version as 'electronic' | 'mechanical' }); return; }
      // render mode places the camera itself
      if (document.documentElement.classList.contains('render')) return;
      const t = setTimeout(() => camApi.flyTo(selected), 150);
      history.replaceState(null, '', `#/explore?part=${selected}`);
      prev.current = selected;
      return () => clearTimeout(t);
    }
    if (prev.current) { camApi.home(); history.replaceState(null, '', '#/explore'); }
    prev.current = null;
  }, [selected, ready, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const s = useStore.getState();
      if (s.drawer) useStore.setState({ drawer: false });
      else if (s.selected) s.select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <PartsDrawer />
      <ViewControls />
      {selected && (
        <button className="back-btn" onClick={() => useStore.getState().select(null)}>
          <span aria-hidden="true">←</span> Back to full view <kbd>Esc</kbd>
        </button>
      )}
      {selected && PART_BY_ID[selected] && <DetailPanel part={PART_BY_ID[selected]} key={selected} />}
      {!selected && <p className="stage-hint">Drag to turn · scroll or pinch to zoom · right-drag or two fingers to pan · click any part</p>}
      <HoverTag />
    </>
  );
}

function HoverTag() {
  const hovered = useStore((s) => s.hovered);
  const [x, y] = useStore((s) => s.hoverXY);
  const selected = useStore((s) => s.selected);
  if (!hovered || hovered === selected) return null;
  const p = PART_BY_ID[hovered];
  return (
    <div className="hover-tag" style={{ transform: `translate(${x + 14}px, ${y - 56 + 10}px)` }} aria-hidden="true">
      {p?.name}
    </div>
  );
}

// ───────────────────────── parts drawer ─────────────────────────
function PartsDrawer() {
  const open = useStore((s) => s.drawer);
  const mode = useStore((s) => s.mode);
  const selected = useStore((s) => s.selected);
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 50); }, [open]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return PARTS.filter((p) => !t || [p.name, p.what, p.group, ...p.connections.map((c) => c.pin ?? '')].join(' ').toLowerCase().includes(t));
  }, [q]);

  return (
    <>
      <button className="drawer-btn" aria-expanded={open} aria-controls="parts-drawer" onClick={() => useStore.setState({ drawer: !open })}>
        <span aria-hidden="true">☰</span> Parts <span className="count">{PARTS.length}</span>
      </button>
      <aside id="parts-drawer" className={`drawer ${open ? 'open' : ''}`} aria-label="Parts list" aria-hidden={!open} {...({ inert: open ? undefined : '' } as object)}>
        <div className="drawer-head">
          <h2>Parts</h2>
          <button className="icon-btn" onClick={() => useStore.setState({ drawer: false })} aria-label="Close parts list">✕</button>
        </div>
        <label className="search">
          <span className="sr-only">Search parts</span>
          <input ref={input} type="search" placeholder="Search parts, pins (e.g. D9)…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="drawer-list">
          {GROUPS.map((g) => {
            const items = list.filter((p) => p.group === g.id);
            if (!items.length) return null;
            return (
              <section key={g.id}>
                <h3>{g.name}</h3>
                <ul>
                  {items.map((p) => {
                    const off = !visibleInMode(p, mode);
                    return (
                      <li key={p.id}>
                        <button className={`part-row ${selected === p.id ? 'on' : ''} ${off ? 'off' : ''}`}
                          onClick={() => { useStore.getState().select(p.id); if (window.innerWidth < 760) useStore.setState({ drawer: false }); }}
                          onMouseEnter={() => useStore.setState({ glow: { parts: [p.id], wires: [] } })}
                          onMouseLeave={() => useStore.setState({ glow: null })}>
                          <span className="pr-name">{p.name}</span>
                          <span className={`ver ver-${p.version}`}>{p.version === 'both' ? 'Both' : p.version === 'electronic' ? 'Elec' : 'Mech'}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          {!list.length && <p className="muted pad">No parts match "{q}".</p>}
        </div>
      </aside>
    </>
  );
}

// ───────────────────────── view controls ─────────────────────────
function ViewControls() {
  const s = useStore();
  const [open, setOpen] = useState(() => window.innerWidth >= 760);
  return (
    <div className={`view-ctl ${open ? 'open' : ''}`}>
      <button className="view-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span aria-hidden="true">⚙</span> View
      </button>
      {open && (
        <div className="view-body">
          <div className="seg" role="radiogroup" aria-label="Version">
            {(['electronic', 'mechanical'] as const).map((m) => (
              <button key={m} role="radio" aria-checked={s.mode === m} onClick={() => useStore.setState({ mode: m, selected: s.selected && !visibleInMode(PART_BY_ID[s.selected], m) ? null : s.selected })}>
                {m === 'electronic' ? 'Electronic' : 'Mechanical'}
              </button>
            ))}
          </div>
          <Toggle label="Cutaway" on={s.cutaway} set={(v) => useStore.setState({ cutaway: v })} hint="Opens the tube, bands and ring" />
          <Toggle label="Hide walls" on={s.hideWalls} set={(v) => useStore.setState({ hideWalls: v })} />
          <Toggle label="Wiring only" on={s.wiringOnly} set={(v) => useStore.setState({ wiringOnly: v, mode: v ? 'electronic' : s.mode })} />
          <label className="slider">
            <span>Exploded view</span>
            <input type="range" min={0} max={1} step={0.01} value={s.explode} onChange={(e) => useStore.setState({ explode: Number(e.target.value) })} aria-valuetext={`${Math.round(s.explode * 100)}%`} />
          </label>
          <button className="link-btn" onClick={() => { useStore.getState().select(null); camApi.home(); }}>Reset camera</button>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, on, set, hint }: { label: string; on: boolean; set: (v: boolean) => void; hint?: string }) {
  return (
    <button className="toggle" role="switch" aria-checked={on} onClick={() => set(!on)} title={hint}>
      <span className="knob" aria-hidden="true" />
      {label}
    </button>
  );
}

// ───────────────────────── detail panel ─────────────────────────
function DetailPanel({ part }: { part: Part }) {
  const [full, setFull] = useState(false);
  const group = GROUPS.find((g) => g.id === part.group)?.name;
  const vLabel = part.version === 'both' ? 'Both versions' : part.version === 'electronic' ? 'Electronic version' : 'Mechanical version';
  const go = (id: string) => useStore.getState().select(id);
  const glow = (wires: string[], parts: string[]) => useStore.setState({ glow: { wires, parts } });
  const unglow = () => useStore.setState({ glow: null });

  return (
    <aside className={`detail ${full ? 'full' : ''}`} aria-label={`${part.name} details`}>
      <button className="sheet-handle" onClick={() => setFull(!full)} aria-label={full ? 'Shrink panel' : 'Expand panel'}><span /></button>
      <header className="detail-head">
        <div className="chips">
          <span className="chip">{group}</span>
          <span className={`chip ver-${part.version}`}>{vLabel}</span>
          {part.qty && part.qty !== '—' && <span className="chip">×{part.qty}</span>}
        </div>
        <h2>{part.name}</h2>
        <button className="icon-btn close" onClick={() => useStore.getState().select(null)} aria-label="Close and go back to full view">✕</button>
      </header>
      <div className="detail-body">
        <Section title="What it is"><p>{part.what}</p></Section>
        <Section title="Why it's used here"><p>{part.why}</p></Section>
        <Section title="How it works">
          {part.anim && <HowAnim id={part.anim} />}
          <p>{part.how}</p>
        </Section>
        <Section title="Specs">
          <dl className="specs">
            {part.specs.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd className={v.includes('TBD') ? 'tbd' : ''}>{v}</dd></div>))}
            <div><dt>Material</dt><dd className={part.material.includes('TBD') ? 'tbd' : ''}>{part.material}</dd></div>
          </dl>
        </Section>
        {part.connections.length > 0 && (
          <Section title="Connections and pins">
            <p className="muted small">Hover a row to light its wire in 3D.</p>
            <ul className="conns">
              {part.connections.map((c, i) => (
                <li key={i} onMouseEnter={() => glow(c.wires ?? [], c.to ? [c.to] : [])} onMouseLeave={unglow}
                  onFocus={() => glow(c.wires ?? [], c.to ? [c.to] : [])} onBlur={unglow} tabIndex={0}>
                  {c.pin && <span className={`pin pin-${c.board?.toLowerCase()}`}>{c.board === 'Rail' ? '' : c.board === 'PCF8574' ? 'PCF ' : ''}{c.pin}</span>}
                  <span className="c-label">{c.label}{c.code && <code>{c.code}</code>}</span>
                  {c.to && c.to !== part.id && <button className="link-btn" onClick={() => go(c.to!)}>{PART_BY_ID[c.to]?.name ?? c.to} →</button>}
                </li>
              ))}
            </ul>
          </Section>
        )}
        <Section title="Stage">
          <div className="chips">
            {part.stages.map((s) => (s === 0
              ? <span key={s} className="chip">{STAGES[0]}</span>
              : <a key={s} className="chip link" href={`#/how?step=${s}`}>{STAGES[s]} ▸</a>))}
          </div>
        </Section>
        <Section title="Build tip"><p className={part.buildTip === 'TBD' ? 'tbd' : ''}>{part.buildTip}</p></Section>
        <Section title="Related parts">
          <div className="related">
            {part.related.map((id) => (
              <button key={id} className="rel" onClick={() => go(id)} onMouseEnter={() => glow([], [id])} onMouseLeave={unglow}>
                {PART_BY_ID[id]?.name ?? id}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (<section className="d-sec"><h3>{title}</h3>{children}</section>);
}
