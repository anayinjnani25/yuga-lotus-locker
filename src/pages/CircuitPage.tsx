// Interactive version of the wiring diagram in reference/yuga-locker-manual.html.
// Components carry data-c (part id), wires carry data-w (the same wire ids as the 3D model).
import { useMemo, useState, type ReactNode } from 'react';
import { PART_BY_ID, pinTable } from '../data/parts';
import { partHref } from '../App';

const wiresOf = (id: string) => new Set(PART_BY_ID[id]?.connections.flatMap((c) => c.wires ?? []) ?? []);

export default function CircuitPage() {
  const [sel, setSel] = useState<{ kind: 'c' | 'w'; id: string } | null>(null);
  const rows = useMemo(() => pinTable(), []);

  const litWires = useMemo(() => {
    if (!sel) return new Set<string>();
    if (sel.kind === 'w') return new Set([sel.id]);
    return wiresOf(sel.id);
  }, [sel]);
  const litComps = useMemo(() => {
    if (!sel) return new Set<string>();
    if (sel.kind === 'c') return new Set([sel.id, ...[...PART_BY_ID[sel.id].connections].map((c) => c.to ?? '')]);
    return new Set(Object.values(PART_BY_ID).filter((p) => p.connections.some((c) => c.wires?.includes(sel.id))).map((p) => p.id));
  }, [sel]);

  const W = ({ w, cls, d }: { w: string; cls: string; d: string }) => {
    const ids = w.split(' ');
    const on = ids.some((i) => litWires.has(i));
    return (
      <path className={`w ${cls} ${on ? 'on' : ''}`} d={d} data-w={w}
        onClick={(e) => { e.stopPropagation(); setSel({ kind: 'w', id: ids[0] }); }} style={{ cursor: 'pointer' }}>
        <title>{ids.join(', ')}</title>
      </path>
    );
  };
  const Cmp = ({ c, children, label }: { c: string; children: ReactNode; label?: string }) => (
    <g data-c={c} className={litComps.has(c) ? 'on' : ''} tabIndex={0} role="button" aria-label={label ?? PART_BY_ID[c]?.name}
      onClick={(e) => { e.stopPropagation(); setSel({ kind: 'c', id: c }); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel({ kind: 'c', id: c }); } }}>
      {children}
    </g>
  );

  const selPart = sel?.kind === 'c' ? PART_BY_ID[sel.id] : null;
  const wireUsers = sel?.kind === 'w' ? [...litComps] : [];

  return (
    <>
      <h1>Circuit</h1>
      <p className="lede">The wiring of the electronic box, from the build manual. Click a component or a wire to light up its connections, then jump to it in 3D. Every pin matches <code>yuga_lotus_locker_v2.ino</code>.</p>
      <div className="legend" aria-hidden="true">
        <span><i style={{ background: '#E07A2F' }} />Signal</span><span><i style={{ background: '#3A7FD6' }} />Keypad matrix</span>
        <span><i style={{ background: '#2FB36B' }} />I2C bus</span><span><i style={{ background: '#8E5BD8' }} />Sensor input</span>
        <span><i style={{ background: '#D8402F' }} />+5 V</span><span><i style={{ background: '#5a5a5a' }} />GND</span>
      </div>
      <p className="scroll-hint">Swipe the diagram sideways to see all of it.</p>
      <div className="circuit-layout">
        <div className="diagram-wrap" onClick={() => setSel(null)}>
          <svg className={`diagram ${sel ? 'has-sel' : ''}`} viewBox="40 100 1060 620" role="img" aria-labelledby="dgT dgD">
            <title id="dgT">Yuga locker wiring diagram</title>
            <desc id="dgD">Arduino Uno in the centre. Keypad on D2 to D8, buzzer on D12, button microswitch on A0 and lid reed switch on A1 on the left. Lid servo on D9, lotus servo on D10, NeoPixel ring on D11 through 330 ohms, LCD and PCF8574 on the I2C bus A4 and A5 on the right. The PCF8574 reads eight reed switches. A 5 volt 3 amp supply feeds a power rail with a 1000 microfarad capacitor.</desc>

            {/* wires first so components draw on top */}
            {[170, 185, 200, 215, 230, 245, 260].map((y) => <W key={y} w="keypad" cls="kp" d={`M250 ${y}H400`} />)}
            <W w="buzzer" cls="sig" d="M250 310H400" />
            <W w="button" cls="sen" d="M250 360H400" />
            <W w="lid-reed" cls="sen" d="M250 400H400" />
            <W w="servo-lid" cls="sig" d="M570 170H700" />
            <W w="servo-lotus" cls="sig" d="M570 210H700" />
            <W w="neopixel" cls="sig" d="M570 250H615M645 250H700" />
            <W w="i2c-lcd i2c-pcf" cls="i2c" d="M570 320H640" />
            <W w="i2c-lcd" cls="i2c" d="M640 320V305H700" />
            <W w="i2c-pcf" cls="i2c" d="M640 320V400H700" />
            <W w="i2c-lcd i2c-pcf" cls="i2c" d="M570 340H660" />
            <W w="i2c-lcd" cls="i2c" d="M660 340V325H700" />
            <W w="i2c-pcf" cls="i2c" d="M660 340V420H700" />
            {['leaf-0', 'leaf-1', 'leaf-2', 'leaf-3', 'band-1', 'band-2', 'band-3', 'ring'].map((w, i) => <W key={w} w={w} cls="sen" d={`M870 ${440 + i * 20}H895`} />)}
            <W w="power dc-in" cls="pwr" d="M280 628H1040" />
            <W w="power dc-in" cls="gnd" d="M280 658H1040" />
            <W w="power" cls="pwr" d="M570 470H600V628" />
            <W w="power" cls="gnd" d="M570 500H615V658" />
            <circle cx="640" cy="320" r="3.5" fill="#2FB36B" /><circle cx="660" cy="340" r="3.5" fill="#2FB36B" />
            <circle cx="600" cy="628" r="3.5" fill="#D8402F" /><circle cx="615" cy="658" r="3.5" fill="#5a5a5a" />

            <Cmp c="arduino">
              <rect className="board" x="400" y="110" width="170" height="440" rx="10" />
              <text className="t-head board-text" x="485" y="140" textAnchor="middle">Arduino Uno</text>
              {['D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'].map((p, i) => <text key={p} className="t-mono board-text" x="410" y={174 + i * 15}>{p}</text>)}
              <text className="t-mono board-text" x="410" y="314">D12</text><text className="t-mono board-text" x="410" y="364">A0</text><text className="t-mono board-text" x="410" y="404">A1</text>
              <text className="t-mono board-text" x="560" y="174" textAnchor="end">D9</text><text className="t-mono board-text" x="560" y="214" textAnchor="end">D10</text><text className="t-mono board-text" x="560" y="254" textAnchor="end">D11</text>
              <text className="t-mono board-text" x="560" y="324" textAnchor="end">A4 SDA</text><text className="t-mono board-text" x="560" y="344" textAnchor="end">A5 SCL</text>
              <text className="t-mono board-text" x="560" y="474" textAnchor="end">5V</text><text className="t-mono board-text" x="560" y="504" textAnchor="end">GND</text>
            </Cmp>
            <Cmp c="keypad">
              <rect className="mod" x="60" y="150" width="190" height="130" rx="8" />
              <text className="t-head" x="72" y="171">Keypad 3×4</text>
              {Array.from({ length: 12 }, (_, i) => <rect key={i} x={76 + (i % 3) * 28} y={182 + Math.floor(i / 3) * 22} width="22" height="18" rx="3" fill="none" stroke="var(--muted)" />)}
              {['R1', 'R2', 'R3', 'R4', 'C1', 'C2', 'C3'].map((p, i) => <text key={p} className="t-mono" x="242" y={174 + i * 15} textAnchor="end">{p}</text>)}
            </Cmp>
            <Cmp c="buzzer"><rect className="mod" x="130" y="295" width="120" height="30" rx="6" /><text x="142" y="315">Passive buzzer</text></Cmp>
            <Cmp c="microswitch"><rect className="mod" x="110" y="345" width="140" height="30" rx="6" /><text x="122" y="365">Button microswitch</text></Cmp>
            <Cmp c="lid-reed"><rect className="mod" x="110" y="385" width="140" height="30" rx="6" /><text x="122" y="405">Lid reed switch</text></Cmp>
            <text className="t-muted" x="60" y="446">Other leg of buzzer, button and lid reed → GND rail.</text>
            <text className="t-muted" x="60" y="464">Keypad needs no GND or 5 V.</text>

            <Cmp c="servo-lid"><rect className="mod" x="700" y="154" width="200" height="32" rx="6" /><text x="712" y="175">Lid latch servo (SG90)</text></Cmp>
            <Cmp c="servo-lotus"><rect className="mod" x="700" y="194" width="200" height="32" rx="6" /><text x="712" y="215">Lotus servo (SG90)</text></Cmp>
            <Cmp c="neopixel"><rect className="mod" x="700" y="234" width="200" height="32" rx="6" /><text x="712" y="255">NeoPixel ring, 8 LEDs</text></Cmp>
            <Cmp c="resistor"><rect x="615" y="244" width="30" height="12" rx="2" fill="var(--card)" stroke="#E07A2F" strokeWidth="1.5" className="mod" /><text className="t-mono" x="630" y="238" textAnchor="middle">330Ω</text></Cmp>
            <text className="t-muted" x="910" y="175">+5 V and GND</text><text className="t-muted" x="910" y="215">from the rail</text><text className="t-muted" x="910" y="255">(not the Uno)</text>

            <Cmp c="lcd">
              <rect className="mod" x="700" y="290" width="200" height="50" rx="6" />
              <text x="712" y="309" className="t-mono">SDA</text><text x="712" y="329" className="t-mono">SCL</text>
              <text x="760" y="320">LCD 16×2, I2C 0x27</text>
            </Cmp>
            <Cmp c="pcf8574">
              <rect className="mod" x="700" y="380" width="170" height="220" rx="8" />
              <text x="712" y="404" className="t-mono">SDA</text><text x="712" y="424" className="t-mono">SCL</text>
              <text className="t-head" x="712" y="470">PCF8574</text>
              <text className="t-muted" x="712" y="490">address 0x20</text>
              <text className="t-muted" x="712" y="508">A0 A1 A2 → GND</text>
              {['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'].map((p, i) => <text key={p} className="t-mono" x="862" y={444 + i * 20} textAnchor="end">{p}</text>)}
            </Cmp>
            <text className="t-muted" x="895" y="420">Reed switches, other leg → GND</text>
            {([['reed-leaves', 0, 'Satya leaf'], ['reed-leaves', 1, 'Treta leaf'], ['reed-leaves', 2, 'Dwapara leaf'], ['reed-leaves', 3, 'Kali leaf'],
              ['reed-bands', 4, 'Band 1 (top)'], ['reed-bands', 5, 'Band 2 (middle)'], ['reed-bands', 6, 'Band 3 (bottom)'], ['reed-ring', 7, 'Ring aligned']] as [string, number, string][]).map(([c, i, t]) => (
              <Cmp key={i} c={c} label={`${t} reed switch`}>
                <rect className="reed" x="895" y={435 + i * 20} width="30" height="10" rx="5" />
                <text x="935" y={444 + i * 20}>{t}</text>
              </Cmp>
            ))}

            <Cmp c="power-adapter">
              <rect className="mod" x="60" y="610" width="220" height="60" rx="8" />
              <text className="t-head" x="74" y="634">5 V 3 A adapter</text>
              <text className="t-muted" x="74" y="654">DC jack screw terminal</text>
            </Cmp>
            <Cmp c="breadboard" label="Breadboard power rail">
              <rect x="300" y="616" width="740" height="54" fill="transparent" />
              <text className="t-mono" x="1044" y="632">+5V</text><text className="t-mono" x="1044" y="662">GND</text>
            </Cmp>
            <Cmp c="capacitor">
              <path className="w pwr" d="M340 628V638" /><path className="w gnd" d="M340 658V648" />
              <path d="M326 638H354M326 648H354" stroke="var(--ink)" strokeWidth="2.4" />
              <text className="t-mono" x="362" y="647">1000 µF</text>
            </Cmp>
            <text className="t-muted" x="420" y="690">Servos, NeoPixel ring, LCD and PCF8574 all take +5 V and GND from this rail.</text>
            <text className="t-muted" x="420" y="708">Every GND is joined, including the Uno's.</text>
          </svg>
        </div>

        <aside className="card sel-card" aria-live="polite">
          {!sel && (<><h3>Click anything</h3><p className="muted">Pick a component or a wire in the diagram, or a row in the pin table below.</p>
            <div className="note warn small"><b>Power rule:</b> never run the two servos and the LED ring from the Uno's own 5 V pin. They draw too much current and the Uno will restart mid-game. Feed them from the 5 V adapter rail and join all the grounds.</div></>)}
          {selPart && (
            <>
              <h3>{selPart.name}</h3>
              <p>{selPart.what}</p>
              {selPart.connections.length > 0 && (
                <ul>{selPart.connections.map((c, i) => <li key={i}><b className="mono">{c.board === 'PCF8574' ? 'PCF ' : ''}{c.pin}</b> {c.label}</li>)}</ul>
              )}
              <a className="btn" href={partHref(selPart.id)}>Show in 3D ↗</a>
            </>
          )}
          {sel?.kind === 'w' && (
            <>
              <h3>Wire: {sel.id}</h3>
              <p className="muted">Connects:</p>
              <ul>{wireUsers.map((id) => <li key={id}><a href={partHref(id)}>{PART_BY_ID[id]?.name}</a></li>)}</ul>
              <a className="btn" href={`#/explore?part=wiring`}>Show wiring in 3D ↗</a>
            </>
          )}
        </aside>
      </div>

      <h2>Pin table</h2>
      <p className="muted">Generated from the same parts data as the 3D model and the parts list.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Board</th><th>Pin</th><th>Signal</th><th>Firmware name</th><th>Part</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.board + r.pin + r.part} className={sel?.kind === 'c' && sel.id === r.part ? 'hl' : ''} onClick={() => setSel({ kind: 'c', id: r.part })} style={{ cursor: 'pointer' }}>
                <td>{r.board}</td><td className="mono">{r.pin}</td><td>{r.signal}</td><td className="mono">{r.code}</td>
                <td>{PART_BY_ID[r.part].name}</td><td><a className="in3d" href={partHref(r.part)} onClick={(e) => e.stopPropagation()}>Show in 3D</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
