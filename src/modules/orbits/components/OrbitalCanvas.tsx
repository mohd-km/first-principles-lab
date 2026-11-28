import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Orbit, RotateCcw } from 'lucide-react';
import {
  EARTH_RADIUS_KM,
  LEO_REF_ALTITUDE_KM,
  ORBIT_PRESETS,
  OrbitMetrics,
  altitudeToSlider,
  sliderToAltitude,
} from '../physics/astrodynamics';

interface OrbitalCanvasProps {
  altitudeKm: number;
  elevationDeg: number;
  metrics: OrbitMetrics;
  onAltitudeChange: (alt: number) => void;
  onElevationChange: (el: number) => void;
}

const TIME_WARPS = [
  { label: '1x', mult: 1 },
  { label: '20x', mult: 20 },
  { label: '120x', mult: 120 },
  { label: '600x', mult: 600 },
];

// Smooth non-linear radial mapping so LEO (400-550 km), MEO (20,200 km), and GEO (35,786 km)
// are all clearly legible simultaneously on a single 2D figure.
function mapAltitudeToPx(altKm: number, earthR: number, maxOrbitR: number): number {
  const norm = Math.log10(1 + altKm / 320) / Math.log10(1 + 35786 / 320);
  return earthR + 18 + norm * (maxOrbitR - earthR - 18);
}

export const OrbitalCanvas: React.FC<OrbitalCanvasProps> = ({
  altitudeKm,
  elevationDeg,
  metrics,
  onAltitudeChange,
  onElevationChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeWarpIdx, setTimeWarpIdx] = useState(2); // 120x default
  const [showHohmann, setShowHohmann] = useState(true);

  const simRef = useRef({
    satAngle: -Math.PI / 4,
    earthAngle: -Math.PI / 2,
    pulsePhase: 0,
    lastTs: 0,
  });

  useEffect(() => {
    let rafId = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (ts: number) => {
      const sim = simRef.current;
      // Skip drawing while the tab is hidden (display:none) to keep background tabs idle.
      if (!canvas.offsetParent) {
        sim.lastTs = ts;
        rafId = requestAnimationFrame(render);
        return;
      }
      if (sim.lastTs === 0) sim.lastTs = ts;
      const dtSec = Math.min(0.05, (ts - sim.lastTs) / 1000);
      sim.lastTs = ts;

      const warp = TIME_WARPS[timeWarpIdx].mult;
      if (isPlaying) {
        // Angular velocity rad/s scaled by time warp
        const omegaSat = (2 * Math.PI) / metrics.periodSeconds;
        const omegaEarth = (2 * Math.PI) / 86164.0905;
        sim.satAngle += omegaSat * dtSec * warp;
        sim.earthAngle += omegaEarth * dtSec * warp;
        sim.pulsePhase = (sim.pulsePhase + dtSec * 1.4) % 1;
      }

      // Responsive HiDPI backing store
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || 640;
      const cssH = Math.round(Math.min(460, Math.max(320, cssW * 0.7)));
      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        canvas.style.height = `${cssH}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = cssW / 2;
      const cy = cssH / 2;
      const maxR = Math.min(cssW, cssH) * 0.44;
      const earthR = Math.max(30, maxR * 0.24);

      // 1. Dark editorial figure backdrop (#0f172a)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, cssW, cssH);

      // Subtle coordinate crosshairs
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - maxR - 14, cy);
      ctx.lineTo(cx + maxR + 14, cy);
      ctx.moveTo(cx, cy - maxR - 14);
      ctx.lineTo(cx, cy + maxR + 14);
      ctx.stroke();

      // 2. Reference orbital shells: LEO 550 km, MEO 20,200 km, GEO 35,786 km
      const refShells = [
        { alt: 550, label: 'LEO 550 km' },
        { alt: 20200, label: 'MEO 20,200 km' },
        { alt: 35786, label: 'GEO 35,786 km' },
      ];

      ctx.font = '500 11px "JetBrains Mono", monospace';
      refShells.forEach((shell) => {
        const r = mapAltitudeToPx(shell.alt, earthR, maxR);
        ctx.beginPath();
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = 1;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.textAlign = 'left';
        if (cssW < 520 && shell.alt > 1000) {
          // Narrow canvas: park MEO/GEO labels on the left axis so they clear the telemetry header.
          ctx.fillText(shell.label, cx - r + 4, shell.alt > 30000 ? cy - 5 : cy + 13);
        } else {
          ctx.fillText(shell.label, cx + 6, cy - r + 12);
        }
      });

      // 3. Optional Hohmann transfer ellipse from 550 km LEO parking orbit to target altitude
      const leoR = mapAltitudeToPx(LEO_REF_ALTITUDE_KM, earthR, maxR);
      const orbitR = mapAltitudeToPx(altitudeKm, earthR, maxR);

      if (showHohmann && Math.abs(altitudeKm - LEO_REF_ALTITUDE_KM) > 150) {
        const rInner = Math.min(leoR, orbitR);
        const rOuter = Math.max(leoR, orbitR);
        const a = (rInner + rOuter) / 2;
        const cFocus = a - rInner;
        const b = Math.sqrt(Math.max(1, a * a - cFocus * cFocus));

        ctx.save();
        ctx.translate(cx - cFocus, cy);
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
        ctx.lineWidth = 1.5;
        ctx.ellipse(0, 0, a, b, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Burn markers
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx + rInner, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - rOuter, cy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Active target circular orbit
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
      ctx.stroke();

      // 5. Earth disk with subtle atmosphere rim & latitude/meridian lines
      const atmGrad = ctx.createRadialGradient(cx, cy, earthR * 0.9, cx, cy, earthR + 9);
      atmGrad.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
      atmGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = atmGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, earthR + 9, 0, Math.PI * 2);
      ctx.fill();

      const earthGrad = ctx.createRadialGradient(
        cx - earthR * 0.3,
        cy - earthR * 0.3,
        earthR * 0.15,
        cx,
        cy,
        earthR
      );
      earthGrad.addColorStop(0, '#3b82f6');
      earthGrad.addColorStop(0.65, '#1d4ed8');
      earthGrad.addColorStop(1, '#172554');
      ctx.fillStyle = earthGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
      ctx.fill();

      // Rotating meridian tick on Earth
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const ang = sim.earthAngle + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * earthR, cy + Math.sin(ang) * earthR);
        ctx.stroke();
      }
      ctx.restore();

      // 6. Satellite position & Ground Station position (geometrically offset by elevation angle)
      const satX = cx + Math.cos(sim.satAngle) * orbitR;
      const satY = cy + Math.sin(sim.satAngle) * orbitR;

      // Ground station positioned at an angular offset corresponding to elevationDeg
      // At 90 deg elevation (zenith), ground station is directly beneath satellite;
      // at 25 deg, shifted along Earth's limb within visibility cone.
      const maxOffsetRad = Math.min(0.9, (90 - elevationDeg) * 0.011);
      const gsAngle = sim.satAngle + maxOffsetRad;
      const gsX = cx + Math.cos(gsAngle) * earthR;
      const gsY = cy + Math.sin(gsAngle) * earthR;

      // Coverage cone from satellite to Earth limb
      ctx.fillStyle = 'rgba(59, 130, 246, 0.11)';
      ctx.beginPath();
      ctx.moveTo(satX, satY);
      const coneSpread = Math.min(0.65, 0.22 + (altitudeKm / 35786) * 0.4);
      ctx.lineTo(
        cx + Math.cos(sim.satAngle - coneSpread) * earthR,
        cy + Math.sin(sim.satAngle - coneSpread) * earthR
      );
      ctx.lineTo(
        cx + Math.cos(sim.satAngle + coneSpread) * earthR,
        cy + Math.sin(sim.satAngle + coneSpread) * earthR
      );
      ctx.closePath();
      ctx.fill();

      // RF Slant-Range Link Line + travelling light pulse
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.75)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.moveTo(gsX, gsY);
      ctx.lineTo(satX, satY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Travelling RF packet pulse along link
      const pT = sim.pulsePhase;
      const px = gsX + (satX - gsX) * pT;
      const py = gsY + (satY - gsY) * pT;
      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Ground station dot
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(gsX, gsY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Satellite velocity tangent arrow
      const tangentX = -Math.sin(sim.satAngle);
      const tangentY = Math.cos(sim.satAngle);
      const arrowLen = 14 + (metrics.orbitalVelocityKmS / 7.8) * 18;
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(satX, satY);
      ctx.lineTo(satX + tangentX * arrowLen, satY + tangentY * arrowLen);
      ctx.stroke();

      // Satellite icon (solar wings + bus)
      ctx.save();
      ctx.translate(satX, satY);
      ctx.rotate(sim.satAngle + Math.PI / 2);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(-11, -2, 7, 4);
      ctx.fillRect(4, -2, 7, 4);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-3.5, -3.5, 7, 7);
      ctx.restore();

      // 7. Compact HUD overlay (top-left & bottom-left)
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${metrics.regime}  h = ${Math.round(altitudeKm).toLocaleString()} km`,
        14,
        24
      );
      ctx.font = '400 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(
        `r = ${Math.round(EARTH_RADIUS_KM + altitudeKm).toLocaleString()} km  |  slant d = ${Math.round(
          metrics.slantRangeKm
        ).toLocaleString()} km`,
        14,
        42
      );

      // Legend bottom-left
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(cssW < 520 ? 'Blue: target  Amber: Hohmann from LEO' : 'Blue: Target orbit   Amber: Hohmann from 550 km LEO', 14, cssH - 14);

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [altitudeKm, elevationDeg, isPlaying, timeWarpIdx, showHohmann, metrics.periodSeconds, metrics.orbitalVelocityKmS, metrics.regime, metrics.slantRangeKm]);

  const periodLabel =
    metrics.periodMinutes < 180
      ? `${metrics.periodMinutes.toFixed(1)} min`
      : `${metrics.periodHours.toFixed(2)} hr`;

  const passLabel =
    metrics.groundPassMinutes === null
      ? 'Stationary'
      : metrics.groundPassMinutes < 60
      ? `~${metrics.groundPassMinutes.toFixed(1)} min`
      : `~${(metrics.groundPassMinutes / 60).toFixed(1)} hr`;

  return (
    <section className="lab-card" aria-labelledby="orbital-lab-heading">
      <div className="lab-card-header">
        <div>
          <div className="lab-step">01 / astrodynamics</div>
          <h2 id="orbital-lab-heading" className="lab-card-title">
            How high a satellite flies, and what it costs
          </h2>
          <p className="lab-card-desc">
            Drag the height from 200 km (low orbit, LEO, where Starlink and the space station fly) up to 35,786 km (geostationary orbit, GEO, where a satellite hangs over one spot). Speed, lap time, signal delay and the extra rocket push needed all update live.
          </p>
        </div>
        <div className="status-pill">
          <Orbit size={14} aria-hidden="true" />
          <span>{metrics.regime === 'LEO' ? 'Low orbit (LEO)' : metrics.regime === 'MEO' ? 'Middle orbit (MEO)' : 'High orbit (GEO)'}</span>
        </div>
      </div>

      <div className="workbench">
        {/* Left: Embedded dark figure box */}
        <div className="figure-box">
          <canvas
            ref={canvasRef}
            className="figure-canvas"
            aria-label="Animated 2D Earth orbit simulation showing satellite, ground terminal, RF slant path, and Hohmann transfer ellipse"
          />
          <p className="plain-hint figure-hint">
            The dashed ellipse is the cheapest two-burn route up from a 550 km orbit (a Hohmann transfer). The 1x to 600x buttons speed up time.
          </p>
          <div className="figure-toolbar">
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="figure-btn"
                onClick={() => setIsPlaying((p) => !p)}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              {TIME_WARPS.map((w, idx) => (
                <button
                  key={w.label}
                  type="button"
                  className={`figure-btn ${timeWarpIdx === idx ? 'active' : ''}`}
                  onClick={() => setTimeWarpIdx(idx)}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`figure-btn ${showHohmann ? 'active' : ''}`}
                onClick={() => setShowHohmann((s) => !s)}
              >
                Transfer path (Hohmann)
              </button>
              <button
                type="button"
                className="figure-btn"
                onClick={() => {
                  onAltitudeChange(550);
                  onElevationChange(45);
                }}
                title="Reset to 550 km Starlink orbit" aria-label="Reset to 550 km Starlink orbit"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Controls + Live KPI Telemetry */}
        <div className="controls-panel">
          <div>
            <div className="kpi-label" style={{ marginBottom: '6px' }}>
              Quick picks (real satellites)
            </div>
            <div className="preset-row">
              {ORBIT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`btn-chip ${Math.abs(altitudeKm - preset.altitudeKm) < 15 ? 'active' : ''}`}
                  onClick={() => onAltitudeChange(preset.altitudeKm)}
                >
                  {preset.shortLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <div className="control-header">
              <label htmlFor="altitude-slider" className="control-label">
                Height above Earth (altitude, log scale)
              </label>
              <span className="control-value">
                {Math.round(altitudeKm).toLocaleString()} km
              </span>
            </div>
            <input
              id="altitude-slider"
              type="range"
              min={0}
              max={1000}
              step={1}
              value={Math.round(altitudeToSlider(altitudeKm))}
              onChange={(e) => onAltitudeChange(sliderToAltitude(Number(e.target.value)))}
            />
            <div className="slider-ticks">
              <span>200 km</span>
              <span>550 km LEO</span>
              <span>20,200 km MEO</span>
              <span>35,786 km GEO</span>
            </div>
            <p className="plain-hint">LEO = low orbit, MEO = middle orbit (GPS), GEO = geostationary, one lap per day so it seems to stand still.</p>
          </div>

          <div className="control-group">
            <div className="control-header">
              <label htmlFor="elevation-slider" className="control-label">
                How high in your sky the satellite sits (elevation angle)
              </label>
              <span className="control-value">
                {elevationDeg} deg (straight-line distance {Math.round(metrics.slantRangeKm).toLocaleString()} km)
              </span>
            </div>
            <input
              id="elevation-slider"
              type="range"
              min={25}
              max={90}
              step={1}
              value={elevationDeg}
              onChange={(e) => onElevationChange(Number(e.target.value))}
            />
            <div className="slider-ticks">
              <span>25 deg (horizon edge)</span>
              <span>55 deg</span>
              <span>90 deg (overhead)</span>
            </div>
            <p className="plain-hint">Lower in the sky means the signal travels further at a slant, so it is weaker and slower.</p>
          </div>

          <div className="kpi-grid">
            <div className="kpi-tile">
              <div className="kpi-label">Speed in orbit</div>
              <div className="kpi-value">{metrics.orbitalVelocityKmS.toFixed(2)} km/s</div>
              <div className="kpi-sub">{Math.round(metrics.orbitalVelocityKmH).toLocaleString()} km/h</div>
            </div>

            <div className="kpi-tile">
              <div className="kpi-label">Time for one lap (period)</div>
              <div className="kpi-value">{periodLabel}</div>
              <div className="kpi-sub">
                {metrics.orbitsPerDay.toFixed(1)} laps/day | in view {passLabel}
              </div>
            </div>

            <div className="kpi-tile">
              <div className="kpi-label">Signal delay there and back (latency)</div>
              <div className="kpi-value">{metrics.singleHopRttMs.toFixed(1)} ms</div>
              <div className="kpi-sub">
                1-way {metrics.oneWayLatencyMs.toFixed(1)} ms | via ground station {metrics.gatewayHopRttMs.toFixed(1)} ms
              </div>
            </div>

            <div className="kpi-tile">
              <div className="kpi-label">Total speed change a rocket must supply (delta-v)</div>
              <div className="kpi-value">{metrics.totalLaunchDeltaVKmS.toFixed(2)} km/s</div>
              <div className="kpi-sub">
                transfer +{metrics.hohmannTotalKmS.toFixed(2)} km/s | {metrics.methaloxMassFractionPct.toFixed(1)}% of lift-off mass is fuel
              </div>
            </div>
          </div>

          <p className="plain-hint">
            Delta-v is the rocket's speed budget: about 9.4 km/s just to reach low orbit once air drag and gravity losses are paid. The fuel share comes from the rocket equation (Tsiolkovsky) for a single stage with methane engines rated at 350 s (specific impulse, a fuel-efficiency score: higher means more push per kilo of fuel).
          </p>
          <div className="kpi-tile" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span className="kpi-label" style={{ margin: 0 }}>
              Gravity left at this height: <strong className="mono" style={{ color: 'var(--ink)' }}>{metrics.gravityPercent.toFixed(1)}%</strong> ({metrics.gravityMs2.toFixed(2)} m/s^2)
            </span>
            <span className="kpi-label" style={{ margin: 0 }}>
              Speed to leave Earth for good (escape speed): <strong className="mono" style={{ color: 'var(--ink)' }}>{metrics.escapeVelocityKmS.toFixed(2)} km/s</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
