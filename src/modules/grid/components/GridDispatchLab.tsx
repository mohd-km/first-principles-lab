import React, { useMemo, useState } from 'react';
import {
  DEMAND_PROFILE_LIST,
  GRID_PRESETS,
  GridInputs,
  GridSummary,
  buildDispatchCsv,
} from '../engine/gridDispatch';

interface Props {
  inputs: GridInputs;
  onChange: (next: GridInputs) => void;
  summary: GridSummary;
}

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const GridDispatchLab: React.FC<Props> = ({ inputs, onChange, summary }) => {
  const [selectedHour, setSelectedHour] = useState<number>(19); // Default to evening ramp peak
  const [activePresetId, setActivePresetId] = useState<string>('balanced');

  const isSmallScale = inputs.profileId === 'flat1';
  const isIndiaScale = inputs.profileId === 'india256';

  const sliderCaps = useMemo(() => {
    if (isSmallScale) {
      return {
        solarMax: 10,
        solarStep: 0.2,
        windMax: 5,
        windStep: 0.1,
        nuclearMax: 2,
        nuclearStep: 0.1,
        gasMax: 2,
        gasStep: 0.1,
        lfpMax: 30,
        lfpStep: 0.5,
        phsMax: 20,
        phsStep: 0.5,
      };
    }
    if (isIndiaScale) {
      return {
        solarMax: 350,
        solarStep: 5,
        windMax: 150,
        windStep: 2,
        nuclearMax: 60,
        nuclearStep: 1,
        gasMax: 260,
        gasStep: 5,
        lfpMax: 300,
        lfpStep: 5,
        phsMax: 300,
        phsStep: 5,
      };
    }
    return {
      solarMax: 120,
      solarStep: 1,
      windMax: 80,
      windStep: 1,
      nuclearMax: 50,
      nuclearStep: 1,
      gasMax: 60,
      gasStep: 1,
      lfpMax: 160,
      lfpStep: 2,
      phsMax: 120,
      phsStep: 2,
    };
  }, [isSmallScale, isIndiaScale]);

  const updateField = <K extends keyof GridInputs>(key: K, value: GridInputs[K]) => {
    setActivePresetId('');
    onChange({ ...inputs, [key]: value });
  };

  const handleProfileChange = (profileId: GridInputs['profileId']) => {
    const match = GRID_PRESETS.find((p) => p.inputs.profileId === profileId);
    if (match) {
      setActivePresetId(match.id);
      onChange({ ...match.inputs });
    } else {
      updateField('profileId', profileId);
    }
  };

  // SVG chart dimensions
  const W = 760;
  const H = 310;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const maxY = useMemo(() => {
    let m = 1;
    for (const h of summary.hourly) {
      const stackTop =
        h.nuclearGW +
        h.windUsedGW +
        h.solarUsedGW +
        h.lfpDischargeGW +
        h.phsDischargeGW +
        h.gasGW +
        h.curtailedGW +
        h.unservedGW;
      m = Math.max(m, stackTop, h.demandGW * 1.08);
    }
    // Round up cleanly
    if (m <= 2) return Math.ceil(m * 4) / 4;
    if (m <= 20) return Math.ceil(m / 2) * 2;
    if (m <= 100) return Math.ceil(m / 10) * 10;
    return Math.ceil(m / 50) * 50;
  }, [summary.hourly]);

  const yScale = (val: number) => padT + plotH - (Math.max(0, val) / maxY) * plotH;
  const xCenter = (hour: number) => padL + ((hour + 0.5) / 24) * plotW;
  const barW = Math.max(10, plotW / 24 - 5);

  const demandPath = summary.hourly
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${xCenter(h.hour).toFixed(1)} ${yScale(h.demandGW).toFixed(1)}`)
    .join(' ');

  const netLoadPath = summary.hourly
    .map(
      (h, i) =>
        `${i === 0 ? 'M' : 'L'} ${xCenter(h.hour).toFixed(1)} ${yScale(Math.max(0, h.netLoadGW)).toFixed(1)}`
    )
    .join(' ');

  const inspected = summary.hourly[selectedHour] || summary.hourly[0];

  // Mini SoC SVG
  const socH = 74;
  const socPlotH = socH - 22;
  const socY = (pct: number) => 8 + socPlotH - (Math.min(100, Math.max(0, pct)) / 100) * socPlotH;
  const lfpSocPath = summary.hourly
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${xCenter(h.hour).toFixed(1)} ${socY(h.lfpSocPct).toFixed(1)}`)
    .join(' ');
  const phsSocPath = summary.hourly
    .map((h, i) => `${i === 0 ? 'M' : 'L'} ${xCenter(h.hour).toFixed(1)} ${socY(h.phsSocPct).toFixed(1)}`)
    .join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxY);

  return (
    <section className="lab-section" id="grid-dispatch">
      <div className="section-header">
        <div>
          <h2>A day on the grid: who supplies power each hour (dispatch) and the duck curve</h2>
          <p className="section-desc">
            Choose how many power plants and batteries the grid has. The model then fills every hour of the
            day from the cheapest available source and shows wasted solar, how steady the grid is, and the real
            cost of round-the-clock power.
          </p>
          <p className="plain-hint">
            Duck curve: demand minus solar and wind. It dips at midday when the sun is strong, then shoots up at
            sunset, and the shape looks like a duck.
          </p>
        </div>
        <div className="action-row">
          <button
            type="button"
            className="btn"
            onClick={() =>
              downloadTextFile(
                'grid-dispatch-24h.csv',
                buildDispatchCsv(inputs, summary),
                'text/csv;charset=utf-8'
              )
            }
          >
            Export 24h CSV
          </button>
        </div>
      </div>

      {/* Scenario Presets */}
      <div className="preset-strip" role="group" aria-label="Grid scenarios">
        {GRID_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`preset-btn ${activePresetId === preset.id ? 'active' : ''}`}
            title={preset.note}
            onClick={() => {
              setActivePresetId(preset.id);
              onChange({ ...preset.inputs });
            }}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Live KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-label">Real cost of 24/7 power (firm LCOE)</p>
          <p className="kpi-value accent">${summary.firmLcoeUsdMWh.toFixed(1)}/MWh</p>
          <p className="kpi-meta">
            Plant-only cost ${summary.headlineLcoeUsdMWh.toFixed(1)} + ${summary.firmingPremiumUsdMWh.toFixed(1)} for storage and wasted power
          </p>
          <p className="plain-hint">LCOE: lifetime cost per unit of electricity actually delivered. MWh: 1,000 kWh, the units on a home power bill.</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Wasted clean power (curtailment) / shortfall</p>
          <p className={`kpi-value ${summary.unservedGWh > 0.05 ? 'danger' : ''}`}>
            {summary.curtailmentPctOfVre.toFixed(1)}% of solar + wind
          </p>
          <p className="kpi-meta">
            {summary.curtailedGWh.toFixed(1)} GWh thrown away |{' '}
            {summary.unservedGWh > 0.05
              ? `${summary.unservedGWh.toFixed(1)} GWh short (${summary.deficitHours}h of blackouts)`
              : 'no blackouts'}
          </p>
          <p className="plain-hint">Curtailment: solar or wind that had to be switched off because nobody could use or store it. Lower is better.</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Clean power share</p>
          <p className={`kpi-value ${summary.cleanSharePct >= 75 ? 'ok' : ''}`}>
            {summary.cleanSharePct.toFixed(1)}%
          </p>
          <p className="kpi-meta">
            Evening ramp {summary.peakEveningRampGWPerHr.toFixed(1)} GW/h | land ~{Math.round(summary.landFootprintKm2).toLocaleString()} km²
          </p>
          <p className="plain-hint">Ramp: how fast other plants must speed up per hour as the sun sets. Steeper is harder.</p>
        </div>

        <div className="kpi-card">
          <p className="kpi-label">Grid steadiness (inertia, 50 Hz)</p>
          <p
            className={`kpi-value ${
              summary.inertiaStatus === 'Low-Inertia Risk'
                ? 'danger'
                : summary.inertiaStatus === 'Nominal'
                  ? 'ok'
                  : 'accent'
            }`}
          >
            H = {summary.minInertiaSec.toFixed(2)} s
          </p>
          <p className="kpi-meta">
            Frequency could fall {summary.worstRocofHzPerSec.toFixed(2)} Hz/s if a big plant trips (RoCoF) | {summary.inertiaStatus}
          </p>
          <p className="plain-hint">
            Frequency: the grid's heartbeat, 50 cycles a second. Inertia (H): seconds of spinning-turbine energy
            that resist sudden changes. Solar and wind add none. Below 1.5 s is risky, 2.5 s or more is healthy.
          </p>
        </div>
      </div>

      {/* Main Controls + Visuals */}
      <div className="lab-grid">
        {/* Left Controls */}
        <div className="card">
          <h3 className="card-title">Power plants and storage you build</h3>
          <p className="card-subtitle">
            Order used each hour (merit order): nuclear, then solar and wind, then batteries (LFP), then pumped
            hydro, then gas last. RTE (round-trip efficiency) is how much stored energy comes back out.
          </p>
          <p className="plain-hint">CF (capacity factor): share of the year a plant runs at full output. GWh: 1 GW for one hour.</p>

          <div className="control-group">
            <label className="control-label" htmlFor="demand-profile">
              Demand pattern
            </label>
            <select
              id="demand-profile"
              className="select-input"
              value={inputs.profileId}
              onChange={(e) => handleProfileChange(e.target.value as GridInputs['profileId'])}
              style={{ marginTop: 6 }}
            >
              {DEMAND_PROFILE_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <div className="control-head">
              <label className="control-label" htmlFor="solar-slider">Solar panels (22% CF)</label>
              <span className="control-val">{inputs.solarGW.toFixed(isSmallScale ? 1 : 0)} GW</span>
            </div>
            <div className="slider-wrap">
              <input
                id="solar-slider"
                type="range"
                min={0}
                max={sliderCaps.solarMax}
                step={sliderCaps.solarStep}
                value={inputs.solarGW}
                onChange={(e) => updateField('solarGW', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="control-group">
            <div className="control-head">
              <label className="control-label" htmlFor="wind-slider">Wind turbines on land (34% CF)</label>
              <span className="control-val">{inputs.windGW.toFixed(isSmallScale ? 1 : 0)} GW</span>
            </div>
            <div className="slider-wrap">
              <input
                id="wind-slider"
                type="range"
                min={0}
                max={sliderCaps.windMax}
                step={sliderCaps.windStep}
                value={inputs.windGW}
                onChange={(e) => updateField('windGW', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="control-group">
            <div className="control-head">
              <label className="control-label" htmlFor="nuclear-slider">Nuclear (92% CF)</label>
              <span className="control-val">{inputs.nuclearGW.toFixed(isSmallScale ? 1 : 0)} GW</span>
            </div>
            <div className="slider-wrap">
              <input
                id="nuclear-slider"
                type="range"
                min={0}
                max={sliderCaps.nuclearMax}
                step={sliderCaps.nuclearStep}
                value={inputs.nuclearGW}
                onChange={(e) => updateField('nuclearGW', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="control-group">
            <div className="control-head">
              <label className="control-label" htmlFor="gas-slider">Gas plants (CCGT and peakers, switch on when needed)</label>
              <span className="control-val">{inputs.gasGW.toFixed(isSmallScale ? 1 : 0)} GW</span>
            </div>
            <div className="slider-wrap">
              <input
                id="gas-slider"
                type="range"
                min={0}
                max={sliderCaps.gasMax}
                step={sliderCaps.gasStep}
                value={inputs.gasGW}
                onChange={(e) => updateField('gasGW', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="control-group">
            <div className="control-head">
              <label className="control-label" htmlFor="lfp-slider">Battery storage (LFP, 4h, 86.5% RTE)</label>
              <span className="control-val">
                {inputs.lfpGWh.toFixed(isSmallScale ? 1 : 0)} GWh ({(inputs.lfpGWh / 4).toFixed(1)} GW)
              </span>
            </div>
            <div className="slider-wrap">
              <input
                id="lfp-slider"
                type="range"
                min={0}
                max={sliderCaps.lfpMax}
                step={sliderCaps.lfpStep}
                value={inputs.lfpGWh}
                onChange={(e) => updateField('lfpGWh', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="control-group">
            <div className="control-head">
              <label className="control-label" htmlFor="phs-slider">Pumped hydro (water pumped uphill, 8h, 78.5% RTE)</label>
              <span className="control-val">
                {inputs.phsGWh.toFixed(isSmallScale ? 1 : 0)} GWh ({(inputs.phsGWh / 8).toFixed(1)} GW)
              </span>
            </div>
            <div className="slider-wrap">
              <input
                id="phs-slider"
                type="range"
                min={0}
                max={sliderCaps.phsMax}
                step={sliderCaps.phsStep}
                value={inputs.phsGWh}
                onChange={(e) => updateField('phsGWh', Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Right Live SVG Visuals */}
        <div className="chart-box">
          <div className="chart-header">
            <div>
              <h3 className="card-title">Each hour: power supplied vs power needed (GW)</h3>
              <p className="card-subtitle" style={{ marginBottom: 0 }}>
                Hover or tap any hour to see which plants are running, how full the stores are, and how steady the grid is.
                Hatched tops are wasted solar and wind; red means a shortfall.
              </p>
            </div>
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
              Delivered: {summary.deliveredGWh.toFixed(1)} / {summary.totalDemandGWh.toFixed(1)} GWh
            </span>
          </div>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="chart-svg"
            role="img"
            aria-label="24-hour stacked electricity generation and demand curve"
          >
            <defs>
              <pattern
                id="curtail-hatch"
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line x1="0" y1="0" x2="0" y2="6" stroke="#b45309" strokeWidth="1.5" opacity="0.55" />
              </pattern>
            </defs>

            {/* Horizontal grid lines */}
            {yTicks.map((tick) => {
              const y = yScale(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={W - padR}
                    y2={y}
                    stroke="#e5e5e3"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                    fill="#767672"
                  >
                    {maxY <= 2 ? tick.toFixed(1) : Math.round(tick)}
                  </text>
                </g>
              );
            })}

            {/* Stacked bars per hour */}
            {summary.hourly.map((h) => {
              const x = xCenter(h.hour) - barW / 2;
              const isSelected = h.hour === selectedHour;

              const segments = [
                { val: h.nuclearGW, fill: '#334155', key: 'nuc' },
                { val: h.windUsedGW, fill: '#64748b', key: 'wind' },
                { val: h.solarUsedGW, fill: '#d97706', key: 'solar' },
                { val: h.lfpDischargeGW, fill: '#0f766e', key: 'lfp' },
                { val: h.phsDischargeGW, fill: '#0369a1', key: 'phs' },
                { val: h.gasGW, fill: '#a8a29e', key: 'gas' },
                { val: h.unservedGW, fill: '#dc2626', key: 'unserved' },
              ];

              let cum = 0;
              return (
                <g
                  key={h.hour}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setSelectedHour(h.hour)}
                  onClick={() => setSelectedHour(h.hour)}
                >
                  {/* Hover column highlight */}
                  {isSelected && (
                    <rect
                      x={x - 2}
                      y={padT}
                      width={barW + 4}
                      height={plotH}
                      fill="#b45309"
                      opacity="0.08"
                    />
                  )}

                  {segments.map((seg) => {
                    if (seg.val <= 0.001) return null;
                    const yTop = yScale(cum + seg.val);
                    const yBot = yScale(cum);
                    cum += seg.val;
                    return (
                      <rect
                        key={seg.key}
                        x={x}
                        y={yTop}
                        width={barW}
                        height={Math.max(0.5, yBot - yTop)}
                        fill={seg.fill}
                        opacity={isSelected ? 1 : 0.88}
                      />
                    );
                  })}

                  {/* Curtailed VRE hatched cap */}
                  {h.curtailedGW > 0.01 && (
                    <rect
                      x={x}
                      y={yScale(cum + h.curtailedGW)}
                      width={barW}
                      height={Math.max(1, yScale(cum) - yScale(cum + h.curtailedGW))}
                      fill="url(#curtail-hatch)"
                      stroke="#b45309"
                      strokeWidth="0.75"
                    />
                  )}

                  {/* X-axis tick labels every 3 hours */}
                  {h.hour % 3 === 0 && (
                    <text
                      x={xCenter(h.hour)}
                      y={H - 12}
                      textAnchor="middle"
                      fontSize="11"
                      fontFamily="JetBrains Mono, monospace"
                      fill={isSelected ? '#111111' : '#767672'}
                      fontWeight={isSelected ? 600 : 400}
                    >
                      {String(h.hour).padStart(2, '0')}h
                    </text>
                  )}
                </g>
              );
            })}

            {/* Net Load ("Duck Curve") dashed line */}
            <path
              d={netLoadPath}
              fill="none"
              stroke="#b45309"
              strokeWidth="2"
              strokeDasharray="5 4"
            />

            {/* Total Demand solid line */}
            <path d={demandPath} fill="none" stroke="#111111" strokeWidth="2.5" />

            {/* Selected hour marker dot on Demand line */}
            <circle
              cx={xCenter(inspected.hour)}
              cy={yScale(inspected.demandGW)}
              r="4.5"
              fill="#ffffff"
              stroke="#111111"
              strokeWidth="2.2"
            />
          </svg>

          {/* Synchronized Storage State of Charge (SoC %) Strip */}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div className="chart-header" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-secondary)' }}>
                How full the stores are (state of charge, SoC), typical repeating day
              </span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                LFP {inspected.lfpSocPct.toFixed(0)}% | PHS {inspected.phsSocPct.toFixed(0)}% at {inspected.label}
              </span>
            </div>
            <svg viewBox={`0 0 ${W} ${socH}`} className="chart-svg" aria-label="Storage State of Charge curve">
              {[0, 50, 100].map((pct) => (
                <g key={pct}>
                  <line
                    x1={padL}
                    y1={socY(pct)}
                    x2={W - padR}
                    y2={socY(pct)}
                    stroke="#e5e5e3"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={socY(pct) + 3}
                    textAnchor="end"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    fill="#767672"
                  >
                    {pct}%
                  </text>
                </g>
              ))}
              {inputs.lfpGWh > 0 && (
                <path d={lfpSocPath} fill="none" stroke="#0f766e" strokeWidth="2" />
              )}
              {inputs.phsGWh > 0 && (
                <path d={phsSocPath} fill="none" stroke="#0369a1" strokeWidth="2" strokeDasharray="4 3" />
              )}
              <line
                x1={xCenter(inspected.hour)}
                y1={6}
                x2={xCenter(inspected.hour)}
                y2={socH - 12}
                stroke="#b45309"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
            </svg>
          </div>

          {/* Hour Inspector Readout */}
          <div className="inspector-bar" aria-live="polite">
            <span><strong>{inspected.label}</strong></span>
            <span>Demand {inspected.demandGW.toFixed(1)} GW</span>
            <span>Left after solar + wind (net load) {inspected.netLoadGW.toFixed(1)} GW</span>
            <span>Solar {inspected.solarUsedGW.toFixed(1)} GW</span>
            <span>Wind {inspected.windUsedGW.toFixed(1)} GW</span>
            <span>Nuclear {inspected.nuclearGW.toFixed(1)} GW</span>
            <span>Gas {inspected.gasGW.toFixed(1)} GW</span>
            <span>
              Battery {inspected.lfpDischargeGW > 0
                ? `+${inspected.lfpDischargeGW.toFixed(1)}`
                : inspected.lfpChargeGW > 0
                  ? `-${inspected.lfpChargeGW.toFixed(1)}`
                  : '0.0'} GW
            </span>
            <span>Inertia H = {inspected.inertiaSec.toFixed(2)}s</span>
            <span>Price set by: {inspected.marginalSource}</span>
          </div>

          {/* Legend */}
          <div className="legend-row">
            <span className="legend-item"><span className="swatch" style={{ background: '#334155' }} />Nuclear</span>
            <span className="legend-item"><span className="swatch" style={{ background: '#64748b' }} />Wind</span>
            <span className="legend-item"><span className="swatch" style={{ background: '#d97706' }} />Solar PV</span>
            <span className="legend-item"><span className="swatch" style={{ background: '#0f766e' }} />Battery (LFP)</span>
            <span className="legend-item"><span className="swatch" style={{ background: '#0369a1' }} />Pumped Hydro</span>
            <span className="legend-item"><span className="swatch" style={{ background: '#a8a29e' }} />Natural Gas</span>
            <span className="legend-item"><span className="swatch" style={{ background: '#fef3c7', border: '1px solid #b45309' }} />Wasted (curtailed)</span>
            <span className="legend-item"><span className="swatch-line" style={{ background: '#111111' }} />Demand</span>
            <span className="legend-item"><span className="swatch-line" style={{ borderTop: '2px dashed #b45309' }} />Duck curve (demand minus solar and wind)</span>
          </div>
        </div>
      </div>

      {/* Collapsible First-Principles Theory Drawer */}
      <details className="theory-drawer">
        <summary>The maths behind it: real cost of 24/7 power, storage losses and grid steadiness</summary>
        <div className="theory-body">
          <div>
            <h4>Why round-the-clock power costs more than the plant price (firm vs headline LCOE)</h4>
            <p>
              Headline solar ($36/MWh) and wind ($42/MWh) LCOE assume every generated MWh is consumed.
              When midday solar overshoots demand, curtailed MWh still carry full capital cost, and
              evening gaps require LFP storage ($110–$150/MWh LCOS, 85–88% RTE), Pumped Hydro
              ($80–$140/MWh, 75–82% RTE), or dispatchable CCGT gas (58–64% thermal efficiency).
            </p>
            <div className="eq-block">
              Firm LCOE = (Total Gen CAPEX/Fuel + Storage LCOS) / Actually Delivered MWh
            </div>
            <p>
              Benchmark: 1 GW of continuous 24/7 power from Solar + Megapacks in the US Southwest requires
              ~4.5–5.0 GWp PV (~90–100 km²) plus ~16 GWh LFP (~4,100 Megapack 2 XL units).
            </p>
          </div>
          <div>
            <h4>Spinning inertia, how fast frequency falls (RoCoF) and why hydrogen storage loses so much</h4>
            <p>
              On a 50 Hz AC grid (normal band 49.90–50.05 Hz; UFLS trips 49.4–48.8 Hz), spinning
              thermal/nuclear/hydro turbines provide mechanical inertia (H = 3–5 s), while inverter-based
              solar and wind provide H = 0 s without grid-forming controls. UFLS (under-frequency load shedding) is the automatic cut of some customers to save the rest:
            </p>
            <div className="eq-block">
              RoCoF = df/dt = [f0 * (P_gen - P_load)] / (2 * H_sys * S_n)
            </div>
            <p>
              Why LFP and Pumped Hydro beat Green Hydrogen for daily grid shifting: Electrolysis
              (55 kWh/kg, 60.6% LHV) + compression + CCGT/Fuel Cell (50–62%) yields only <strong>28%–35%</strong>{' '}
              round-trip power-to-power efficiency versus <strong>85%–88%</strong> for LFP BESS.
            </p>
          </div>
        </div>
      </details>
    </section>
  );
};
