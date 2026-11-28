import React from 'react';
import { Radio, CloudRain, Link2 } from 'lucide-react';
import {
  BAND_PRESETS,
  FrequencyBandId,
  LinkBudgetResult,
  WeatherCondition,
  formatThroughput,
} from '../physics/astrodynamics';

interface LinkBudgetLabProps {
  bandId: FrequencyBandId;
  frequencyGHz: number;
  bandwidthMHz: number;
  dishGainDbi: number;
  eirpDbw: number;
  weather: WeatherCondition;
  coupleToOrbit: boolean;
  manualDistanceKm: number;
  orbitSlantRangeKm: number;
  result: LinkBudgetResult;
  onSelectBand: (id: FrequencyBandId) => void;
  onFrequencyChange: (f: number) => void;
  onBandwidthChange: (b: number) => void;
  onDishGainChange: (g: number) => void;
  onEirpChange: (e: number) => void;
  onWeatherChange: (w: WeatherCondition) => void;
  onCoupleToggle: (coupled: boolean) => void;
  onManualDistanceChange: (d: number) => void;
}

const WEATHER_OPTIONS: { id: WeatherCondition; label: string }[] = [
  { id: 'clear', label: 'Clear sky' },
  { id: 'light-rain', label: 'Light rain' },
  { id: 'heavy-rain', label: 'Heavy rain' },
];

export const LinkBudgetLab: React.FC<LinkBudgetLabProps> = ({
  bandId,
  frequencyGHz,
  bandwidthMHz,
  dishGainDbi,
  eirpDbw,
  weather,
  coupleToOrbit,
  manualDistanceKm,
  orbitSlantRangeKm,
  result,
  onSelectBand,
  onFrequencyChange,
  onBandwidthChange,
  onDishGainChange,
  onEirpChange,
  onWeatherChange,
  onCoupleToggle,
  onManualDistanceChange,
}) => {
  // Build Shannon curve data points across SNR -5 dB to +30 dB for current bandwidth
  const snrMin = -5;
  const snrMax = 30;
  const curvePts: { snr: number; cap: number }[] = [];
  let maxCapPlot = 10;
  for (let s = snrMin; s <= snrMax; s += 1) {
    const lin = Math.pow(10, s / 10);
    const cap = bandwidthMHz * Math.log2(1 + lin);
    curvePts.push({ snr: s, cap });
    if (cap > maxCapPlot) maxCapPlot = cap;
  }

  // SVG chart coordinates (viewBox 0 0 560 220)
  const chartW = 560;
  const chartH = 210;
  const padL = 58;
  const padR = 20;
  const padT = 22;
  const padB = 34;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const xOfSnr = (snr: number) =>
    padL + ((Math.max(snrMin, Math.min(snrMax, snr)) - snrMin) / (snrMax - snrMin)) * plotW;
  const yOfCap = (cap: number) => padT + plotH - (Math.min(cap, maxCapPlot) / maxCapPlot) * plotH;

  const shannonPath = curvePts
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xOfSnr(pt.snr).toFixed(1)} ${yOfCap(pt.cap).toFixed(1)}`)
    .join(' ');

  const currentX = xOfSnr(result.snrDb);
  const currentY = yOfCap(result.shannonCapacityMbps);

  // Waterfall power bars normalized between -160 dBW and +70 dBW
  const pMin = -165;
  const pMax = 70;
  const barX = (dbw: number) => {
    const clamped = Math.max(pMin, Math.min(pMax, dbw));
    return ((clamped - pMin) / (pMax - pMin)) * 100;
  };

  const afterFspl = result.eirpDbw - result.fsplDb - result.atmLossDb - result.rainFadeDb;

  return (
    <section className="lab-card" aria-labelledby="link-budget-heading">
      <div className="lab-card-header">
        <div>
          <div className="lab-step">02 / RF link</div>
          <h2 id="link-budget-heading" className="lab-card-title">
            How fast can the satellite talk to you?
          </h2>
          <p className="lab-card-desc">
            A link budget is a running total of signal strength: what the satellite sends, minus what fades over distance and in rain, plus what your antenna catches. Compare what is left with background hiss to get the top possible download speed.
          </p>
        </div>
        <div className={`status-pill ${result.linkStatus}`}>
          <Radio size={14} aria-hidden="true" />
          <span title="How data is packed onto the radio wave at this signal quality">
            {result.linkStatus === 'strong' ? 'Good link' : result.linkStatus === 'marginal' ? 'Weak link' : 'No link'} · {result.modulationScheme}
          </span>
        </div>
      </div>

      <div className="workbench">
        {/* Left: Controls */}
        <div className="controls-panel">
          <label className="toggle-row">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
              <Link2 size={16} color="var(--accent)" aria-hidden="true" />
              <span>
                Use the distance from the orbit above ({Math.round(orbitSlantRangeKm).toLocaleString()} km)
              </span>
            </span>
            <input
              type="checkbox"
              checked={coupleToOrbit}
              onChange={(e) => onCoupleToggle(e.target.checked)}
            />
          </label>

          <div>
            <div className="kpi-label" style={{ marginBottom: '6px' }}>
              Radio band (S, Ku, Ka: low to high frequency)
            </div>
            <div className="preset-row">
              {BAND_PRESETS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`btn-chip ${bandId === b.id ? 'active' : ''}`}
                  onClick={() => onSelectBand(b.id)}
                >
                  {b.name} ({b.frequencyGHz} GHz)
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <div className="control-header">
              <label htmlFor="freq-slider" className="control-label">
                Radio frequency (wavelength {result.wavelengthMm.toFixed(1)} mm)
              </label>
              <span className="control-value">{frequencyGHz.toFixed(1)} GHz</span>
            </div>
            <input
              id="freq-slider"
              type="range"
              min={1.5}
              max={38}
              step={0.1}
              value={frequencyGHz}
              onChange={(e) => onFrequencyChange(Number(e.target.value))}
            />
            <div className="slider-ticks">
              <span>2.2 GHz (S)</span>
              <span>12 GHz (Ku)</span>
              <span>28 GHz (Ka)</span>
              <span>38 GHz</span>
            </div>
            <p className="plain-hint">Higher frequency carries more data but fades more in rain.</p>
          </div>

          <div className="control-group">
            <div className="control-header">
              <label htmlFor="bw-slider" className="control-label">
                Width of the radio lane (bandwidth, B)
              </label>
              <span className="control-value">{bandwidthMHz} MHz</span>
            </div>
            <input
              id="bw-slider"
              type="range"
              min={5}
              max={800}
              step={5}
              value={bandwidthMHz}
              onChange={(e) => onBandwidthChange(Number(e.target.value))}
            />
            <div className="slider-ticks">
              <span>5 MHz</span>
              <span>240 MHz (Starlink Ku)</span>
              <span>500 MHz</span>
              <span>800 MHz</span>
            </div>
            <p className="plain-hint">A wider lane carries more data, but also lets in more background noise.</p>
          </div>

          <div className="control-group">
            <div className="control-header">
              <label htmlFor="gain-slider" className="control-label">
                How well your antenna focuses the signal (antenna gain, Gr)
              </label>
              <span className="control-value">{dishGainDbi} dBi</span>
            </div>
            <input
              id="gain-slider"
              type="range"
              min={10}
              max={55}
              step={1}
              value={dishGainDbi}
              onChange={(e) => onDishGainChange(Number(e.target.value))}
            />
            <div className="slider-ticks">
              <span>10 dBi (handset)</span>
              <span>34 dBi (phased array)</span>
              <span>55 dBi (gateway)</span>
            </div>
            <p className="plain-hint">dB is a log scale: every +3 dB roughly doubles the power, +10 dB is 10 times.</p>
          </div>

          <div className="control-group">
            <div className="control-header">
              <label htmlFor="eirp-slider" className="control-label">
                Satellite transmit strength (EIRP)
              </label>
              <span className="control-value">{eirpDbw} dBW</span>
            </div>
            <input
              id="eirp-slider"
              type="range"
              min={35}
              max={65}
              step={1}
              value={eirpDbw}
              onChange={(e) => onEirpChange(Number(e.target.value))}
            />
            <div className="slider-ticks">
              <span>35 dBW</span>
              <span>50 dBW (LEO spot)</span>
              <span>65 dBW (big broadband satellite)</span>
            </div>
            <p className="plain-hint">EIRP is the power the satellite beams toward you, counting its own antenna focus. dBW means decibels compared with 1 watt.</p>
          </div>

          {!coupleToOrbit && (
            <div className="control-group">
              <div className="control-header">
                <label htmlFor="dist-slider" className="control-label">
                  Distance from you to the satellite
                </label>
                <span className="control-value">{manualDistanceKm.toLocaleString()} km</span>
              </div>
              <input
                id="dist-slider"
                type="range"
                min={300}
                max={41000}
                step={50}
                value={manualDistanceKm}
                onChange={(e) => onManualDistanceChange(Number(e.target.value))}
              />
              <div className="slider-ticks">
                <span>300 km</span>
                <span>1,000 km</span>
                <span>20,200 km</span>
                <span>41,000 km</span>
              </div>
            </div>
          )}

          <div>
            <div className="kpi-label" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CloudRain size={14} aria-hidden="true" />
              <span>Weather (signal lost to rain: {result.rainFadeDb.toFixed(1)} dB)</span>
            </div>
            <div className="preset-row">
              {WEATHER_OPTIONS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={`btn-chip ${weather === w.id ? 'active' : ''}`}
                  onClick={() => onWeatherChange(w.id)}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: KPI Readouts + Dark RF Scope & Shannon Curve */}
        <div className="controls-panel">
          <div className="kpi-grid">
            <div className="kpi-tile">
              <div className="kpi-label">Signal lost to distance (path loss)</div>
              <div className="kpi-value">{result.fsplDb.toFixed(1)} dB</div>
              <div className="kpi-sub">
                +{(result.atmLossDb + result.rainFadeDb).toFixed(1)} dB air and rain
              </div>
            </div>

            <div className="kpi-tile">
              <div className="kpi-label">Signal vs background hiss (SNR)</div>
              <div className="kpi-value">
                {result.snrDb >= 0 ? '+' : ''}
                {result.snrDb.toFixed(1)} dB
              </div>
              <div className="kpi-sub">
                received {result.receivedPowerDbw.toFixed(1)} vs noise {result.noiseFloorDbw.toFixed(1)} dBW
              </div>
            </div>

            <div className="kpi-tile">
              <div className="kpi-label">Top possible speed (Shannon limit)</div>
              <div className="kpi-value">{formatThroughput(result.shannonCapacityMbps)}</div>
              <div className="kpi-sub">{result.spectralEfficiencyBpsHz.toFixed(2)} bits per second per Hz of lane</div>
            </div>

            <div className="kpi-tile">
              <div className="kpi-label">Real-world speed (with error correction)</div>
              <div className="kpi-value">{formatThroughput(result.practicalLdpcMbps)}</div>
              <div className="kpi-sub">
                {result.shannonCapacityMbps > 0 ? Math.round((result.practicalLdpcMbps / result.shannonCapacityMbps) * 100) : 0}% of the limit, after LDPC error-correction overhead
              </div>
            </div>
          </div>

          <p className="plain-hint">
            SNR above 0 dB means the signal is louder than the noise. Around +10 dB or more is a comfortable link; below about -2 dB the receiver cannot lock on.
          </p>

          {/* Embedded dark figure box: RF Link Budget Scope + Shannon Curve */}
          <div className="figure-box" style={{ padding: '16px' }}>
            <div
              className="mono"
              style={{
                fontSize: '12px',
                color: '#cbd5e1',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 12px',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span>Top speed vs signal quality (Shannon: C = B log2(1 + SNR))</span>
              <span style={{ color: '#93c5fd' }}>B = {bandwidthMHz} MHz</span>
            </div>

            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              width="100%"
              role="img"
              aria-label="Shannon capacity curve plotting throughput versus SNR in decibels"
              style={{ display: 'block', height: 'auto' }}
            >
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = padT + plotH * (1 - frac);
                const val = maxCapPlot * frac;
                return (
                  <g key={frac}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="rgba(148,163,184,0.16)"
                      strokeWidth="1"
                    />
                    <text
                      x={padL - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {val >= 1000 ? `${(val / 1000).toFixed(1)}G` : `${Math.round(val)}M`}
                    </text>
                  </g>
                );
              })}

              {[-5, 0, 5, 10, 15, 20, 25, 30].map((s) => {
                const x = xOfSnr(s);
                return (
                  <g key={s}>
                    <line
                      x1={x}
                      y1={padT}
                      x2={x}
                      y2={padT + plotH}
                      stroke="rgba(148,163,184,0.12)"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={chartH - 12}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {s} dB
                    </text>
                  </g>
                );
              })}

              {/* Shannon curve */}
              <path d={shannonPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" />

              {/* Operating point crosshairs */}
              <line
                x1={currentX}
                y1={padT}
                x2={currentX}
                y2={padT + plotH}
                stroke="rgba(251,191,36,0.55)"
                strokeDasharray="4 3"
                strokeWidth="1.2"
              />
              <line
                x1={padL}
                y1={currentY}
                x2={chartW - padR}
                y2={currentY}
                stroke="rgba(251,191,36,0.55)"
                strokeDasharray="4 3"
                strokeWidth="1.2"
              />
              <circle cx={currentX} cy={currentY} r="5.5" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
              <text
                x={Math.min(chartW - padR - 4, currentX + 10)}
                y={Math.max(padT + 14, currentY - 8)}
                textAnchor={currentX > chartW - 140 ? 'end' : 'start'}
                fill="#f8fafc"
                fontSize="11"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                {formatThroughput(result.shannonCapacityMbps)} @ {result.snrDb.toFixed(1)} dB
              </text>
            </svg>

            {/* Power Budget Waterfall Bar */}
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
              <div className="mono" style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>
                Signal strength step by step (dBW, higher is stronger)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Sent (EIRP)', val: result.eirpDbw, color: '#60a5fa' },
                  { label: 'After distance + rain', val: afterFspl, color: '#f87171' },
                  { label: 'Received (+antenna)', val: result.receivedPowerDbw, color: '#34d399' },
                  { label: 'Background noise', val: result.noiseFloorDbw, color: '#94a3b8' },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 150px) 1fr 52px',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                    }}
                    className="mono"
                  >
                    <span style={{ color: '#cbd5e1' }}>{row.label}</span>
                    <div
                      style={{
                        height: '8px',
                        background: '#1e293b',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(2, barX(row.val))}%`,
                          height: '100%',
                          background: row.color,
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                    <span style={{ color: '#f8fafc', textAlign: 'right' }}>
                      {row.val.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
