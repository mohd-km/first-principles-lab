const INITIAL_STATIONS = [
  { id: 0, name: 'Stamp & Frame', essential: true, baseSec: 22, bloatReason: null },
  { id: 1, name: 'Dual Spec Audit', essential: false, baseSec: 38, bloatReason: 'Legacy committee sign-off' },
  { id: 2, name: 'Fiberglass Mat', essential: false, baseSec: 44, bloatReason: 'NVH mat neither team owned' },
  { id: 3, name: 'Weld & Seal', essential: true, baseSec: 24, bloatReason: null },
  { id: 4, name: 'Extra Bracket', essential: false, baseSec: 32, bloatReason: 'Redundant safety bracket' },
  { id: 5, name: 'Battery & Drive', essential: true, baseSec: 25, bloatReason: null },
  { id: 6, name: 'Paper QA Log', essential: false, baseSec: 34, bloatReason: 'Manual clipboard check' },
  { id: 7, name: 'Final Calibrate', essential: true, baseSec: 21, bloatReason: null }
];

export function initFactorySim(container) {
  let state = createInitialState();
  let visible = false;
  let rafId = null;
  let lastTime = 0;

  function createInitialState() {
    return {
      questioned: false,
      simplified: false,
      accelerated: false,
      automated: false,
      jammed: false,
      stations: INITIAL_STATIONS.map((s) => ({ ...s, deleted: false })),
      units: Array.from({ length: 10 }, (_, i) => ({
        x: 40 + i * 86,
        stalled: false
      })),
      pulsePhase: 0
    };
  }

  container.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Five steps to a faster factory line</h2>
        <p class="section-lead">An 8-station car assembly line. Apply the five steps in order, or click Step 5 (Automate) first to see robots jam on steps that should never have existed, as happened on Tesla's Model 3 line.</p>
        <p class="plain-hint">Output per hour (throughput) is set by the slowest station (the bottleneck): the whole line can only move as fast as that one step.</p>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" class="btn btn-sm" id="fs-reset">Reset Line</button>
      </div>
    </div>

    <div class="kpi-grid cols-4" id="fs-kpis"></div>

    <div class="step-deck" id="fs-steps"></div>

    <div class="card card-white">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <h3 class="card-title" style="margin:0;">Live 8-Station Production Line</h3>
        <span style="font-family:var(--font-mono); font-size:12px; color:var(--ink-muted);" id="fs-line-caption">Tap any station chip below to delete or restore it.</span>
      </div>

      <div class="chart-wrap" style="padding:10px;">
        <svg id="fs-svg" viewBox="0 0 920 225" role="img" aria-label="Animated 8-station factory production line"></svg>
      </div>

      <div class="station-strip" id="fs-station-strip"></div>
      <div id="fs-diagnosis"></div>
    </div>

    <details class="theory-drawer">
      <summary>The five steps, explained</summary>
      <div class="drawer-body">
        <p><strong>1. Question every requirement.</strong> Requirements must come from a named person, not a department. Even smart people leave stale specs behind.</p>
        <p><strong>2. Delete any part or process you can.</strong> If you do not end up adding at least 10% back in, you did not delete enough. Try deleting an essential station above to see the line break and restore it.</p>
        <p><strong>3. Simplify and optimize.</strong> Never optimize a thing that should not exist.</p>
        <p><strong>4. Accelerate cycle time.</strong> Go faster only after deleting and simplifying.</p>
        <p><strong>5. Automate, last.</strong> During the Model 3 ramp, Tesla automated the fiberglass battery mat before realizing the mat was unnecessary, jamming the line and pushing up equipment spending (capex).</p>
      </div>
    </details>
  `;

  const kpisEl = container.querySelector('#fs-kpis');
  const stepsEl = container.querySelector('#fs-steps');
  const svgEl = container.querySelector('#fs-svg');
  const stripEl = container.querySelector('#fs-station-strip');
  const diagEl = container.querySelector('#fs-diagnosis');
  const resetBtn = container.querySelector('#fs-reset');

  function getStationCycleSec(s) {
    if (s.deleted) return 0;
    let sec = s.baseSec;
    if (state.questioned) sec *= 0.92;
    if (state.simplified) sec *= 0.74;
    if (state.accelerated) sec *= 0.68;
    if (state.automated) {
      if (state.jammed && !s.essential) {
        sec *= 2.8;
      } else if (!state.jammed) {
        sec *= 0.65;
      }
    }
    return Math.max(4, sec);
  }

  function computeFactoryMetrics() {
    const activeStations = state.stations.filter((s) => !s.deleted);
    const activeBloat = activeStations.filter((s) => !s.essential);
    const brokenEssentials = state.stations.filter((s) => s.essential && s.deleted);
    const deletedBloatCount = state.stations.filter((s) => !s.essential && s.deleted).length;

    let bottleneck = null;
    let maxSec = 0;
    activeStations.forEach((s) => {
      const c = getStationCycleSec(s);
      if (c > maxSec) {
        maxSec = c;
        bottleneck = s;
      }
    });

    // Throughput units/hr = 3600 / bottleneckCycleSec
    let throughput = maxSec > 0 ? 3600 / maxSec : 0;
    if (brokenEssentials.length > 0) {
      throughput = 0;
    } else if (state.jammed) {
      throughput = Math.min(throughput, 26);
    }

    // Capex ($M)
    let capex = 24 + activeStations.length * 3.5;
    if (state.simplified) capex -= 4.5;
    if (state.automated) {
      capex += state.jammed ? 52 : activeStations.length * 4.2;
    }

    // Unit Cost ($)
    const baseMaterial = 18500;
    const overheadPerHour = 140000 + capex * 1900;
    let unitCost = throughput > 0 ? baseMaterial + overheadPerHour / throughput : 0;
    if (state.jammed) {
      unitCost += 7400; // Scrap & rework from jammed robots
    }

    const baselineThroughput = 3600 / 44; // ~81.8 units/hr
    const gainRatio = throughput / baselineThroughput;

    let statusLabel = 'Baseline';
    let statusTone = '';
    if (brokenEssentials.length > 0) {
      statusLabel = 'Line Broken';
      statusTone = 'is-danger';
    } else if (state.jammed) {
      statusLabel = 'JAMMED';
      statusTone = 'is-danger';
    } else if (state.automated && deletedBloatCount >= 3 && gainRatio >= 2.8) {
      statusLabel = '3x+ Optimal';
      statusTone = 'is-success';
    } else if (deletedBloatCount > 0 || state.questioned) {
      statusLabel = 'Optimizing';
      statusTone = 'is-accent';
    }

    return {
      activeStations,
      activeBloat,
      brokenEssentials,
      deletedBloatCount,
      bottleneck,
      throughput,
      capex,
      unitCost,
      gainRatio,
      statusLabel,
      statusTone
    };
  }

  function renderUI() {
    const m = computeFactoryMetrics();

    kpisEl.innerHTML = `
      <div class="kpi-box ${m.statusTone}">
        <span class="kpi-label">Output (throughput)</span>
        <span class="kpi-value">${m.brokenEssentials.length ? '0 cars/hr' : `${Math.round(m.throughput)} cars/hr`}</span>
        <span class="kpi-sub">${m.brokenEssentials.length ? 'Missing essential step' : `${m.gainRatio.toFixed(1)}x vs baseline`}</span>
      </div>
      <div class="kpi-box ${m.statusTone === 'is-danger' ? 'is-danger' : m.unitCost > 0 && m.unitCost < 20000 ? 'is-success' : ''}">
        <span class="kpi-label">Cost per car</span>
        <span class="kpi-value">${m.unitCost > 0 ? `$${Math.round(m.unitCost).toLocaleString('en-US')}` : 'HALTED'}</span>
        <span class="kpi-sub">Baseline: $21,390</span>
      </div>
      <div class="kpi-box ${state.jammed ? 'is-danger' : ''}">
        <span class="kpi-label">Equipment spend (capex)</span>
        <span class="kpi-value">$${m.capex.toFixed(1)}M</span>
        <span class="kpi-sub">${m.activeStations.length} active stations</span>
      </div>
      <div class="kpi-box ${m.statusTone}">
        <span class="kpi-label">Line status</span>
        <span class="kpi-value">${m.statusLabel}</span>
        <span class="kpi-sub">${m.bottleneck && !m.brokenEssentials.length ? `Slowest step (bottleneck): ${m.bottleneck.name}` : 'Restore broken station'}</span>
      </div>
    `;

    stepsEl.innerHTML = `
      <button type="button" class="step-btn ${state.questioned ? 'is-done' : ''}" data-step="question">
        <span class="step-num">STEP 01</span>
        <span class="step-name">Question Requirements</span>
        <span class="step-meta">${state.questioned ? '4 bloat stations exposed' : 'Expose legacy bloat'}</span>
      </button>
      <button type="button" class="step-btn ${m.deletedBloatCount >= 3 ? 'is-done' : ''}" data-step="delete">
        <span class="step-num">STEP 02</span>
        <span class="step-name">Delete Station</span>
        <span class="step-meta">${m.deletedBloatCount}/4 bloat deleted</span>
      </button>
      <button type="button" class="step-btn ${state.simplified ? 'is-done' : ''}" data-step="simplify">
        <span class="step-num">STEP 03</span>
        <span class="step-name">Simplify &amp; Optimize</span>
        <span class="step-meta">${state.simplified ? 'Cycle time -26%' : 'Trim remaining steps'}</span>
      </button>
      <button type="button" class="step-btn ${state.accelerated ? 'is-done' : ''}" data-step="accelerate">
        <span class="step-num">STEP 04</span>
        <span class="step-name">Accelerate Cycle</span>
        <span class="step-meta">${state.accelerated ? 'Line speed +32%' : 'Speed up each step'}</span>
      </button>
      <button type="button" class="step-btn ${state.jammed ? 'is-jam' : state.automated ? 'is-done' : ''}" data-step="automate">
        <span class="step-num">STEP 05</span>
        <span class="step-name">Automate Line</span>
        <span class="step-meta">${state.jammed ? 'JAMMED! Rip out bloat' : state.automated ? 'Robots running clean' : 'Deploy robotics'}</span>
      </button>
    `;

    stepsEl.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => handleStep(btn.dataset.step));
    });

    stripEl.innerHTML = state.stations
      .map((s) => {
        const sec = getStationCycleSec(s);
        const isBloatVisible = state.questioned && !s.essential && !s.deleted;
        const isBroken = s.essential && s.deleted;
        const isBottleneck = m.bottleneck && m.bottleneck.id === s.id && !m.brokenEssentials.length;
        const cls = [
          'station-chip',
          s.deleted && !isBroken ? 'is-deleted' : '',
          isBroken ? 'is-broken' : '',
          isBloatVisible ? 'is-bloat' : '',
          isBottleneck ? 'is-bottleneck' : ''
        ]
          .filter(Boolean)
          .join(' ');
        return `
          <button type="button" class="${cls}" data-station="${s.id}">
            <span class="station-chip-name">${s.id + 1}. ${s.name}</span>
            <span class="station-chip-time">${
              isBroken
                ? 'BROKEN: tap to restore'
                : s.deleted
                  ? 'DELETED: tap to add back'
                  : `${sec.toFixed(0)}s${isBloatVisible ? ' (bloat)' : ''}`
            }</span>
          </button>
        `;
      })
      .join('');

    stripEl.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => toggleStation(Number(btn.dataset.station)));
    });

    // Diagnosis copy (max 1-2 short lines)
    let diagHtml = '';
    if (m.brokenEssentials.length > 0) {
      const names = m.brokenEssentials.map((s) => s.name).join(', ');
      diagHtml = `
        <div class="diagnosis-box is-danger">
          <p class="diagnosis-tag">Line broken: add 10% back</p>
          <p class="diagnosis-text">You deleted a step the car really needs (${names}). Tap the red chip above to add it back. Now you know the true minimum line.</p>
        </div>
      `;
    } else if (state.jammed) {
      diagHtml = `
        <div class="diagnosis-box is-danger">
          <p class="diagnosis-tag">Robot jam (automated too early)</p>
          <p class="diagnosis-text">You automated ${m.activeBloat.length} unneeded stations (like the fibreglass mat). Robots are jamming, equipment spend jumped $52M, and cost per car rose. Delete the bloated stations to clear the jam.</p>
        </div>
      `;
    } else if (state.automated && m.deletedBloatCount >= 3 && m.gainRatio >= 2.8) {
      diagHtml = `
        <div class="diagnosis-box is-success">
          <p class="diagnosis-tag">First-Principles Flow Achieved (${m.gainRatio.toFixed(1)}x Throughput)</p>
          <p class="diagnosis-text">Deleting unnecessary stations before automating cleared every queue, boosted output to ${Math.round(m.throughput)} cars/hr, and cut cost per car to $${Math.round(m.unitCost).toLocaleString('en-US')}.</p>
        </div>
      `;
    } else {
      diagHtml = `
        <div class="diagnosis-box">
          <p class="diagnosis-tag">Factory Floor Status</p>
          <p class="diagnosis-text">${
            !state.questioned
              ? 'Start with Step 1 to expose bloated legacy stations, or click Step 5 (Automate) early to see what went wrong at Tesla\'s Fremont factory.'
              : m.activeBloat.length > 1
                ? `${m.activeBloat.length} bloated stations remain (highlighted amber). Delete at least 3 before automating.`
                : 'Bloat cleared. Now Simplify, Accelerate, and Automate the remaining essential stations.'
          }</p>
        </div>
      `;
    }
    diagEl.innerHTML = diagHtml;
    drawSvg();
  }

  function handleStep(step) {
    if (step === 'question') {
      state.questioned = true;
    } else if (step === 'delete') {
      const nextBloat = state.stations.find((s) => !s.essential && !s.deleted);
      if (nextBloat) {
        nextBloat.deleted = true;
      } else {
        // If all bloat is deleted, test deleting one essential station to show "add 10% back"
        const testEssential = state.stations.find((s) => s.essential && !s.deleted && s.id === 3);
        if (testEssential) testEssential.deleted = true;
      }
      recheckJam();
    } else if (step === 'simplify') {
      state.simplified = true;
    } else if (step === 'accelerate') {
      state.accelerated = true;
    } else if (step === 'automate') {
      state.automated = true;
      recheckJam();
    }
    renderUI();
  }

  function toggleStation(id) {
    const st = state.stations.find((s) => s.id === id);
    if (!st) return;
    st.deleted = !st.deleted;
    recheckJam();
    renderUI();
  }

  function recheckJam() {
    if (!state.automated) {
      state.jammed = false;
      return;
    }
    const remainingBloat = state.stations.filter((s) => !s.essential && !s.deleted).length;
    state.jammed = remainingBloat >= 2;
  }

  function drawSvg() {
    const m = computeFactoryMetrics();
    const startX = 24;
    const stepW = 110;
    const railY = 122;

    const stationsMarkup = state.stations
      .map((s, idx) => {
        const x = startX + idx * stepW;
        const sec = getStationCycleSec(s);
        const isBroken = s.essential && s.deleted;
        const isBloat = !s.essential && !s.deleted;
        const isBottleneck = m.bottleneck && m.bottleneck.id === s.id && !m.brokenEssentials.length;
        const isJammedNode = state.jammed && isBloat;

        let fill = '#fafaf9';
        let stroke = '#cfcfcc';
        let textCol = '#111111';
        let dash = '';

        if (isBroken) {
          fill = '#fef2f2';
          stroke = '#b91c1c';
          textCol = '#b91c1c';
          dash = 'stroke-dasharray="4 3"';
        } else if (s.deleted) {
          fill = '#ffffff';
          stroke = '#e5e5e3';
          textCol = '#a3a3a0';
          dash = 'stroke-dasharray="4 3"';
        } else if (isJammedNode) {
          fill = '#fef2f2';
          stroke = '#b91c1c';
          textCol = '#b91c1c';
        } else if (isBottleneck) {
          fill = '#eff4ff';
          stroke = '#1d4ed8';
        } else if (state.questioned && isBloat) {
          fill = '#fffbeb';
          stroke = '#d97706';
        }

        const badge = isBroken
          ? 'BROKEN'
          : s.deleted
            ? 'BYPASSED'
            : isJammedNode
              ? 'ROBOT JAM'
              : isBottleneck
                ? 'BOTTLENECK'
                : state.automated
                  ? 'ROBOT'
                  : 'MANUAL';

        const barRatio = s.deleted ? 0 : Math.min(1, sec / 46);

        return `
          <g transform="translate(${x}, 22)">
            <rect width="98" height="72" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="${isBottleneck || isJammedNode ? 2 : 1}" ${dash} />
            <text x="8" y="18" font-family="JetBrains Mono, monospace" font-size="10" fill="${isJammedNode || isBroken ? '#b91c1c' : isBottleneck ? '#1d4ed8' : '#737370'}">${badge}</text>
            <text x="8" y="36" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="${textCol}">${s.name.length > 14 ? s.name.slice(0, 13) + '.' : s.name}</text>
            <text x="8" y="52" font-family="JetBrains Mono, monospace" font-size="11" fill="${textCol}">${s.deleted ? '0s' : `${sec.toFixed(0)}s cycle`}</text>
            <rect x="8" y="60" width="82" height="5" rx="2" fill="#e5e5e3" />
            <rect x="8" y="60" width="${(82 * barRatio).toFixed(1)}" height="5" rx="2" fill="${isJammedNode ? '#b91c1c' : isBottleneck ? '#1d4ed8' : '#555555'}" />
          </g>
        `;
      })
      .join('');

    const unitsMarkup = state.units
      .map((u) => {
        const unitFill = m.brokenEssentials.length
          ? '#a3a3a0'
          : state.jammed
            ? '#b91c1c'
            : state.automated
              ? '#15803d'
              : '#1d4ed8';
        return `<rect x="${u.x.toFixed(1)}" y="${railY - 11}" width="22" height="22" rx="3" fill="${unitFill}" />`;
      })
      .join('');

    const jamOverlay = state.jammed
      ? `<rect x="24" y="156" width="872" height="44" rx="4" fill="#fef2f2" stroke="#fecaca" />
         <text x="460" y="183" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600" fill="#b91c1c">
           CONVEYOR JAMMED: ROBOTS STALLED ON UNNEEDED STATIONS (DELETE THEM TO CLEAR)
         </text>`
      : m.brokenEssentials.length
        ? `<rect x="24" y="156" width="872" height="44" rx="4" fill="#fef2f2" stroke="#fecaca" />
           <text x="460" y="183" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600" fill="#b91c1c">
             LINE HALTED: ESSENTIAL STATION DELETED (ADD 10% BACK TO RESUME)
           </text>`
        : `<text x="24" y="182" font-family="JetBrains Mono, monospace" font-size="12" fill="#555555">
             FLOW: ${Math.round(m.throughput)} UNITS/HR  |  ACTIVE STATIONS: ${m.activeStations.length}/8  |  ${state.automated ? 'AUTOMATED' : 'MANUAL LINE'}
           </text>`;

    svgEl.innerHTML = `
      <!-- Conveyor Rail -->
      <line x1="20" y1="${railY}" x2="900" y2="${railY}" stroke="#cfcfcc" stroke-width="4" />
      <line x1="20" y1="${railY}" x2="900" y2="${railY}" stroke="#e5e5e3" stroke-width="1" stroke-dasharray="10 8" />
      ${stationsMarkup}
      ${unitsMarkup}
      ${jamOverlay}
    `;
  }

  function tick(ts) {
    if (!visible) return;
    if (!lastTime) lastTime = ts;
    const dt = Math.min(0.05, (ts - lastTime) / 1000);
    lastTime = ts;

    const m = computeFactoryMetrics();
    if (m.brokenEssentials.length === 0) {
      // Visual conveyor speed proportional to throughput
      const speedPx = state.jammed ? 16 : Math.max(30, m.throughput * 0.95);
      state.units.forEach((u, idx) => {
        if (state.jammed) {
          // Cluster and jitter around station 2-3 (Fiberglass Mat)
          const targetX = 170 + (idx % 5) * 26;
          if (u.x > targetX - 4 && u.x < targetX + 120) {
            u.x += Math.sin(ts / 140 + idx) * 0.5;
          } else {
            u.x += speedPx * dt;
          }
        } else {
          u.x += speedPx * dt;
        }
        if (u.x > 896) u.x = 22;
      });
      drawSvg();
    }

    rafId = requestAnimationFrame(tick);
  }

  resetBtn.addEventListener('click', () => {
    state = createInitialState();
    renderUI();
  });

  renderUI();

  return {
    setVisible(isVis) {
      visible = isVis;
      if (visible && !rafId) {
        lastTime = 0;
        rafId = requestAnimationFrame(tick);
      } else if (!visible && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };
}
