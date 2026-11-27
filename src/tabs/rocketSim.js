const PROPELLANTS = {
  methalox: { label: 'Methalox (CH4 / LOX) — 355s Isp', isp: 355, costPerKg: 0.35 },
  kerolox: { label: 'Kerolox (RP-1 / LOX) — 315s Isp', isp: 315, costPerKg: 0.45 },
  hydrolox: { label: 'Hydrolox (LH2 / LOX) — 435s Isp', isp: 435, costPerKg: 2.1 }
};

const G0 = 9.80665;
const DELTA_V_LEO = 9300; // m/s including gravity & drag losses
const GROSS_LIFTOFF_KG = 1500000; // 1,500-tonne heavy-lift class
const VEHICLE_BUILD_COST = 120000000; // $120M vehicle manufacturing cost
const LEGACY_PRECEDENT_PER_KG = 18500; // By-analogy expendable aerospace benchmark

function solveRocket(reuses, massRatio, propKey) {
  const prop = PROPELLANTS[propKey] || PROPELLANTS.methalox;
  const stageDv = DELTA_V_LEO / 2; // 2-stage orbital architecture
  const reqStageR = Math.exp(stageDv / (prop.isp * G0));
  const structuralFrac = 1 / (1 + massRatio);
  const stagePayloadRatio = Math.max(0, (1 - structuralFrac * reqStageR) / reqStageR);
  const totalPayloadFrac = stagePayloadRatio * stagePayloadRatio;

  const payloadKg = GROSS_LIFTOFF_KG * totalPayloadFrac;
  const propellantKg = GROSS_LIFTOFF_KG * (1 - totalPayloadFrac) * (massRatio / (1 + massRatio));

  const propCostPerFlight = propellantKg * prop.costPerKg;
  const refurbPerFlight = 350000 + 1400000 / Math.sqrt(reuses);
  const hardwarePerFlight = VEHICLE_BUILD_COST / reuses;
  const totalFlightCost = hardwarePerFlight + refurbPerFlight + propCostPerFlight;

  const costPerKg = payloadKg > 50 ? totalFlightCost / payloadKg : Infinity;
  const propFloorPerKg = payloadKg > 50 ? propCostPerKg / payloadKg : Infinity;
  const propSharePct = totalFlightCost > 0 ? (propCostPerKg / totalFlightCost) * 100 : 0;

  return {
    prop,
    payloadKg,
    totalPayloadFrac,
    propellantKg,
    propCostPerFlight,
    hardwarePerFlight,
    refurbPerFlight,
    totalFlightCost,
    costPerKg,
    propFloorPerKg,
    propSharePct
  };
}

function formatUsdKg(val) {
  if (!Number.isFinite(val)) return 'No Orbit';
  if (val >= 1000) return `$${Math.round(val).toLocaleString('en-US')}/kg`;
  if (val >= 10) return `$${val.toFixed(0)}/kg`;
  return `$${val.toFixed(1)}/kg`;
}

function buildLogChartSvg(reuses, massRatio, propKey, current) {
  const W = 680;
  const H = 310;
  const padL = 68;
  const padR = 24;
  const padT = 26;
  const padB = 46;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const minLogY = Math.log10(5); // $5/kg
  const maxLogY = Math.log10(100000); // $100,000/kg

  const xForReuse = (n) => {
    const ratio = (Math.log10(n) - Math.log10(1)) / (Math.log10(100) - Math.log10(1));
    return padL + ratio * plotW;
  };

  const yForCost = (c) => {
    const clamped = Math.max(5, Math.min(100000, c));
    const ratio = (Math.log10(clamped) - minLogY) / (maxLogY - minLogY);
    return padT + plotH * (1 - ratio);
  };

  const yTicks = [10, 100, 1000, 10000, 100000];
  const xTicks = [1, 2, 5, 10, 25, 50, 100];

  const gridY = yTicks
    .map((v) => {
      const y = yForCost(v);
      return `
        <line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="#e5e5e3" stroke-width="1" />
        <text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="11" fill="#555555">$${v >= 1000 ? `${v / 1000}k` : v}</text>
      `;
    })
    .join('');

  const gridX = xTicks
    .map((n) => {
      const x = xForReuse(n);
      return `
        <line x1="${x.toFixed(1)}" y1="${padT}" x2="${x.toFixed(1)}" y2="${H - padB}" stroke="#f0f0ee" stroke-width="1" />
        <text x="${x.toFixed(1)}" y="${H - padB + 18}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#555555">${n}x</text>
      `;
    })
    .join('');

  // By-analogy precedent band ($12k - $54k/kg)
  const bandTop = yForCost(54000);
  const bandBot = yForCost(12000);

  // Build curve points
  const sampleNs = [1, 1.5, 2, 3, 4, 5, 7, 10, 15, 20, 30, 45, 65, 85, 100];
  let pathD = '';
  let validCurve = Number.isFinite(current.costPerKg);

  if (validCurve) {
    pathD = sampleNs
      .map((n, idx) => {
        const res = solveRocket(n, massRatio, propKey);
        const x = xForReuse(n);
        const y = yForCost(res.costPerKg);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }

  const propY = validCurve ? yForCost(current.propFloorPerKg) : yForCost(20);
  const curX = xForReuse(reuses);
  const curY = validCurve ? yForCost(current.costPerKg) : padT + plotH / 2;

  return `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Logarithmic chart of launch cost per kilogram to orbit versus vehicle reuse count">
      ${gridY}
      ${gridX}

      <!-- By-analogy precedent band -->
      <rect x="${padL}" y="${bandTop.toFixed(1)}" width="${plotW}" height="${(bandBot - bandTop).toFixed(1)}" fill="#fef2f2" opacity="0.9" />
      <line x1="${padL}" y1="${yForCost(LEGACY_PRECEDENT_PER_KG).toFixed(1)}" x2="${W - padR}" y2="${yForCost(LEGACY_PRECEDENT_PER_KG).toFixed(1)}" stroke="#b91c1c" stroke-width="1.2" stroke-dasharray="5 4" />
      <text x="${W - padR - 6}" y="${(bandTop + 14).toFixed(1)}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="11" fill="#b91c1c">By-Analogy Precedent ($12k-$54k/kg)</text>

      <!-- Propellant physics floor -->
      ${
        validCurve
          ? `<line x1="${padL}" y1="${propY.toFixed(1)}" x2="${W - padR}" y2="${propY.toFixed(1)}" stroke="#15803d" stroke-width="1.3" stroke-dasharray="4 3" />
             <text x="${W - padR - 6}" y="${(propY - 6).toFixed(1)}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="11" fill="#15803d">Propellant Physics Floor (${formatUsdKg(current.propFloorPerKg)})</text>`
          : ''
      }

      <!-- Physics-up reuse curve -->
      ${
        validCurve
          ? `<path d="${pathD}" fill="none" stroke="#1d4ed8" stroke-width="2.6" />
             <line x1="${curX.toFixed(1)}" y1="${curY.toFixed(1)}" x2="${curX.toFixed(1)}" y2="${H - padB}" stroke="#1d4ed8" stroke-width="1" stroke-dasharray="3 3" />
             <circle cx="${curX.toFixed(1)}" cy="${curY.toFixed(1)}" r="6" fill="#1d4ed8" stroke="#ffffff" stroke-width="2" />
             <rect x="${Math.min(W - 148, Math.max(padL + 6, curX - 58)).toFixed(1)}" y="${Math.max(padT + 4, curY - 34).toFixed(1)}" width="116" height="24" rx="3" fill="#111111" />
             <text x="${Math.min(W - 90, Math.max(padL + 64, curX)).toFixed(1)}" y="${Math.max(padT + 20, curY - 18).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" fill="#ffffff">${formatUsdKg(current.costPerKg)}</text>`
          : `<text x="${padL + plotW / 2}" y="${padT + plotH / 2}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="#b91c1c">Mass ratio too low to reach LEO (increase ratio or Isp)</text>`
      }

      <!-- Axes Labels -->
      <text x="${padL + plotW / 2}" y="${H - 8}" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="#555555">Flights per Vehicle (Reuse Count, log scale)</text>
      <text x="16" y="${padT + plotH / 2}" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="#555555" transform="rotate(-90 16 ${padT + plotH / 2})">USD / kg to LEO (log)</text>
    </svg>
  `;
}

export function initRocketSim(container) {
  let reuses = 1;
  let massRatio = 12.5;
  let propKey = 'methalox';

  container.innerHTML = `
    <div class="section-head">
      <div>
        <h2>Physics-Up vs By-Analogy Orbit Simulator</h2>
        <p class="section-lead">Drag reuse count from 1 (expendable precedent) to 100 flights and watch $/kg to orbit collapse toward the propellant physics floor.</p>
      </div>
    </div>

    <div class="preset-row" id="rk-presets" role="group" aria-label="Reusability presets">
      <button type="button" class="pill-btn" data-reuse="1">1 Flight (Expendable)</button>
      <button type="button" class="pill-btn" data-reuse="10">10 Flights (Early Reuse)</button>
      <button type="button" class="pill-btn" data-reuse="50">50 Flights (Fleet)</button>
      <button type="button" class="pill-btn" data-reuse="100">100 Flights (Airline-Like)</button>
    </div>

    <div class="grid-2 visual-wide">
      <div class="card card-white">
        <div class="kpi-grid cols-4" id="rk-kpis"></div>
        <div class="chart-wrap" id="rk-chart"></div>
        <div id="rk-diagnosis"></div>
      </div>

      <div class="card">
        <h3 class="card-title">Vehicle Physics Controls</h3>
        <p class="card-copy">Adjust reuse count, fuel-to-dry mass ratio, and propellant chemistry.</p>

        <div class="field-group">
          <label class="field-label" for="rk-reuse">
            <span>Reuse Count (Flights / Vehicle)</span>
            <span class="field-value" id="rk-reuse-val">1 flight</span>
          </label>
          <input type="range" id="rk-reuse" min="1" max="100" step="1" value="1" />
        </div>

        <div class="field-group">
          <label class="field-label" for="rk-ratio">
            <span>Propellant / Dry-Mass Ratio</span>
            <span class="field-value" id="rk-ratio-val">12.5 : 1</span>
          </label>
          <input type="range" id="rk-ratio" min="5" max="18" step="0.5" value="12.5" />
        </div>

        <div class="field-group">
          <label class="field-label" for="rk-prop">
            <span>Propellant Chemistry (Isp)</span>
          </label>
          <select id="rk-prop">
            ${Object.entries(PROPELLANTS)
              .map(([k, v]) => `<option value="${k}">${v.label}</option>`)
              .join('')}
          </select>
        </div>

        <div class="kpi-grid" id="rk-breakdown" style="margin-top:14px; margin-bottom:0;"></div>
      </div>
    </div>

    <details class="theory-drawer">
      <summary>Tsiolkovsky Equation &amp; Why Reuse Changes Everything</summary>
      <div class="drawer-body">
        <div class="equation-block">Delta-v = Isp * g0 * ln(m0 / mf)   |   $/kg = (C_vehicle / N + C_refurb + C_propellant) / m_payload</div>
        <p>By analogy, rockets were priced like disposable aerospace hardware ($12,000-$54,000/kg to LEO). From first principles, propellant is less than 1% of a rocket's build cost.</p>
        <p>Once a rocket survives 100 flights like a commercial airliner, hardware amortization shrinks 100x and launch pricing converges on fuel cost plus turnaround ops.</p>
      </div>
    </details>
  `;

  const presetsEl = container.querySelector('#rk-presets');
  const kpisEl = container.querySelector('#rk-kpis');
  const chartEl = container.querySelector('#rk-chart');
  const diagEl = container.querySelector('#rk-diagnosis');
  const breakdownEl = container.querySelector('#rk-breakdown');
  const reuseInput = container.querySelector('#rk-reuse');
  const reuseValEl = container.querySelector('#rk-reuse-val');
  const ratioInput = container.querySelector('#rk-ratio');
  const ratioValEl = container.querySelector('#rk-ratio-val');
  const propSelect = container.querySelector('#rk-prop');

  function render() {
    const res = solveRocket(reuses, massRatio, propKey);
    const valid = Number.isFinite(res.costPerKg);
    const vsPrecedent = valid ? LEGACY_PRECEDENT_PER_KG / res.costPerKg : 0;

    reuseInput.value = reuses;
    reuseValEl.textContent = `${reuses} ${reuses === 1 ? 'flight' : 'flights'}`;
    ratioInput.value = massRatio;
    ratioValEl.textContent = `${massRatio.toFixed(1)} : 1`;
    propSelect.value = propKey;

    presetsEl.querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('is-active', Number(btn.dataset.reuse) === reuses);
    });

    const costTone = !valid ? 'is-danger' : res.costPerKg < 150 ? 'is-success' : res.costPerKg < 1000 ? 'is-accent' : '';

    kpisEl.innerHTML = `
      <div class="kpi-box ${costTone}">
        <span class="kpi-label">Cost to LEO</span>
        <span class="kpi-value">${formatUsdKg(res.costPerKg)}</span>
        <span class="kpi-sub">Precedent: $18.5k/kg</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-label">Vs Precedent</span>
        <span class="kpi-value">${valid ? `${vsPrecedent.toFixed(0)}x` : '—'}</span>
        <span class="kpi-sub">cheaper per kg</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-label">Payload to LEO</span>
        <span class="kpi-value">${res.payloadKg > 50 ? `${(res.payloadKg / 1000).toFixed(1)} t` : '0 t'}</span>
        <span class="kpi-sub">${(res.totalPayloadFrac * 100).toFixed(2)}% of GLOW</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-label">Propellant Share</span>
        <span class="kpi-value">${valid ? `${res.propSharePct.toFixed(1)}%` : '—'}</span>
        <span class="kpi-sub">Floor: ${formatUsdKg(res.propFloorPerKg)}</span>
      </div>
    `;

    breakdownEl.innerHTML = `
      <div class="kpi-box">
        <span class="kpi-label">Hardware / Flight</span>
        <span class="kpi-value">$${(res.hardwarePerFlight / 1e6).toFixed(2)}M</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-label">Propellant / Flight</span>
        <span class="kpi-value">$${(res.propCostPerFlight / 1e6).toFixed(2)}M</span>
      </div>
    `;

    chartEl.innerHTML = buildLogChartSvg(reuses, massRatio, propKey, res);

    if (!valid) {
      diagEl.innerHTML = `
        <div class="diagnosis-box is-danger">
          <p class="diagnosis-tag">Tsiolkovsky Limit Reached</p>
          <p class="diagnosis-text">At ${massRatio.toFixed(1)}:1 mass ratio and ${res.prop.isp}s Isp, structural mass consumes the entire orbital budget. Raise mass ratio or Isp.</p>
        </div>
      `;
    } else if (reuses === 1) {
      diagEl.innerHTML = `
        <div class="diagnosis-box is-warn">
          <p class="diagnosis-tag">Expendable Trap (Propellant is ${res.propSharePct.toFixed(2)}% of Cost)</p>
          <p class="diagnosis-text">Throwing away a $120M booster after one flight leaves cost at ${formatUsdKg(res.costPerKg)} even though fuel costs only ${formatUsdKg(res.propFloorPerKg)}.</p>
        </div>
      `;
    } else if (reuses >= 50) {
      diagEl.innerHTML = `
        <div class="diagnosis-box is-success">
          <p class="diagnosis-tag">Airline Economics (${vsPrecedent.toFixed(0)}x Below Precedent)</p>
          <p class="diagnosis-text">At ${reuses} flights, hardware amortization collapses to $${(res.hardwarePerFlight / 1e6).toFixed(2)}M/launch and propellant climbs to ${res.propSharePct.toFixed(1)}% of flight cost.</p>
        </div>
      `;
    } else {
      diagEl.innerHTML = `
        <div class="diagnosis-box">
          <p class="diagnosis-tag">Partial Amortization (${reuses} Flights)</p>
          <p class="diagnosis-text">Cost drops to ${formatUsdKg(res.costPerKg)} (${vsPrecedent.toFixed(0)}x below expendable precedent). Keep pushing reuse toward 100 flights to approach the fuel floor.</p>
        </div>
      `;
    }
  }

  presetsEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      reuses = Number(btn.dataset.reuse);
      render();
    });
  });

  reuseInput.addEventListener('input', (e) => {
    reuses = Number(e.target.value);
    render();
  });

  ratioInput.addEventListener('input', (e) => {
    massRatio = Number(e.target.value);
    render();
  });

  propSelect.addEventListener('change', (e) => {
    propKey = e.target.value;
    render();
  });

  render();
}
