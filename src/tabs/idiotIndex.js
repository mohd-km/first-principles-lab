const PRESETS = [
  {
    id: 'starship-steel',
    label: 'Starship 304L Steel Hull',
    category: 'Aerospace',
    finishedPrice: 960000,
    note: 'Switching from carbon fiber to rolled 304L stainless steel cut raw material cost ~45x and enabled outdoor ring welding.',
    items: [
      { name: '304L Stainless Steel Coils', massKg: 100000, pricePerKg: 3.0 },
      { name: 'Cryo Weld Wire & Flanges', massKg: 1500, pricePerKg: 14.0 }
    ]
  },
  {
    id: 'carbon-hull',
    label: 'Carbon-Fiber Rocket Hull',
    category: 'Aerospace',
    finishedPrice: 26800000,
    note: 'Autoclave prepreg tooling, scrap rates, and slow cure cycles push carbon-fiber hulls to ~10x raw cost and ~28x steel.',
    items: [
      { name: 'Aerospace Carbon Prepreg', massKg: 52000, pricePerKg: 48.0 },
      { name: 'Epoxy Resin & Honeycomb Core', massKg: 8000, pricePerKg: 22.0 }
    ]
  },
  {
    id: 'hydraulic-valve',
    label: 'Aerospace Hydraulic Valve',
    category: 'SpaceX Classic',
    finishedPrice: 12000,
    note: 'Legacy catalog valve priced at $12,000 for $9 of metal. In-house machining and industrial valve adaptation cut cost >20x.',
    items: [
      { name: '6061-T6 Aluminum Billet', massKg: 0.8, pricePerKg: 4.5 },
      { name: '316 Stainless Spool', massKg: 0.4, pricePerKg: 11.0 },
      { name: 'Fluoroelastomer Seals', massKg: 0.05, pricePerKg: 20.0 }
    ]
  },
  {
    id: 'ev-battery',
    label: 'EV Battery Pack (75 kWh)',
    category: 'Automotive',
    finishedPrice: 18500,
    note: 'Tier-1 module markups inflate pack cost. Dry-electrode coating and structural cell-to-pack drive the index toward 1.8x.',
    items: [
      { name: 'Lithium Carbonate', massKg: 63, pricePerKg: 14.0 },
      { name: 'Nickel & Cathode Precursor', massKg: 145, pricePerKg: 18.0 },
      { name: 'Synthetic Graphite', massKg: 95, pricePerKg: 8.5 },
      { name: 'Aluminum & Copper Foils', massKg: 115, pricePerKg: 6.8 }
    ]
  },
  {
    id: 'solar-inverter',
    label: 'Solar Inverter (10 kW)',
    category: 'Energy',
    finishedPrice: 3100,
    note: 'Retail channel layers and discrete power stages inflate cost >10x. Integrated silicon-carbide modules cut BOM and assembly.',
    items: [
      { name: 'Power Silicon & PCB', massKg: 2.5, pricePerKg: 65.0 },
      { name: 'Copper Magnetics', massKg: 7.5, pricePerKg: 9.8 },
      { name: 'Extruded Aluminum Heatsink', massKg: 12.0, pricePerKg: 3.2 }
    ]
  },
  {
    id: 'custom',
    label: 'Custom BOM',
    category: 'Custom',
    finishedPrice: 480,
    note: 'Enter your own raw commodities and market quote to measure how much margin sits above the physics floor.',
    items: [
      { name: 'Aluminum Housing', massKg: 5.0, pricePerKg: 3.5 },
      { name: 'Copper Winding', massKg: 2.2, pricePerKg: 9.8 },
      { name: 'Steel Fasteners', massKg: 1.5, pricePerKg: 2.2 }
    ]
  }
];

function formatMoney(n) {
  if (!Number.isFinite(n)) return '$0';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e4) return `$${Math.round(n).toLocaleString('en-US')}`;
  if (n >= 100) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

function formatIndex(idx) {
  if (!Number.isFinite(idx) || idx <= 0) return '—';
  if (idx >= 100) return `${Math.round(idx).toLocaleString('en-US')}x`;
  return `${idx.toFixed(1)}x`;
}

function diagnose(index, rawCost, finishedPrice, presetNote) {
  if (rawCost <= 0) {
    return {
      tone: 'warn',
      tag: 'Add Raw Materials',
      text: 'Add at least one commodity line with positive mass and price to compute the physics floor.'
    };
  }
  const targetPrice = rawCost * 2.2;
  const savings = Math.max(0, finishedPrice - targetPrice);
  if (index <= 2.2) {
    return {
      tone: 'success',
      tag: 'Physics-Tight (< 2.2x)',
      text: 'Cost is already close to commodity metal. Further savings require changing the material or physics architecture itself.'
    };
  }
  if (index <= 5.0) {
    return {
      tone: 'accent',
      tag: 'Manufacturable (2.2x - 5x)',
      text: `Reasonable industrial multiple, with ~${formatMoney(savings)} of vertical integration and tooling upside remaining. ${presetNote || ''}`.trim()
    };
  }
  if (index <= 15.0) {
    return {
      tone: 'warn',
      tag: 'High Arbitrage (5x - 15x)',
      text: `Supplier markups and slow process steps dominate cost. Bringing fabrication in-house targets ${formatMoney(targetPrice)} (a ${(index / 2.2).toFixed(1)}x cut).`
    };
  }
  return {
    tone: 'danger',
    tag: 'Extreme Idiot Index (> 15x)',
    text: `Market price is ${formatIndex(index)} raw material value. Redesign from off-the-shelf industrial hardware or machine in-house to cut cost 5x-20x.`
  };
}

function buildBarChartSvg(rawCost, finishedPrice, index) {
  const safeRaw = Math.max(rawCost, 0.01);
  const safeFin = Math.max(finishedPrice, 0.01);
  const maxVal = Math.max(safeRaw, safeFin);
  const useLog = index > 20;

  const trackW = 460;
  const scale = (val) => {
    if (useLog) {
      const minLog = Math.log10(Math.min(safeRaw, safeFin) * 0.5);
      const maxLog = Math.log10(maxVal * 1.15);
      const ratio = (Math.log10(val) - minLog) / Math.max(0.1, maxLog - minLog);
      return Math.max(10, Math.min(trackW, ratio * trackW));
    }
    return Math.max(6, (val / maxVal) * trackW);
  };

  const rawW = scale(safeRaw);
  const finW = scale(safeFin);
  const targetCost = safeRaw * 2.2;
  const targetX = 140 + Math.min(trackW, scale(targetCost));

  return `
    <svg viewBox="0 0 640 168" role="img" aria-label="Physics floor versus market price comparison chart">
      <text x="140" y="18" font-family="JetBrains Mono, monospace" font-size="11" fill="#555555">
        ${useLog ? 'LOG SCALE (INDEX > 20x)' : 'LINEAR SCALE (USD)'}
      </text>

      <!-- Physics Floor Row -->
      <text x="0" y="54" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#111111">Physics Floor</text>
      <text x="0" y="70" font-family="JetBrains Mono, monospace" font-size="11" fill="#555555">Raw commodities</text>
      <rect x="140" y="38" width="${trackW}" height="32" rx="3" fill="#f4f4f2" stroke="#e5e5e3" />
      <rect x="140" y="38" width="${rawW.toFixed(1)}" height="32" rx="3" fill="#1d4ed8" />
      <text x="${Math.min(608, 148 + rawW).toFixed(1)}" y="59" font-family="JetBrains Mono, monospace" font-size="12" font-weight="600" fill="#111111">${formatMoney(rawCost)}</text>

      <!-- Market Price Row -->
      <text x="0" y="114" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#111111">Market Price</text>
      <text x="0" y="130" font-family="JetBrains Mono, monospace" font-size="11" fill="#555555">Finished component</text>
      <rect x="140" y="98" width="${trackW}" height="32" rx="3" fill="#f4f4f2" stroke="#e5e5e3" />
      <rect x="140" y="98" width="${finW.toFixed(1)}" height="32" rx="3" fill="${index > 15 ? '#b91c1c' : index > 5 ? '#b45309' : '#111111'}" />
      <text x="${Math.min(545, 148 + finW).toFixed(1)}" y="119" font-family="JetBrains Mono, monospace" font-size="12" font-weight="600" fill="${finW > 380 ? '#ffffff' : '#111111'}" text-anchor="${finW > 380 ? 'end' : 'start'}" dx="${finW > 380 ? '-16' : '0'}">${formatMoney(finishedPrice)}</text>

      <!-- 2.2x First-Principles Target Line -->
      ${
        finishedPrice > targetCost
          ? `<line x1="${targetX.toFixed(1)}" y1="28" x2="${targetX.toFixed(1)}" y2="142" stroke="#15803d" stroke-width="1.5" stroke-dasharray="4 3" />
             <text x="${Math.min(520, targetX + 6).toFixed(1)}" y="156" font-family="JetBrains Mono, monospace" font-size="11" fill="#15803d">2.2x target: ${formatMoney(targetCost)}</text>`
          : `<text x="140" y="156" font-family="JetBrains Mono, monospace" font-size="11" fill="#15803d">Already at or below 2.2x physics-tight target</text>`
      }
    </svg>
  `;
}

export function initIdiotIndex(container) {
  let activePresetId = PRESETS[0].id;
  let componentName = PRESETS[0].label;
  let finishedPrice = PRESETS[0].finishedPrice;
  let presetNote = PRESETS[0].note;
  let items = PRESETS[0].items.map((item) => ({ ...item }));

  container.innerHTML = `
    <div class="section-head">
      <div>
        <h2>The Idiot Index Calculator</h2>
        <p class="section-lead">Compare a finished component's market price against the spot value of its raw atoms. High ratios reveal where vertical integration or redesign unlocks 5x-10x cuts.</p>
      </div>
      <button type="button" class="btn btn-primary" id="ii-download">Download Teardown (.md)</button>
    </div>

    <div class="preset-row" id="ii-presets" role="group" aria-label="Component presets"></div>

    <div class="grid-2">
      <div class="card">
        <h3 class="card-title">Bill of Materials (Raw Physics Floor)</h3>
        <p class="card-copy">Edit any material mass, commodity price, or finished component quote below.</p>

        <div class="bom-num-pair" style="margin-bottom: 14px;">
          <div class="field-group" style="margin-bottom:0;">
            <label class="mini-label" for="ii-name">Component Name</label>
            <input type="text" id="ii-name" />
          </div>
          <div class="field-group" style="margin-bottom:0;">
            <label class="mini-label" for="ii-finished">Finished Market Price ($)</label>
            <input type="number" id="ii-finished" min="0" step="any" />
          </div>
        </div>

        <div class="bom-list" id="ii-bom-list"></div>

        <div class="action-bar">
          <button type="button" class="btn btn-sm" id="ii-add-row">+ Add Material Row</button>
          <button type="button" class="btn btn-sm" id="ii-compare-steel">Compare Steel vs Carbon</button>
        </div>
      </div>

      <div class="card card-white">
        <div class="kpi-grid cols-3" id="ii-kpis"></div>
        <div class="chart-wrap" id="ii-chart"></div>
        <div id="ii-diagnosis"></div>
      </div>
    </div>

    <details class="theory-drawer">
      <summary>Theory &amp; Formula — Why the Idiot Index Works</summary>
      <div class="drawer-body">
        <div class="equation-block">Idiot Index = Finished Component Price / Sum(Material Mass_i * Spot Commodity Price_i)</div>
        <p>In Walter Isaacson's <em>Elon Musk</em>, the Idiot Index is SpaceX's shortcut for spotting design bloat and aerospace supplier markups. If a part costs 10x to 1,000x its raw aluminum, steel, or silicon, physics is not the bottleneck — the manufacturing process or supply chain is.</p>
        <p>Starship's switch from $135/kg aerospace carbon-fiber prepreg to $3/kg 304L stainless steel lowered both the raw commodity floor and the fabrication multiple simultaneously.</p>
      </div>
    </details>
  `;

  const presetsEl = container.querySelector('#ii-presets');
  const nameInput = container.querySelector('#ii-name');
  const finishedInput = container.querySelector('#ii-finished');
  const bomListEl = container.querySelector('#ii-bom-list');
  const kpisEl = container.querySelector('#ii-kpis');
  const chartEl = container.querySelector('#ii-chart');
  const diagnosisEl = container.querySelector('#ii-diagnosis');
  const addRowBtn = container.querySelector('#ii-add-row');
  const downloadBtn = container.querySelector('#ii-download');
  const compareBtn = container.querySelector('#ii-compare-steel');

  function loadPreset(presetId) {
    const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[0];
    activePresetId = preset.id;
    componentName = preset.label;
    finishedPrice = preset.finishedPrice;
    presetNote = preset.note;
    items = preset.items.map((item) => ({ ...item }));
    renderAll();
  }

  function computeMetrics() {
    const totalMass = items.reduce((sum, it) => sum + Math.max(0, Number(it.massKg) || 0), 0);
    const rawCost = items.reduce(
      (sum, it) => sum + Math.max(0, Number(it.massKg) || 0) * Math.max(0, Number(it.pricePerKg) || 0),
      0
    );
    const fin = Math.max(0, Number(finishedPrice) || 0);
    const index = rawCost > 0 ? fin / rawCost : 0;
    return { totalMass, rawCost, fin, index };
  }

  function renderPresets() {
    presetsEl.innerHTML = PRESETS.map(
      (p) =>
        `<button type="button" class="pill-btn ${p.id === activePresetId ? 'is-active' : ''}" data-preset="${p.id}">${p.label}</button>`
    ).join('');

    presetsEl.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => loadPreset(btn.dataset.preset));
    });
  }

  function renderBomRows() {
    nameInput.value = componentName;
    finishedInput.value = finishedPrice;

    bomListEl.innerHTML = items
      .map(
        (item, idx) => `
        <div class="bom-row" data-row="${idx}">
          <div class="bom-row-fields">
            <div>
              <label class="mini-label" for="ii-mat-${idx}">Material</label>
              <input type="text" id="ii-mat-${idx}" data-field="name" value="${item.name.replace(/"/g, '&quot;')}" />
            </div>
            <div class="bom-num-pair">
              <div>
                <label class="mini-label" for="ii-mass-${idx}">Mass (kg)</label>
                <input type="number" id="ii-mass-${idx}" data-field="massKg" min="0" step="any" value="${item.massKg}" />
              </div>
              <div>
                <label class="mini-label" for="ii-price-${idx}">Spot ($/kg)</label>
                <input type="number" id="ii-price-${idx}" data-field="pricePerKg" min="0" step="any" value="${item.pricePerKg}" />
              </div>
            </div>
          </div>
          <button type="button" class="icon-remove" data-remove="${idx}" aria-label="Remove material row" title="Remove row">x</button>
        </div>
      `
      )
      .join('');

    bomListEl.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const rowEl = e.target.closest('.bom-row');
        const idx = Number(rowEl.dataset.row);
        const field = e.target.dataset.field;
        if (field === 'name') {
          items[idx].name = e.target.value;
        } else {
          items[idx][field] = parseFloat(e.target.value) || 0;
        }
        renderOutputs();
      });
    });

    bomListEl.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.remove);
        if (items.length > 1) {
          items.splice(idx, 1);
          renderBomRows();
          renderOutputs();
        }
      });
    });
  }

  function renderOutputs() {
    const { totalMass, rawCost, fin, index } = computeMetrics();
    const diag = diagnose(index, rawCost, fin, presetNote);
    const indexClass =
      index > 15 ? 'is-danger' : index > 5 ? '' : index > 0 && index <= 2.2 ? 'is-success' : 'is-accent';

    kpisEl.innerHTML = `
      <div class="kpi-box ${indexClass}">
        <span class="kpi-label">Idiot Index</span>
        <span class="kpi-value">${formatIndex(index)}</span>
        <span class="kpi-sub">Finished / Raw</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-label">Physics Floor</span>
        <span class="kpi-value">${formatMoney(rawCost)}</span>
        <span class="kpi-sub">${totalMass.toLocaleString('en-US', { maximumFractionDigits: 1 })} kg raw</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-label">Market Price</span>
        <span class="kpi-value">${formatMoney(fin)}</span>
        <span class="kpi-sub">${rawCost > 0 ? `${formatMoney(Math.max(0, fin - rawCost))} markup` : '—'}</span>
      </div>
    `;

    chartEl.innerHTML = buildBarChartSvg(rawCost, fin, index);

    diagnosisEl.innerHTML = `
      <div class="diagnosis-box is-${diag.tone}">
        <p class="diagnosis-tag">${diag.tag}</p>
        <p class="diagnosis-text">${diag.text}</p>
      </div>
    `;
  }

  function renderAll() {
    renderPresets();
    renderBomRows();
    renderOutputs();
  }

  nameInput.addEventListener('input', (e) => {
    componentName = e.target.value;
  });

  finishedInput.addEventListener('input', (e) => {
    finishedPrice = parseFloat(e.target.value) || 0;
    renderOutputs();
  });

  addRowBtn.addEventListener('click', () => {
    items.push({ name: 'New Commodity', massKg: 10, pricePerKg: 5.0 });
    renderBomRows();
    renderOutputs();
  });

  compareBtn.addEventListener('click', () => {
    loadPreset(activePresetId === 'starship-steel' ? 'carbon-hull' : 'starship-steel');
  });

  downloadBtn.addEventListener('click', () => {
    const { totalMass, rawCost, fin, index } = computeMetrics();
    const diag = diagnose(index, rawCost, fin, presetNote);
    const slug = (componentName || 'component')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const rowsMd = items
      .map((it) => {
        const lineCost = (Number(it.massKg) || 0) * (Number(it.pricePerKg) || 0);
        return `| ${it.name} | ${it.massKg} | $${Number(it.pricePerKg).toFixed(2)} | ${formatMoney(lineCost)} |`;
      })
      .join('\n');

    const md = `# Idiot Index Teardown: ${componentName}

Generated by First-Principles Engineering Lab (Mohammed KM)

## Summary
- **Finished Market Price:** ${formatMoney(fin)}
- **Raw Material Physics Floor:** ${formatMoney(rawCost)} (${totalMass.toFixed(2)} kg total)
- **Idiot Index:** ${formatIndex(index)}
- **2.2x First-Principles Target:** ${formatMoney(rawCost * 2.2)}

## Diagnosis — ${diag.tag}
${diag.text}

## Bill of Materials
| Material | Mass (kg) | Spot Price ($/kg) | Line Cost |
| --- | ---: | ---: | ---: |
${rowsMd}

## Formula
\`\`\`
Idiot Index = Finished Component Price / Raw Material Commodity Cost
\`\`\`
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idiot-index-${slug || 'teardown'}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  renderAll();
}
