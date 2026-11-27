(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))n(l);new MutationObserver(l=>{for(const c of l)if(c.type==="childList")for(const w of c.addedNodes)w.tagName==="LINK"&&w.rel==="modulepreload"&&n(w)}).observe(document,{childList:!0,subtree:!0});function p(l){const c={};return l.integrity&&(c.integrity=l.integrity),l.referrerPolicy&&(c.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?c.credentials="include":l.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function n(l){if(l.ep)return;l.ep=!0;const c=p(l);fetch(l.href,c)}})();const O=[{id:"starship-steel",label:"Starship 304L Steel Hull",category:"Aerospace",finishedPrice:96e4,note:"Switching from carbon fiber to rolled 304L stainless steel cut raw material cost ~45x and enabled outdoor ring welding.",items:[{name:"304L Stainless Steel Coils",massKg:1e5,pricePerKg:3},{name:"Cryo Weld Wire & Flanges",massKg:1500,pricePerKg:14}]},{id:"carbon-hull",label:"Carbon-Fiber Rocket Hull",category:"Aerospace",finishedPrice:268e5,note:"Autoclave prepreg tooling, scrap rates, and slow cure cycles push carbon-fiber hulls to ~10x raw cost and ~28x steel.",items:[{name:"Aerospace Carbon Prepreg",massKg:52e3,pricePerKg:48},{name:"Epoxy Resin & Honeycomb Core",massKg:8e3,pricePerKg:22}]},{id:"hydraulic-valve",label:"Aerospace Hydraulic Valve",category:"SpaceX Classic",finishedPrice:12e3,note:"Legacy catalog valve priced at $12,000 for $9 of metal. In-house machining and industrial valve adaptation cut cost >20x.",items:[{name:"6061-T6 Aluminum Billet",massKg:.8,pricePerKg:4.5},{name:"316 Stainless Spool",massKg:.4,pricePerKg:11},{name:"Fluoroelastomer Seals",massKg:.05,pricePerKg:20}]},{id:"ev-battery",label:"EV Battery Pack (75 kWh)",category:"Automotive",finishedPrice:18500,note:"Tier-1 module markups inflate pack cost. Dry-electrode coating and structural cell-to-pack drive the index toward 1.8x.",items:[{name:"Lithium Carbonate",massKg:63,pricePerKg:14},{name:"Nickel & Cathode Precursor",massKg:145,pricePerKg:18},{name:"Synthetic Graphite",massKg:95,pricePerKg:8.5},{name:"Aluminum & Copper Foils",massKg:115,pricePerKg:6.8}]},{id:"solar-inverter",label:"Solar Inverter (10 kW)",category:"Energy",finishedPrice:3100,note:"Retail channel layers and discrete power stages inflate cost >10x. Integrated silicon-carbide modules cut BOM and assembly.",items:[{name:"Power Silicon & PCB",massKg:2.5,pricePerKg:65},{name:"Copper Magnetics",massKg:7.5,pricePerKg:9.8},{name:"Extruded Aluminum Heatsink",massKg:12,pricePerKg:3.2}]},{id:"custom",label:"Custom BOM",category:"Custom",finishedPrice:480,note:"Enter your own raw commodities and market quote to measure how much margin sits above the physics floor.",items:[{name:"Aluminum Housing",massKg:5,pricePerKg:3.5},{name:"Copper Winding",massKg:2.2,pricePerKg:9.8},{name:"Steel Fasteners",massKg:1.5,pricePerKg:2.2}]}];function B(s){return Number.isFinite(s)?s>=1e6?`$${(s/1e6).toFixed(2)}M`:s>=1e4?`$${Math.round(s).toLocaleString("en-US")}`:s>=100?`$${s.toFixed(0)}`:`$${s.toFixed(2)}`:"$0"}function z(s){return!Number.isFinite(s)||s<=0?"—":s>=100?`${Math.round(s).toLocaleString("en-US")}x`:`${s.toFixed(1)}x`}function U(s,e,p,n){if(e<=0)return{tone:"warn",tag:"Add Raw Materials",text:"Add at least one commodity line with positive mass and price to compute the physics floor."};const l=e*2.2,c=Math.max(0,p-l);return s<=2.2?{tone:"success",tag:"Physics-Tight (< 2.2x)",text:"Cost is already close to commodity metal. Further savings require changing the material or physics architecture itself."}:s<=5?{tone:"accent",tag:"Manufacturable (2.2x - 5x)",text:`Reasonable industrial multiple, with ~${B(c)} of vertical integration and tooling upside remaining. ${n||""}`.trim()}:s<=15?{tone:"warn",tag:"High Arbitrage (5x - 15x)",text:`Supplier markups and slow process steps dominate cost. Bringing fabrication in-house targets ${B(l)} (a ${(s/2.2).toFixed(1)}x cut).`}:{tone:"danger",tag:"Extreme Idiot Index (> 15x)",text:`Market price is ${z(s)} raw material value. Redesign from off-the-shelf industrial hardware or machine in-house to cut cost 5x-20x.`}}function Z(s,e,p){const n=Math.max(s,.01),l=Math.max(e,.01),c=Math.max(n,l),w=p>20,b=460,F=S=>{if(w){const g=Math.log10(Math.min(n,l)*.5),o=Math.log10(c*1.15),v=(Math.log10(S)-g)/Math.max(.1,o-g);return Math.max(10,Math.min(b,v*b))}return Math.max(6,S/c*b)},x=F(n),L=F(l),E=n*2.2,k=140+Math.min(b,F(E));return`
    <svg viewBox="0 0 640 168" role="img" aria-label="Physics floor versus market price comparison chart">
      <text x="140" y="18" font-family="JetBrains Mono, monospace" font-size="11" fill="#555555">
        ${w?"LOG SCALE (INDEX > 20x)":"LINEAR SCALE (USD)"}
      </text>

      <!-- Physics Floor Row -->
      <text x="0" y="54" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#111111">Physics Floor</text>
      <text x="0" y="70" font-family="JetBrains Mono, monospace" font-size="11" fill="#555555">Raw commodities</text>
      <rect x="140" y="38" width="${b}" height="32" rx="3" fill="#f4f4f2" stroke="#e5e5e3" />
      <rect x="140" y="38" width="${x.toFixed(1)}" height="32" rx="3" fill="#1d4ed8" />
      <text x="${Math.min(608,148+x).toFixed(1)}" y="59" font-family="JetBrains Mono, monospace" font-size="12" font-weight="600" fill="#111111">${B(s)}</text>

      <!-- Market Price Row -->
      <text x="0" y="114" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="#111111">Market Price</text>
      <text x="0" y="130" font-family="JetBrains Mono, monospace" font-size="11" fill="#555555">Finished component</text>
      <rect x="140" y="98" width="${b}" height="32" rx="3" fill="#f4f4f2" stroke="#e5e5e3" />
      <rect x="140" y="98" width="${L.toFixed(1)}" height="32" rx="3" fill="${p>15?"#b91c1c":p>5?"#b45309":"#111111"}" />
      <text x="${Math.min(545,148+L).toFixed(1)}" y="119" font-family="JetBrains Mono, monospace" font-size="12" font-weight="600" fill="${L>380?"#ffffff":"#111111"}" text-anchor="${L>380?"end":"start"}" dx="${L>380?"-16":"0"}">${B(e)}</text>

      <!-- 2.2x First-Principles Target Line -->
      ${e>E?`<line x1="${k.toFixed(1)}" y1="28" x2="${k.toFixed(1)}" y2="142" stroke="#15803d" stroke-width="1.5" stroke-dasharray="4 3" />
             <text x="${Math.min(520,k+6).toFixed(1)}" y="156" font-family="JetBrains Mono, monospace" font-size="11" fill="#15803d">2.2x target: ${B(E)}</text>`:'<text x="140" y="156" font-family="JetBrains Mono, monospace" font-size="11" fill="#15803d">Already at or below 2.2x physics-tight target</text>'}
    </svg>
  `}function ee(s){let e=O[0].id,p=O[0].label,n=O[0].finishedPrice,l=O[0].note,c=O[0].items.map(a=>({...a}));s.innerHTML=`
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
  `;const w=s.querySelector("#ii-presets"),b=s.querySelector("#ii-name"),F=s.querySelector("#ii-finished"),x=s.querySelector("#ii-bom-list"),L=s.querySelector("#ii-kpis"),E=s.querySelector("#ii-chart"),k=s.querySelector("#ii-diagnosis"),S=s.querySelector("#ii-add-row"),g=s.querySelector("#ii-download"),o=s.querySelector("#ii-compare-steel");function v(a){const i=O.find(r=>r.id===a)||O[0];e=i.id,p=i.label,n=i.finishedPrice,l=i.note,c=i.items.map(r=>({...r})),d()}function P(){const a=c.reduce((m,u)=>m+Math.max(0,Number(u.massKg)||0),0),i=c.reduce((m,u)=>m+Math.max(0,Number(u.massKg)||0)*Math.max(0,Number(u.pricePerKg)||0),0),r=Math.max(0,Number(n)||0),f=i>0?r/i:0;return{totalMass:a,rawCost:i,fin:r,index:f}}function q(){w.innerHTML=O.map(a=>`<button type="button" class="pill-btn ${a.id===e?"is-active":""}" data-preset="${a.id}">${a.label}</button>`).join(""),w.querySelectorAll("button").forEach(a=>{a.addEventListener("click",()=>v(a.dataset.preset))})}function C(){b.value=p,F.value=n,x.innerHTML=c.map((a,i)=>`
        <div class="bom-row" data-row="${i}">
          <div class="bom-row-fields">
            <div>
              <label class="mini-label" for="ii-mat-${i}">Material</label>
              <input type="text" id="ii-mat-${i}" data-field="name" value="${a.name.replace(/"/g,"&quot;")}" />
            </div>
            <div class="bom-num-pair">
              <div>
                <label class="mini-label" for="ii-mass-${i}">Mass (kg)</label>
                <input type="number" id="ii-mass-${i}" data-field="massKg" min="0" step="any" value="${a.massKg}" />
              </div>
              <div>
                <label class="mini-label" for="ii-price-${i}">Spot ($/kg)</label>
                <input type="number" id="ii-price-${i}" data-field="pricePerKg" min="0" step="any" value="${a.pricePerKg}" />
              </div>
            </div>
          </div>
          <button type="button" class="icon-remove" data-remove="${i}" aria-label="Remove material row" title="Remove row">x</button>
        </div>
      `).join(""),x.querySelectorAll("input").forEach(a=>{a.addEventListener("input",i=>{const r=i.target.closest(".bom-row"),f=Number(r.dataset.row),m=i.target.dataset.field;m==="name"?c[f].name=i.target.value:c[f][m]=parseFloat(i.target.value)||0,t()})}),x.querySelectorAll("[data-remove]").forEach(a=>{a.addEventListener("click",()=>{const i=Number(a.dataset.remove);c.length>1&&(c.splice(i,1),C(),t())})})}function t(){const{totalMass:a,rawCost:i,fin:r,index:f}=P(),m=U(f,i,r,l),u=f>15?"is-danger":f>5?"":f>0&&f<=2.2?"is-success":"is-accent";L.innerHTML=`
      <div class="kpi-box ${u}">
        <span class="kpi-label">Idiot Index</span>
        <span class="kpi-value">${z(f)}</span>
        <span class="kpi-sub">Finished / Raw</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-label">Physics Floor</span>
        <span class="kpi-value">${B(i)}</span>
        <span class="kpi-sub">${a.toLocaleString("en-US",{maximumFractionDigits:1})} kg raw</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-label">Market Price</span>
        <span class="kpi-value">${B(r)}</span>
        <span class="kpi-sub">${i>0?`${B(Math.max(0,r-i))} markup`:"—"}</span>
      </div>
    `,E.innerHTML=Z(i,r,f),k.innerHTML=`
      <div class="diagnosis-box is-${m.tone}">
        <p class="diagnosis-tag">${m.tag}</p>
        <p class="diagnosis-text">${m.text}</p>
      </div>
    `}function d(){q(),C(),t()}b.addEventListener("input",a=>{p=a.target.value}),F.addEventListener("input",a=>{n=parseFloat(a.target.value)||0,t()}),S.addEventListener("click",()=>{c.push({name:"New Commodity",massKg:10,pricePerKg:5}),C(),t()}),o.addEventListener("click",()=>{v(e==="starship-steel"?"carbon-hull":"starship-steel")}),g.addEventListener("click",()=>{const{totalMass:a,rawCost:i,fin:r,index:f}=P(),m=U(f,i,r,l),u=(p||"component").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""),h=c.map(M=>{const A=(Number(M.massKg)||0)*(Number(M.pricePerKg)||0);return`| ${M.name} | ${M.massKg} | $${Number(M.pricePerKg).toFixed(2)} | ${B(A)} |`}).join(`
`),$=`# Idiot Index Teardown: ${p}

Generated by Engineering Lab (Mohammed KM)

## Summary
- **Finished Market Price:** ${B(r)}
- **Raw Material Physics Floor:** ${B(i)} (${a.toFixed(2)} kg total)
- **Idiot Index:** ${z(f)}
- **2.2x First-Principles Target:** ${B(i*2.2)}

## Diagnosis — ${m.tag}
${m.text}

## Bill of Materials
| Material | Mass (kg) | Spot Price ($/kg) | Line Cost |
| --- | ---: | ---: | ---: |
${h}

## Formula
\`\`\`
Idiot Index = Finished Component Price / Raw Material Commodity Cost
\`\`\`
`,K=new Blob([$],{type:"text/markdown;charset=utf-8"}),R=URL.createObjectURL(K),T=document.createElement("a");T.href=R,T.download=`idiot-index-${u||"teardown"}.md`,document.body.appendChild(T),T.click(),T.remove(),URL.revokeObjectURL(R)}),d()}const te=[{id:0,name:"Stamp & Frame",essential:!0,baseSec:22,bloatReason:null},{id:1,name:"Dual Spec Audit",essential:!1,baseSec:38,bloatReason:"Legacy committee sign-off"},{id:2,name:"Fiberglass Mat",essential:!1,baseSec:44,bloatReason:"NVH mat neither team owned"},{id:3,name:"Weld & Seal",essential:!0,baseSec:24,bloatReason:null},{id:4,name:"Extra Bracket",essential:!1,baseSec:32,bloatReason:"Redundant safety bracket"},{id:5,name:"Battery & Drive",essential:!0,baseSec:25,bloatReason:null},{id:6,name:"Paper QA Log",essential:!1,baseSec:34,bloatReason:"Manual clipboard check"},{id:7,name:"Final Calibrate",essential:!0,baseSec:21,bloatReason:null}];function se(s){let e=c(),p=!1,n=null,l=0;function c(){return{questioned:!1,simplified:!1,accelerated:!1,automated:!1,jammed:!1,stations:te.map(t=>({...t,deleted:!1})),units:Array.from({length:10},(t,d)=>({x:40+d*86,stalled:!1})),pulsePhase:0}}s.innerHTML=`
    <div class="section-head">
      <div>
        <h2>The 5-Step Algorithm Factory Simulator</h2>
        <p class="section-lead">Apply the five steps in order — or click Automate early to trigger the Model 3 "alien dreadnought" jam.</p>
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
      <summary>The 5-Step Manufacturing Algorithm (Walter Isaacson's Elon Musk)</summary>
      <div class="drawer-body">
        <p><strong>1. Question every requirement.</strong> Requirements must come from a named person, not a department — even smart people leave stale specs behind.</p>
        <p><strong>2. Delete any part or process you can.</strong> If you do not end up adding at least 10% back in, you did not delete enough. Try deleting an essential station above to see the line break and restore it.</p>
        <p><strong>3. Simplify and optimize.</strong> Never optimize a thing that should not exist.</p>
        <p><strong>4. Accelerate cycle time.</strong> Go faster only after deleting and simplifying.</p>
        <p><strong>5. Automate — last.</strong> During the Model 3 ramp, Tesla automated the fiberglass battery mat before realizing the mat was unnecessary, jamming the line and spiking capex.</p>
      </div>
    </details>
  `;const w=s.querySelector("#fs-kpis"),b=s.querySelector("#fs-steps"),F=s.querySelector("#fs-svg"),x=s.querySelector("#fs-station-strip"),L=s.querySelector("#fs-diagnosis"),E=s.querySelector("#fs-reset");function k(t){if(t.deleted)return 0;let d=t.baseSec;return e.questioned&&(d*=.92),e.simplified&&(d*=.74),e.accelerated&&(d*=.68),e.automated&&(e.jammed&&!t.essential?d*=2.8:e.jammed||(d*=.65)),Math.max(4,d)}function S(){const t=e.stations.filter(y=>!y.deleted),d=t.filter(y=>!y.essential),a=e.stations.filter(y=>y.essential&&y.deleted),i=e.stations.filter(y=>!y.essential&&y.deleted).length;let r=null,f=0;t.forEach(y=>{const I=k(y);I>f&&(f=I,r=y)});let m=f>0?3600/f:0;a.length>0?m=0:e.jammed&&(m=Math.min(m,26));let u=24+t.length*3.5;e.simplified&&(u-=4.5),e.automated&&(u+=e.jammed?52:t.length*4.2);const h=18500,$=14e4+u*1900;let K=m>0?h+$/m:0;e.jammed&&(K+=7400);const R=3600/44,T=m/R;let M="Baseline",A="";return a.length>0?(M="Line Broken",A="is-danger"):e.jammed?(M="JAMMED",A="is-danger"):e.automated&&i>=3&&T>=2.8?(M="3x+ Optimal",A="is-success"):(i>0||e.questioned)&&(M="Optimizing",A="is-accent"),{activeStations:t,activeBloat:d,brokenEssentials:a,deletedBloatCount:i,bottleneck:r,throughput:m,capex:u,unitCost:K,gainRatio:T,statusLabel:M,statusTone:A}}function g(){const t=S();w.innerHTML=`
      <div class="kpi-box ${t.statusTone}">
        <span class="kpi-label">Throughput</span>
        <span class="kpi-value">${t.brokenEssentials.length?"0 u/hr":`${Math.round(t.throughput)} u/hr`}</span>
        <span class="kpi-sub">${t.brokenEssentials.length?"Missing essential step":`${t.gainRatio.toFixed(1)}x vs baseline`}</span>
      </div>
      <div class="kpi-box ${t.statusTone==="is-danger"?"is-danger":t.unitCost>0&&t.unitCost<2e4?"is-success":""}">
        <span class="kpi-label">Unit Cost</span>
        <span class="kpi-value">${t.unitCost>0?`$${Math.round(t.unitCost).toLocaleString("en-US")}`:"HALTED"}</span>
        <span class="kpi-sub">Baseline: $21,390</span>
      </div>
      <div class="kpi-box ${e.jammed?"is-danger":""}">
        <span class="kpi-label">Line Capex</span>
        <span class="kpi-value">$${t.capex.toFixed(1)}M</span>
        <span class="kpi-sub">${t.activeStations.length} active stations</span>
      </div>
      <div class="kpi-box ${t.statusTone}">
        <span class="kpi-label">Line Status</span>
        <span class="kpi-value">${t.statusLabel}</span>
        <span class="kpi-sub">${t.bottleneck&&!t.brokenEssentials.length?`Bottleneck: ${t.bottleneck.name}`:"Restore broken station"}</span>
      </div>
    `,b.innerHTML=`
      <button type="button" class="step-btn ${e.questioned?"is-done":""}" data-step="question">
        <span class="step-num">STEP 01</span>
        <span class="step-name">Question Requirements</span>
        <span class="step-meta">${e.questioned?"4 bloat stations exposed":"Expose legacy bloat"}</span>
      </button>
      <button type="button" class="step-btn ${t.deletedBloatCount>=3?"is-done":""}" data-step="delete">
        <span class="step-num">STEP 02</span>
        <span class="step-name">Delete Station</span>
        <span class="step-meta">${t.deletedBloatCount}/4 bloat deleted</span>
      </button>
      <button type="button" class="step-btn ${e.simplified?"is-done":""}" data-step="simplify">
        <span class="step-num">STEP 03</span>
        <span class="step-name">Simplify &amp; Optimize</span>
        <span class="step-meta">${e.simplified?"Cycle time -26%":"Trim remaining steps"}</span>
      </button>
      <button type="button" class="step-btn ${e.accelerated?"is-done":""}" data-step="accelerate">
        <span class="step-num">STEP 04</span>
        <span class="step-name">Accelerate Cycle</span>
        <span class="step-meta">${e.accelerated?"Line speed +32%":"Push takt speed"}</span>
      </button>
      <button type="button" class="step-btn ${e.jammed?"is-jam":e.automated?"is-done":""}" data-step="automate">
        <span class="step-num">STEP 05</span>
        <span class="step-name">Automate Line</span>
        <span class="step-meta">${e.jammed?"JAMMED! Rip out bloat":e.automated?"Robots running clean":"Deploy robotics"}</span>
      </button>
    `,b.querySelectorAll("button").forEach(a=>{a.addEventListener("click",()=>o(a.dataset.step))}),x.innerHTML=e.stations.map(a=>{const i=k(a),r=e.questioned&&!a.essential&&!a.deleted,f=a.essential&&a.deleted,m=t.bottleneck&&t.bottleneck.id===a.id&&!t.brokenEssentials.length;return`
          <button type="button" class="${["station-chip",a.deleted&&!f?"is-deleted":"",f?"is-broken":"",r?"is-bloat":"",m?"is-bottleneck":""].filter(Boolean).join(" ")}" data-station="${a.id}">
            <span class="station-chip-name">${a.id+1}. ${a.name}</span>
            <span class="station-chip-time">${f?"BROKEN — tap to restore":a.deleted?"DELETED — tap to add back":`${i.toFixed(0)}s${r?" (bloat)":""}`}</span>
          </button>
        `}).join(""),x.querySelectorAll("button").forEach(a=>{a.addEventListener("click",()=>v(Number(a.dataset.station)))});let d="";t.brokenEssentials.length>0?d=`
        <div class="diagnosis-box is-danger">
          <p class="diagnosis-tag">Line Broken — Add 10% Back</p>
          <p class="diagnosis-text">You deleted an essential physics step (${t.brokenEssentials.map(i=>i.name).join(", ")}). Tap the red chip above to add it back — now you know the true minimum line.</p>
        </div>
      `:e.jammed?d=`
        <div class="diagnosis-box is-danger">
          <p class="diagnosis-tag">Alien Dreadnought Jam</p>
          <p class="diagnosis-text">You automated ${t.activeBloat.length} bloated stations (like the fiberglass mat). Robots are jamming, capex spiked +$52M, and unit cost rose. Delete the bloated stations to clear the jam.</p>
        </div>
      `:e.automated&&t.deletedBloatCount>=3&&t.gainRatio>=2.8?d=`
        <div class="diagnosis-box is-success">
          <p class="diagnosis-tag">First-Principles Flow Achieved (${t.gainRatio.toFixed(1)}x Throughput)</p>
          <p class="diagnosis-text">Deleting unnecessary stations before automating cleared every queue, boosted output to ${Math.round(t.throughput)} u/hr, and cut unit cost to $${Math.round(t.unitCost).toLocaleString("en-US")}.</p>
        </div>
      `:d=`
        <div class="diagnosis-box">
          <p class="diagnosis-tag">Factory Floor Status</p>
          <p class="diagnosis-text">${e.questioned?t.activeBloat.length>1?`${t.activeBloat.length} bloated stations remain (highlighted amber). Delete at least 3 before automating.`:"Bloat cleared. Now Simplify, Accelerate, and Automate the remaining essential stations.":"Start with Step 1 to expose bloated legacy stations, or click Step 5 (Automate) early to see what went wrong at Fremont."}</p>
        </div>
      `,L.innerHTML=d,q()}function o(t){if(t==="question")e.questioned=!0;else if(t==="delete"){const d=e.stations.find(a=>!a.essential&&!a.deleted);if(d)d.deleted=!0;else{const a=e.stations.find(i=>i.essential&&!i.deleted&&i.id===3);a&&(a.deleted=!0)}P()}else t==="simplify"?e.simplified=!0:t==="accelerate"?e.accelerated=!0:t==="automate"&&(e.automated=!0,P());g()}function v(t){const d=e.stations.find(a=>a.id===t);d&&(d.deleted=!d.deleted,P(),g())}function P(){if(!e.automated){e.jammed=!1;return}const t=e.stations.filter(d=>!d.essential&&!d.deleted).length;e.jammed=t>=2}function q(){const t=S(),d=24,a=110,i=122,r=e.stations.map((u,h)=>{const $=d+h*a,K=k(u),R=u.essential&&u.deleted,T=!u.essential&&!u.deleted,M=t.bottleneck&&t.bottleneck.id===u.id&&!t.brokenEssentials.length,A=e.jammed&&T;let y="#fafaf9",I="#cfcfcc",H="#111111",D="";R?(y="#fef2f2",I="#b91c1c",H="#b91c1c",D='stroke-dasharray="4 3"'):u.deleted?(y="#ffffff",I="#e5e5e3",H="#a3a3a0",D='stroke-dasharray="4 3"'):A?(y="#fef2f2",I="#b91c1c",H="#b91c1c"):M?(y="#eff4ff",I="#1d4ed8"):e.questioned&&T&&(y="#fffbeb",I="#d97706");const G=R?"BROKEN":u.deleted?"BYPASSED":A?"ROBOT JAM":M?"BOTTLENECK":e.automated?"ROBOT":"MANUAL",Q=u.deleted?0:Math.min(1,K/46);return`
          <g transform="translate(${$}, 22)">
            <rect width="98" height="72" rx="4" fill="${y}" stroke="${I}" stroke-width="${M||A?2:1}" ${D} />
            <text x="8" y="18" font-family="JetBrains Mono, monospace" font-size="10" fill="${A||R?"#b91c1c":M?"#1d4ed8":"#737370"}">${G}</text>
            <text x="8" y="36" font-family="Inter, sans-serif" font-size="11" font-weight="600" fill="${H}">${u.name.length>14?u.name.slice(0,13)+".":u.name}</text>
            <text x="8" y="52" font-family="JetBrains Mono, monospace" font-size="11" fill="${H}">${u.deleted?"0s":`${K.toFixed(0)}s cycle`}</text>
            <rect x="8" y="60" width="82" height="5" rx="2" fill="#e5e5e3" />
            <rect x="8" y="60" width="${(82*Q).toFixed(1)}" height="5" rx="2" fill="${A?"#b91c1c":M?"#1d4ed8":"#555555"}" />
          </g>
        `}).join(""),f=e.units.map(u=>{const h=t.brokenEssentials.length?"#a3a3a0":e.jammed?"#b91c1c":e.automated?"#15803d":"#1d4ed8";return`<rect x="${u.x.toFixed(1)}" y="${i-11}" width="22" height="22" rx="3" fill="${h}" />`}).join(""),m=e.jammed?`<rect x="24" y="156" width="872" height="44" rx="4" fill="#fef2f2" stroke="#fecaca" />
         <text x="460" y="183" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600" fill="#b91c1c">
           CONVEYOR JAMMED — ROBOTS STALLED ON BLOATED STATIONS (DELETE BLOAT TO CLEAR)
         </text>`:t.brokenEssentials.length?`<rect x="24" y="156" width="872" height="44" rx="4" fill="#fef2f2" stroke="#fecaca" />
           <text x="460" y="183" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" font-weight="600" fill="#b91c1c">
             LINE HALTED — ESSENTIAL STATION DELETED (ADD 10% BACK TO RESUME)
           </text>`:`<text x="24" y="182" font-family="JetBrains Mono, monospace" font-size="12" fill="#555555">
             FLOW: ${Math.round(t.throughput)} UNITS/HR  |  ACTIVE STATIONS: ${t.activeStations.length}/8  |  ${e.automated?"AUTOMATED":"MANUAL LINE"}
           </text>`;F.innerHTML=`
      <!-- Conveyor Rail -->
      <line x1="20" y1="${i}" x2="900" y2="${i}" stroke="#cfcfcc" stroke-width="4" />
      <line x1="20" y1="${i}" x2="900" y2="${i}" stroke="#e5e5e3" stroke-width="1" stroke-dasharray="10 8" />
      ${r}
      ${f}
      ${m}
    `}function C(t){if(!p)return;l||(l=t);const d=Math.min(.05,(t-l)/1e3);l=t;const a=S();if(a.brokenEssentials.length===0){const i=e.jammed?16:Math.max(30,a.throughput*.95);e.units.forEach((r,f)=>{if(e.jammed){const m=170+f%5*26;r.x>m-4&&r.x<m+120?r.x+=Math.sin(t/140+f)*.5:r.x+=i*d}else r.x+=i*d;r.x>896&&(r.x=22)}),q()}n=requestAnimationFrame(C)}return E.addEventListener("click",()=>{e=c(),g()}),g(),{setVisible(t){p=t,p&&!n?(l=0,n=requestAnimationFrame(C)):!p&&n&&(cancelAnimationFrame(n),n=null)}}}const W={methalox:{label:"Methalox (CH4 / LOX) — 355s Isp",isp:355,costPerKg:.35},kerolox:{label:"Kerolox (RP-1 / LOX) — 315s Isp",isp:315,costPerKg:.45},hydrolox:{label:"Hydrolox (LH2 / LOX) — 435s Isp",isp:435,costPerKg:2.1}},ae=9.80665,ie=9300,V=15e5,oe=12e7,J=18500;function _(s,e,p){const n=W[p]||W.methalox,l=ie/2,c=Math.exp(l/(n.isp*ae)),w=1/(1+e),b=Math.max(0,(1-w*c)/c),F=b*b,x=V*F,L=V*(1-F)*(e/(1+e)),E=L*n.costPerKg,k=35e4+14e5/Math.sqrt(s),S=oe/s,g=S+k+E,o=x>50?g/x:1/0,v=x>50?propCostPerKg/x:1/0,P=g>0?propCostPerKg/g*100:0;return{prop:n,payloadKg:x,totalPayloadFrac:F,propellantKg:L,propCostPerFlight:E,hardwarePerFlight:S,refurbPerFlight:k,totalFlightCost:g,costPerKg:o,propFloorPerKg:v,propSharePct:P}}function N(s){return Number.isFinite(s)?s>=1e3?`$${Math.round(s).toLocaleString("en-US")}/kg`:s>=10?`$${s.toFixed(0)}/kg`:`$${s.toFixed(1)}/kg`:"No Orbit"}function ne(s,e,p,n){const k=Math.log10(5),S=Math.log10(1e5),g=h=>68+(Math.log10(h)-Math.log10(1))/(Math.log10(100)-Math.log10(1))*588,o=h=>{const $=Math.max(5,Math.min(1e5,h));return 26+238*(1-(Math.log10($)-k)/(S-k))},v=[10,100,1e3,1e4,1e5],P=[1,2,5,10,25,50,100],q=v.map(h=>{const $=o(h);return`
        <line x1="68" y1="${$.toFixed(1)}" x2="656" y2="${$.toFixed(1)}" stroke="#e5e5e3" stroke-width="1" />
        <text x="60" y="${($+4).toFixed(1)}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="11" fill="#555555">$${h>=1e3?`${h/1e3}k`:h}</text>
      `}).join(""),C=P.map(h=>{const $=g(h);return`
        <line x1="${$.toFixed(1)}" y1="26" x2="${$.toFixed(1)}" y2="264" stroke="#f0f0ee" stroke-width="1" />
        <text x="${$.toFixed(1)}" y="282" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#555555">${h}x</text>
      `}).join(""),t=o(54e3),d=o(12e3),a=[1,1.5,2,3,4,5,7,10,15,20,30,45,65,85,100];let i="",r=Number.isFinite(n.costPerKg);r&&(i=a.map((h,$)=>{const K=_(h,e,p),R=g(h),T=o(K.costPerKg);return`${$===0?"M":"L"} ${R.toFixed(1)} ${T.toFixed(1)}`}).join(" "));const f=o(r?n.propFloorPerKg:20),m=g(s),u=r?o(n.costPerKg):26+238/2;return`
    <svg viewBox="0 0 680 310" role="img" aria-label="Logarithmic chart of launch cost per kilogram to orbit versus vehicle reuse count">
      ${q}
      ${C}

      <!-- By-analogy precedent band -->
      <rect x="68" y="${t.toFixed(1)}" width="588" height="${(d-t).toFixed(1)}" fill="#fef2f2" opacity="0.9" />
      <line x1="68" y1="${o(J).toFixed(1)}" x2="656" y2="${o(J).toFixed(1)}" stroke="#b91c1c" stroke-width="1.2" stroke-dasharray="5 4" />
      <text x="650" y="${(t+14).toFixed(1)}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="11" fill="#b91c1c">By-Analogy Precedent ($12k-$54k/kg)</text>

      <!-- Propellant physics floor -->
      ${r?`<line x1="68" y1="${f.toFixed(1)}" x2="656" y2="${f.toFixed(1)}" stroke="#15803d" stroke-width="1.3" stroke-dasharray="4 3" />
             <text x="650" y="${(f-6).toFixed(1)}" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="11" fill="#15803d">Propellant Physics Floor (${N(n.propFloorPerKg)})</text>`:""}

      <!-- Physics-up reuse curve -->
      ${r?`<path d="${i}" fill="none" stroke="#1d4ed8" stroke-width="2.6" />
             <line x1="${m.toFixed(1)}" y1="${u.toFixed(1)}" x2="${m.toFixed(1)}" y2="264" stroke="#1d4ed8" stroke-width="1" stroke-dasharray="3 3" />
             <circle cx="${m.toFixed(1)}" cy="${u.toFixed(1)}" r="6" fill="#1d4ed8" stroke="#ffffff" stroke-width="2" />
             <rect x="${Math.min(532,Math.max(74,m-58)).toFixed(1)}" y="${Math.max(30,u-34).toFixed(1)}" width="116" height="24" rx="3" fill="#111111" />
             <text x="${Math.min(590,Math.max(132,m)).toFixed(1)}" y="${Math.max(46,u-18).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" fill="#ffffff">${N(n.costPerKg)}</text>`:`<text x="${68+588/2}" y="${26+238/2}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="13" fill="#b91c1c">Mass ratio too low to reach LEO (increase ratio or Isp)</text>`}

      <!-- Axes Labels -->
      <text x="${68+588/2}" y="302" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="#555555">Flights per Vehicle (Reuse Count, log scale)</text>
      <text x="16" y="${26+238/2}" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="#555555" transform="rotate(-90 16 ${26+238/2})">USD / kg to LEO (log)</text>
    </svg>
  `}function le(s){let e=1,p=12.5,n="methalox";s.innerHTML=`
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
            ${Object.entries(W).map(([o,v])=>`<option value="${o}">${v.label}</option>`).join("")}
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
  `;const l=s.querySelector("#rk-presets"),c=s.querySelector("#rk-kpis"),w=s.querySelector("#rk-chart"),b=s.querySelector("#rk-diagnosis"),F=s.querySelector("#rk-breakdown"),x=s.querySelector("#rk-reuse"),L=s.querySelector("#rk-reuse-val"),E=s.querySelector("#rk-ratio"),k=s.querySelector("#rk-ratio-val"),S=s.querySelector("#rk-prop");function g(){const o=_(e,p,n),v=Number.isFinite(o.costPerKg),P=v?J/o.costPerKg:0;x.value=e,L.textContent=`${e} ${e===1?"flight":"flights"}`,E.value=p,k.textContent=`${p.toFixed(1)} : 1`,S.value=n,l.querySelectorAll("button").forEach(C=>{C.classList.toggle("is-active",Number(C.dataset.reuse)===e)});const q=v?o.costPerKg<150?"is-success":o.costPerKg<1e3?"is-accent":"":"is-danger";c.innerHTML=`
      <div class="kpi-box ${q}">
        <span class="kpi-label">Cost to LEO</span>
        <span class="kpi-value">${N(o.costPerKg)}</span>
        <span class="kpi-sub">Precedent: $18.5k/kg</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-label">Vs Precedent</span>
        <span class="kpi-value">${v?`${P.toFixed(0)}x`:"—"}</span>
        <span class="kpi-sub">cheaper per kg</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-label">Payload to LEO</span>
        <span class="kpi-value">${o.payloadKg>50?`${(o.payloadKg/1e3).toFixed(1)} t`:"0 t"}</span>
        <span class="kpi-sub">${(o.totalPayloadFrac*100).toFixed(2)}% of GLOW</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-label">Propellant Share</span>
        <span class="kpi-value">${v?`${o.propSharePct.toFixed(1)}%`:"—"}</span>
        <span class="kpi-sub">Floor: ${N(o.propFloorPerKg)}</span>
      </div>
    `,F.innerHTML=`
      <div class="kpi-box">
        <span class="kpi-label">Hardware / Flight</span>
        <span class="kpi-value">$${(o.hardwarePerFlight/1e6).toFixed(2)}M</span>
      </div>
      <div class="kpi-box">
        <span class="kpi-label">Propellant / Flight</span>
        <span class="kpi-value">$${(o.propCostPerFlight/1e6).toFixed(2)}M</span>
      </div>
    `,w.innerHTML=ne(e,p,n,o),v?e===1?b.innerHTML=`
        <div class="diagnosis-box is-warn">
          <p class="diagnosis-tag">Expendable Trap (Propellant is ${o.propSharePct.toFixed(2)}% of Cost)</p>
          <p class="diagnosis-text">Throwing away a $120M booster after one flight leaves cost at ${N(o.costPerKg)} even though fuel costs only ${N(o.propFloorPerKg)}.</p>
        </div>
      `:e>=50?b.innerHTML=`
        <div class="diagnosis-box is-success">
          <p class="diagnosis-tag">Airline Economics (${P.toFixed(0)}x Below Precedent)</p>
          <p class="diagnosis-text">At ${e} flights, hardware amortization collapses to $${(o.hardwarePerFlight/1e6).toFixed(2)}M/launch and propellant climbs to ${o.propSharePct.toFixed(1)}% of flight cost.</p>
        </div>
      `:b.innerHTML=`
        <div class="diagnosis-box">
          <p class="diagnosis-tag">Partial Amortization (${e} Flights)</p>
          <p class="diagnosis-text">Cost drops to ${N(o.costPerKg)} (${P.toFixed(0)}x below expendable precedent). Keep pushing reuse toward 100 flights to approach the fuel floor.</p>
        </div>
      `:b.innerHTML=`
        <div class="diagnosis-box is-danger">
          <p class="diagnosis-tag">Tsiolkovsky Limit Reached</p>
          <p class="diagnosis-text">At ${p.toFixed(1)}:1 mass ratio and ${o.prop.isp}s Isp, structural mass consumes the entire orbital budget. Raise mass ratio or Isp.</p>
        </div>
      `}l.querySelectorAll("button").forEach(o=>{o.addEventListener("click",()=>{e=Number(o.dataset.reuse),g()})}),x.addEventListener("input",o=>{e=Number(o.target.value),g()}),E.addEventListener("input",o=>{p=Number(o.target.value),g()}),S.addEventListener("change",o=>{n=o.target.value,g()}),g()}const j={idiot:document.getElementById("panel-idiot"),factory:document.getElementById("panel-factory"),rocket:document.getElementById("panel-rocket")},X=Array.from(document.querySelectorAll(".tab-btn")),Y=se(j.factory);ee(j.idiot);le(j.rocket);function re(s){X.forEach(e=>{const p=e.dataset.tab===s;e.classList.toggle("is-active",p),e.setAttribute("aria-selected",String(p))}),Object.entries(j).forEach(([e,p])=>{const n=e===s;p.hidden=!n,p.classList.toggle("is-active",n)}),Y.setVisible(s==="factory")}X.forEach(s=>{s.addEventListener("click",()=>re(s.dataset.tab))});Y.setVisible(!1);
