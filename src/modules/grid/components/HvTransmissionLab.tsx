import React, { useMemo, useState } from 'react';
import {
  CorridorType,
  HvInputs,
  VOLTAGE_CLASSES,
  buildMarkdownReport,
  computeBreakEvenKm,
  evaluateAllVoltageClasses,
  evaluateVoltageClass,
} from '../engine/hvTransmission';
import { GridInputs, GridSummary } from '../engine/gridDispatch';

interface Props {
  inputs: HvInputs;
  onChange: (next: HvInputs) => void;
  gridInputs: GridInputs;
  gridSummary: GridSummary;
}

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const HvTransmissionLab: React.FC<Props> = ({
  inputs,
  onChange,
  gridInputs,
  gridSummary,
}) => {
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => evaluateAllVoltageClasses(inputs), [inputs]);
  const focus = useMemo(
    () => results.find((r) => r.spec.id === inputs.focusClassId) || results[2],
    [results, inputs.focusClassId]
  );

  const breakEvenKm = useMemo(
    () => computeBreakEvenKm(inputs.powerMW, inputs.powerFactor, inputs.corridor),
    [inputs.powerMW, inputs.powerFactor, inputs.corridor]
  );

  // Build distance curve samples (0 to 2000 km for overhead, 0 to 400 km for subsea)
  const maxDistAxis = inputs.corridor === 'overhead' ? 2000 : 400;
  const curveSeries = useMemo(() => {
    const steps = 40;
    const dStep = maxDistAxis / steps;
    return VOLTAGE_CLASSES.map((spec) => {
      const pts: { km: number; lossPct: number; saturated: boolean }[] = [];
      for (let i = 0; i <= steps; i++) {
        const km = i * dStep;
        const r = evaluateVoltageClass(
          spec,
          inputs.powerMW,
          km,
          inputs.powerFactor,
          inputs.corridor
        );
        pts.push({
          km,
          lossPct: Math.min(35, r.totalLossPct),
          saturated: r.chargingSaturated,
        });
      }
      return { spec, pts };
    });
  }, [inputs.powerMW, inputs.powerFactor, inputs.corridor, maxDistAxis]);

  // SVG chart dimensions
  const W = 760;
  const H = 290;
  const padL = 52;
  const padR = 18;
  const padT = 18;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxLossAxis = 30; // 0 to 30%

  const xScale = (km: number) => padL + (Math.min(maxDistAxis, Math.max(0, km)) / maxDistAxis) * plotW;
  const yScale = (pct: number) =>
    padT + plotH - (Math.min(maxLossAxis, Math.max(0, pct)) / maxLossAxis) * plotH;

  // Generator busbar current at 24 kV for reference (1 GW plant)
  const generator24kVCurrentA =
    (inputs.powerMW * 1e6) / (Math.sqrt(3) * 24e3 * inputs.powerFactor);

  const generateFullReport = () => {
    const gridMd = `## 2. 24-Hour Grid Dispatch & Firm Power Summary

- **Demand Profile:** ${gridInputs.profileId} (${gridSummary.totalDemandGWh.toFixed(1)} GWh/day)
- **Installed Mix:** Solar ${gridInputs.solarGW} GW | Wind ${gridInputs.windGW} GW | Nuclear ${gridInputs.nuclearGW} GW | Gas ${gridInputs.gasGW} GW
- **Storage Fleet:** LFP BESS ${gridInputs.lfpGWh} GWh (86.5% RTE) | Pumped Hydro ${gridInputs.phsGWh} GWh (78.5% RTE)
- **True Firm Power LCOE:** $${gridSummary.firmLcoeUsdMWh.toFixed(2)}/MWh (Headline: $${gridSummary.headlineLcoeUsdMWh.toFixed(2)}/MWh + Firming Premium: $${gridSummary.firmingPremiumUsdMWh.toFixed(2)}/MWh)
- **Curtailment:** ${gridSummary.curtailedGWh.toFixed(1)} GWh (${gridSummary.curtailmentPctOfVre.toFixed(1)}% of VRE) | **Unserved Load:** ${gridSummary.unservedGWh.toFixed(1)} GWh
- **Zero-Carbon Share:** ${gridSummary.cleanSharePct.toFixed(1)}% | **Peak Evening Ramp:** ${gridSummary.peakEveningRampGWPerHr.toFixed(1)} GW/hr
- **Min Synchronous Inertia:** H = ${gridSummary.minInertiaSec.toFixed(2)} s (Worst 5% trip RoCoF: ${gridSummary.worstRocofHzPerSec.toFixed(2)} Hz/s — ${gridSummary.inertiaStatus})
- **Estimated Land Footprint:** ~${Math.round(gridSummary.landFootprintKm2).toLocaleString()} km²`;

    return buildMarkdownReport(inputs, results, breakEvenKm, gridMd);
  };

  const handleCopyMarkdown = async () => {
    const md = generateFullReport();
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      downloadMarkdown('power-grid-hv-report.md', md);
    }
  };

  const handleCorridorChange = (corridor: CorridorType) => {
    const clampedDist =
      corridor === 'subsea' ? Math.min(inputs.distanceKm, 350) : inputs.distanceKm;
    onChange({ ...inputs, corridor, distanceKm: clampedDist });
  };

  // Current bars for 1/V scaling visualization
  const currentBars = [
    {
      label: '24 kV Gen Bus',
      amps: generator24kVCurrentA,
      color: '#d4d4d0',
      note: 'Stator limit',
    },
    ...results.map((r) => ({
      label: r.spec.shortLabel,
      amps: r.totalCurrentA,
      color: r.spec.id === focus.spec.id ? '#b45309' : r.spec.mode === 'HVDC' ? '#d97706' : '#52525b',
      note: `${r.circuitsNeeded} ckt`,
    })),
  ];

  // Use log scale for current bars so 24 kV (24,000 A) and 765 kV (755 A) are both readable
  const logMax = Math.log10(Math.max(100, generator24kVCurrentA));
  const logMin = 2; // 100 A

  return (
    <section className="lab-section" id="hv-transmission">
      <div className="section-header">
        <div>
          <h2>Sending power far away: AC vs DC power lines (HVAC vs HVDC)</h2>
          <p className="section-desc">
            Wires heat up and waste power as they carry it. Compare normal high-voltage AC lines (110 kV to 765 kV)
            with high-voltage DC lines (±500 / ±800 kV) over different distances, on land or under the sea.
          </p>
          <p className="plain-hint">
            I²R loss: heat lost in the wire, equal to current squared times resistance. Double the voltage, halve the
            current, and the heat loss drops to a quarter.
          </p>
        </div>
        <div className="action-row">
          <button type="button" className="btn" onClick={handleCopyMarkdown}>
            {copied ? 'Copied Markdown' : 'Copy Markdown'}
          </button>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => downloadMarkdown('power-grid-hv-report.md', generateFullReport())}
          >
            Export Markdown Report (.md)
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-label">Power lost on the chosen line</p>
          <p className={`kpi-value ${focus.feasible ? 'accent' : 'danger'}`}>
            {focus.totalLossPct.toFixed(2)}%
          </p>
          <p className="kpi-meta">
            {focus.totalLossMW.toFixed(1)} MW lost ({focus.deliveredMW.toFixed(1)} MW delivered)
          </p>
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Current in the wires ({focus.spec.shortLabel})</p>
          <p className="kpi-value">{Math.round(focus.totalCurrentA).toLocaleString()} A</p>
          <p className="kpi-meta">
            {focus.circuitsNeeded} parallel line{focus.circuitsNeeded > 1 ? 's' : ''} needed ({Math.round(focus.currentPerCircuitA).toLocaleString()} A each)
          </p>
          <p className="plain-hint">More current needs thicker or more wires and wastes more as heat.</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Distance where DC starts to win (break-even)</p>
          <p className="kpi-value">~{breakEvenKm} km</p>
          <p className="kpi-meta">
            {inputs.corridor === 'overhead'
              ? 'Typical for overhead DC lines: 600–800 km'
              : 'Typical for undersea DC cables: over 50 km'}
          </p>
          <p className="plain-hint">DC needs costly converter stations at each end (they turn AC into DC and back), so it only pays off over long distances.</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Verdict for this route</p>
          <p
            className={`kpi-value ${
              !focus.feasible ? 'danger' : focus.totalLossPct <= 6 ? 'ok' : 'accent'
            }`}
            style={{ fontSize: '1.05rem' }}
          >
            {focus.verdict}
          </p>
          <p className="kpi-meta">
            {inputs.corridor === 'subsea' && focus.spec.mode === 'HVAC'
              ? `Current wasted just charging the cable (I_c): ${Math.round(focus.chargingCurrentA)} A`
              : `${focus.spec.conductor}`}
          </p>
        </div>
      </div>

      <div className="lab-grid">
        {/* Left Controls */}
        <div className="card">
          <h3 className="card-title">Your power line</h3>
          <p className="card-subtitle">
            Raising voltage 10× cuts current 10× and the heat lost in the wire (I²R loss) 100×, a 99% saving.
          </p>

          <div className="control-group">
            <span className="control-label" style={{ display: 'block', marginBottom: 6 }}>
              Where the line runs
            </span>
            <div className="segmented" role="group" aria-label="Corridor type">
              <button
                type="button"
                className={`seg-btn ${inputs.corridor === 'overhead' ? 'active' : ''}`}
                onClick={() => handleCorridorChange('overhead')}
              >
                Overhead Line
              </button>
              <button
                type="button"
                className={`seg-btn ${inputs.corridor === 'subsea' ? 'active' : ''}`}
                onClick={() => handleCorridorChange('subsea')}
              >
                Undersea / buried cable
              </button>
            </div>
          </div>

          <div className="control-group">
            <div className="control-head">
              <label className="control-label" htmlFor="power-slider">Power to send (P)</label>
              <span className="control-val">{inputs.powerMW.toLocaleString()} MW</span>
            </div>
            <div className="slider-wrap">
              <input
                id="power-slider"
                type="range"
                min={100}
                max={6000}
                step={50}
                value={inputs.powerMW}
                onChange={(e) => onChange({ ...inputs, powerMW: Number(e.target.value) })}
              />
            </div>
            <div className="quick-pills">
              {[500, 1000, 2000, 4000].map((mw) => (
                <button
                  key={mw}
                  type="button"
                  className={`mini-pill ${inputs.powerMW === mw ? 'active' : ''}`}
                  onClick={() => onChange({ ...inputs, powerMW: mw })}
                >
                  {mw >= 1000 ? `${mw / 1000} GW` : `${mw} MW`}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <div className="control-head">
              <label className="control-label" htmlFor="distance-slider">Line length (L)</label>
              <span className="control-val">{inputs.distanceKm.toLocaleString()} km</span>
            </div>
            <div className="slider-wrap">
              <input
                id="distance-slider"
                type="range"
                min={20}
                max={maxDistAxis}
                step={inputs.corridor === 'overhead' ? 20 : 10}
                value={Math.min(inputs.distanceKm, maxDistAxis)}
                onChange={(e) => onChange({ ...inputs, distanceKm: Number(e.target.value) })}
              />
            </div>
            <div className="quick-pills">
              {(inputs.corridor === 'overhead' ? [100, 500, 1000, 1500] : [40, 80, 150, 300]).map((km) => (
                <button
                  key={km}
                  type="button"
                  className={`mini-pill ${inputs.distanceKm === km ? 'active' : ''}`}
                  onClick={() => onChange({ ...inputs, distanceKm: km })}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <div className="control-head">
              <label className="control-label" htmlFor="pf-slider">AC power factor (cos θ)</label>
              <span className="control-val">{inputs.powerFactor.toFixed(2)}</span>
            </div>
            <p className="plain-hint">How much of the AC current does useful work. 1.0 is perfect; lower means extra current and extra loss.</p>
            <div className="slider-wrap">
              <input
                id="pf-slider"
                type="range"
                min={0.8}
                max={1.0}
                step={0.01}
                value={inputs.powerFactor}
                onChange={(e) => onChange({ ...inputs, powerFactor: Number(e.target.value) })}
              />
            </div>
            <div className="quick-pills">
              {[0.85, 0.95, 1.0].map((pf) => (
                <button
                  key={pf}
                  type="button"
                  className={`mini-pill ${Math.abs(inputs.powerFactor - pf) < 0.005 ? 'active' : ''}`}
                  onClick={() => onChange({ ...inputs, powerFactor: pf })}
                >
                  pf {pf.toFixed(2)}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label" htmlFor="voltage-select">
              Line type to inspect (voltage class)
            </label>
            <select
              id="voltage-select"
              className="select-input"
              value={inputs.focusClassId}
              onChange={(e) => onChange({ ...inputs, focusClassId: e.target.value })}
              style={{ marginTop: 6 }}
            >
              {VOLTAGE_CLASSES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Live Visuals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Loss vs Distance SVG */}
          <div className="chart-box">
            <div className="chart-header">
              <div>
                <h3 className="card-title">Share of power lost (%) as the line gets longer (0–{maxDistAxis} km)</h3>
                <p className="card-subtitle" style={{ marginBottom: 0 }}>
                  Counts wire heating (I²R), the extra AC resistance from skin effect (AC current crowds to the wire's
                  surface, ~8%), and losses in substations and converter stations.
                </p>
              </div>
              <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>
                Break-even: ~{breakEvenKm} km
              </span>
            </div>

            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="chart-svg"
              role="img"
              aria-label="Transmission power loss percentage versus distance across HVAC and HVDC voltage classes"
            >
              {/* Horizontal Grid Lines */}
              {[0, 5, 10, 15, 20, 25, 30].map((pct) => (
                <g key={pct}>
                  <line
                    x1={padL}
                    y1={yScale(pct)}
                    x2={W - padR}
                    y2={yScale(pct)}
                    stroke="#e5e5e3"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={yScale(pct) + 4}
                    textAnchor="end"
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                    fill="#767672"
                  >
                    {pct}%
                  </text>
                </g>
              ))}

              {/* Vertical X Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const km = Math.round(t * maxDistAxis);
                const x = xScale(km);
                return (
                  <g key={km}>
                    <line
                      x1={x}
                      y1={padT}
                      x2={x}
                      y2={padT + plotH}
                      stroke="#f0f0ee"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={H - 12}
                      textAnchor="middle"
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                      fill="#767672"
                    >
                      {km} km
                    </text>
                  </g>
                );
              })}

              {/* Break-even vertical guide */}
              {breakEvenKm <= maxDistAxis && (
                <g>
                  <line
                    x1={xScale(breakEvenKm)}
                    y1={padT}
                    x2={xScale(breakEvenKm)}
                    y2={padT + plotH}
                    stroke="#b45309"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity="0.7"
                  />
                  <text
                    x={Math.min(W - padR - 95, xScale(breakEvenKm) + 6)}
                    y={padT + 14}
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                    fill="#b45309"
                  >
                    HVDC wins &gt;{breakEvenKm} km
                  </text>
                </g>
              )}

              {/* Loss curves per voltage class */}
              {curveSeries.map(({ spec, pts }) => {
                const isFocus = spec.id === inputs.focusClassId;
                const dPath = pts
                  .filter((p) => p.lossPct <= maxLossAxis + 0.5)
                  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xScale(p.km).toFixed(1)} ${yScale(p.lossPct).toFixed(1)}`)
                  .join(' ');
                if (!dPath) return null;
                return (
                  <path
                    key={spec.id}
                    d={dPath}
                    fill="none"
                    stroke={spec.color}
                    strokeWidth={isFocus ? 3 : 1.7}
                    strokeDasharray={spec.mode === 'HVDC' ? '6 3' : undefined}
                    opacity={isFocus ? 1 : 0.72}
                  />
                );
              })}

              {/* Selected Distance Crosshair */}
              <line
                x1={xScale(inputs.distanceKm)}
                y1={padT}
                x2={xScale(inputs.distanceKm)}
                y2={padT + plotH}
                stroke="#111111"
                strokeWidth="1.4"
              />
              {focus.totalLossPct <= maxLossAxis && (
                <circle
                  cx={xScale(inputs.distanceKm)}
                  cy={yScale(focus.totalLossPct)}
                  r="5"
                  fill="#ffffff"
                  stroke="#b45309"
                  strokeWidth="2.5"
                />
              )}
            </svg>

            <div className="legend-row">
              {VOLTAGE_CLASSES.map((spec) => (
                <span
                  key={spec.id}
                  className="legend-item"
                  style={{
                    cursor: 'pointer',
                    fontWeight: spec.id === inputs.focusClassId ? 700 : 400,
                    color: spec.id === inputs.focusClassId ? 'var(--ink)' : 'var(--ink-secondary)',
                  }}
                  onClick={() => onChange({ ...inputs, focusClassId: spec.id })}
                >
                  <span
                    className="swatch-line"
                    style={{
                      borderTop:
                        spec.mode === 'HVDC'
                          ? `2px dashed ${spec.color}`
                          : `2px solid ${spec.color}`,
                    }}
                  />
                  {spec.shortLabel}
                </span>
              ))}
            </div>
          </div>

          {/* Current & 1/V^2 Hardware Sizing Bar Strip */}
          <div className="card card-white">
            <h3 className="card-title">Why power stations boost voltage from 24 kV to 400–800 kV</h3>
            <p className="card-subtitle">
              Current, not power, decides how much metal the wires need. Current at each voltage (log scale, each step is 10×) at{' '}
              {inputs.powerMW.toLocaleString()} MW (pf {inputs.powerFactor.toFixed(2)}).
            </p>
            <div>
              {currentBars.map((b) => {
                const pct = Math.max(
                  6,
                  Math.min(100, ((Math.log10(Math.max(100, b.amps)) - logMin) / Math.max(0.5, logMax - logMin)) * 100)
                );
                return (
                  <div className="bar-row" key={b.label}>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--ink)' }}>
                      {b.label}
                    </span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%`, background: b.color }} />
                    </div>
                    <span className="mono" style={{ fontSize: 12, textAlign: 'right', color: 'var(--ink-secondary)' }}>
                      {Math.round(b.amps).toLocaleString()} A
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Benchmark Table */}
      <div style={{ marginTop: 16 }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Line type</th>
                <th>Conductor / Cable</th>
                <th className="num">Lines needed</th>
                <th className="num">Total Current</th>
                <th className="num">Lost (wire heat + stations)</th>
                <th className="num">Delivered</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const isSelected = r.spec.id === inputs.focusClassId;
                const badgeClass = !r.feasible
                  ? 'badge-danger'
                  : r.totalLossPct <= 6
                    ? 'badge-ok'
                    : 'badge-warn';
                return (
                  <tr
                    key={r.spec.id}
                    className={`clickable-row ${isSelected ? 'selected-row' : ''}`}
                    onClick={() => onChange({ ...inputs, focusClassId: r.spec.id })}
                  >
                    <td>
                      <strong>{r.spec.shortLabel}</strong>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                        {r.spec.mode}
                      </div>
                    </td>
                    <td style={{ color: 'var(--ink-secondary)' }}>{r.spec.conductor}</td>
                    <td className="num">{r.circuitsNeeded}</td>
                    <td className="num">{Math.round(r.totalCurrentA).toLocaleString()} A</td>
                    <td className="num">
                      {r.totalLossMW.toFixed(1)} MW ({r.totalLossPct.toFixed(2)}%)
                    </td>
                    <td className="num">{r.deliveredMW.toFixed(1)} MW</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{r.verdict}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collapsible First-Principles Theory Drawer */}
      <details className="theory-drawer">
        <summary>The maths behind it: why higher voltage loses less, and why long undersea AC cables fail</summary>
        <div className="theory-body">
          <div>
            <h4>Wire heating (Joule's law): loss falls with voltage squared (1/V²)</h4>
            <p>
              Three-phase AC transmission losses scale inversely with the square of line-to-line
              voltage and power factor:
            </p>
            <div className="eq-block">
              P_loss = 3 * I² * R = (P² * R) / (V² * cos²θ)   =&gt;   P_loss ∝ 1 / V²
            </div>
            <p>
              Stepping up 10× (e.g., 40 kV to 400 kV) reduces current 10× and ohmic heat loss by{' '}
              <strong>100× (99%)</strong>. At 1 GW (pf 1.0), generator busbars at 24 kV carry ~24,100 A,
              while a 765 kV line carries just ~755 A.
            </p>
          </div>
          <div>
            <h4>Why HVDC Wins Beyond 600–800 km Overhead or 50 km Subsea</h4>
            <p>
              AC lines suffer from skin effect (increasing R_AC by 5–15% over R_DC) and continuous
              ground capacitance (the cable acts like a giant capacitor that must be refilled 50 times a second). In
              subsea/underground AC cables, this charging current uses up the cable's safe current limit (ampacity)
              within ~50–80 km:
            </p>
            <div className="eq-block">
              I_c = 2 * π * f * C * V_ph * L   (HVDC: f = 0 Hz =&gt; I_c = 0 A)
            </div>
            <p>
              HVDC LCC (classic thyristor converters, ±500 to ±800 kV) delivers 3,000–6,000 MW at 2.5%–3.5% loss per 1,000 km;
              HVDC VSC (newer transistor converters, ±320 to ±525 kV) enables subsea plastic-insulated (XLPE) links at 3.0%–3.5% per 1,000 km.
            </p>
          </div>
        </div>
      </details>
    </section>
  );
};
