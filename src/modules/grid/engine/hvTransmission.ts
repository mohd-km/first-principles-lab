export type CorridorType = 'overhead' | 'subsea';

export interface HvInputs {
  powerMW: number;
  distanceKm: number;
  powerFactor: number;
  corridor: CorridorType;
  focusClassId: string;
}

export interface VoltageClassSpec {
  id: string;
  label: string;
  shortLabel: string;
  mode: 'HVAC' | 'HVDC';
  voltageKV: number; // Line-to-line for HVAC; pole-to-ground (+/- V) for HVDC
  conductor: string;
  thermalRatingMVAOverhead: number;
  thermalRatingMVASubsea: number;
  rPerKmOverhead: number; // Ohm/km per phase (AC includes ~8% skin effect) or per pole (DC)
  rPerKmSubsea: number;
  converterLossPct: number; // 0.5% transformer pair for HVAC; 1.2% LCC / 1.6% VSC for HVDC
  cableCapUfPerKm: number; // Capacitive charging for subsea/underground AC cables
  color: string;
}

export interface HvClassResult {
  spec: VoltageClassSpec;
  circuitsNeeded: number;
  totalCurrentA: number;
  currentPerCircuitA: number;
  ohmicLossMW: number;
  stationLossMW: number;
  totalLossMW: number;
  totalLossPct: number;
  deliveredMW: number;
  chargingCurrentA: number;
  chargingSaturated: boolean;
  criticalCableKm: number | null;
  verdict: string;
  feasible: boolean;
}

export const VOLTAGE_CLASSES: VoltageClassSpec[] = [
  {
    id: 'ac110',
    label: '110 kV HVAC (Sub-transmission)',
    shortLabel: '110 kV AC',
    mode: 'HVAC',
    voltageKV: 110,
    conductor: 'ACSR Panther',
    thermalRatingMVAOverhead: 120,
    thermalRatingMVASubsea: 95,
    rPerKmOverhead: 0.165,
    rPerKmSubsea: 0.18,
    converterLossPct: 0.5,
    cableCapUfPerKm: 0.20,
    color: '#9ca3af',
  },
  {
    id: 'ac220',
    label: '220 kV HVAC (Regional)',
    shortLabel: '220 kV AC',
    mode: 'HVAC',
    voltageKV: 220,
    conductor: 'ACSR Zebra',
    thermalRatingMVAOverhead: 320,
    thermalRatingMVASubsea: 240,
    rPerKmOverhead: 0.068,
    rPerKmSubsea: 0.075,
    converterLossPct: 0.5,
    cableCapUfPerKm: 0.21,
    color: '#6b7280',
  },
  {
    id: 'ac400',
    label: '400 kV EHV HVAC (Backbone)',
    shortLabel: '400 kV AC',
    mode: 'HVAC',
    voltageKV: 400,
    conductor: 'Quad ACSR Moose',
    thermalRatingMVAOverhead: 1950,
    thermalRatingMVASubsea: 950,
    rPerKmOverhead: 0.0138,
    rPerKmSubsea: 0.019,
    converterLossPct: 0.5,
    cableCapUfPerKm: 0.22,
    color: '#374151',
  },
  {
    id: 'ac765',
    label: '765 kV UHV HVAC (Inter-regional)',
    shortLabel: '765 kV AC',
    mode: 'HVAC',
    voltageKV: 765,
    conductor: 'Quad Bersimis / Hexa Zebra',
    thermalRatingMVAOverhead: 3000,
    thermalRatingMVASubsea: 1200,
    rPerKmOverhead: 0.0118,
    rPerKmSubsea: 0.016,
    converterLossPct: 0.5,
    cableCapUfPerKm: 0.23,
    color: '#111111',
  },
  {
    id: 'dc500',
    label: '±500 kV HVDC (LCC / VSC)',
    shortLabel: '±500 kV DC',
    mode: 'HVDC',
    voltageKV: 500,
    conductor: 'Quad Bundle / XLPE Cable',
    thermalRatingMVAOverhead: 3000,
    thermalRatingMVASubsea: 1800,
    rPerKmOverhead: 0.0085,
    rPerKmSubsea: 0.0115,
    converterLossPct: 1.4,
    cableCapUfPerKm: 0,
    color: '#d97706',
  },
  {
    id: 'dc800',
    label: '±800 kV UHVDC (Bulk Corridor)',
    shortLabel: '±800 kV DC',
    mode: 'HVDC',
    voltageKV: 800,
    conductor: 'Hexa Bundle Bipolar',
    thermalRatingMVAOverhead: 6000,
    thermalRatingMVASubsea: 2400,
    rPerKmOverhead: 0.0055,
    rPerKmSubsea: 0.0085,
    converterLossPct: 1.2,
    cableCapUfPerKm: 0,
    color: '#b45309',
  },
];

export function evaluateVoltageClass(
  spec: VoltageClassSpec,
  powerMW: number,
  distanceKm: number,
  powerFactor: number,
  corridor: CorridorType
): HvClassResult {
  const pf = spec.mode === 'HVDC' ? 1.0 : powerFactor;
  const ratingPerCkt =
    corridor === 'overhead'
      ? spec.thermalRatingMVAOverhead
      : spec.thermalRatingMVASubsea;

  const apparentMVA = powerMW / pf;
  const circuitsNeeded = Math.max(1, Math.ceil(apparentMVA / ratingPerCkt));

  const rPerKm =
    corridor === 'overhead' ? spec.rPerKmOverhead : spec.rPerKmSubsea;
  const totalR = rPerKm * distanceKm;

  let totalCurrentA = 0;
  let currentPerCircuitA = 0;
  let ohmicLossMW = 0;
  let chargingCurrentA = 0;
  let chargingSaturated = false;
  let criticalCableKm: number | null = null;

  if (spec.mode === 'HVAC') {
    // Three-phase current: I = P / (sqrt(3) * V_LL * cos(theta))
    totalCurrentA = (powerMW * 1e6) / (Math.sqrt(3) * spec.voltageKV * 1e3 * pf);
    currentPerCircuitA = totalCurrentA / circuitsNeeded;
    // P_loss = N * 3 * (I_ckt)^2 * R = (P^2 * R) / (N * V^2 * pf^2)
    ohmicLossMW = (circuitsNeeded * 3 * currentPerCircuitA * currentPerCircuitA * totalR) / 1e6;

    if (corridor === 'subsea') {
      // Capacitive charging current per phase: I_c = 2 * pi * f * C * V_ph * L (50 Hz)
      const vPhaseV = (spec.voltageKV * 1e3) / Math.sqrt(3);
      const icPerKm = 2 * Math.PI * 50 * (spec.cableCapUfPerKm * 1e-6) * vPhaseV;
      chargingCurrentA = icPerKm * distanceKm;
      const thermalAmpacityPerCkt =
        (ratingPerCkt * 1e6) / (Math.sqrt(3) * spec.voltageKV * 1e3);
      criticalCableKm = Math.round(thermalAmpacityPerCkt / icPerKm);
      if (chargingCurrentA >= thermalAmpacityPerCkt * 0.85) {
        chargingSaturated = true;
      }
    }
  } else {
    // Bipolar HVDC: P = 2 * V_pole * I_pole => I_pole = P / (2 * V_pole)
    totalCurrentA = (powerMW * 1e6) / (2 * spec.voltageKV * 1e3);
    currentPerCircuitA = totalCurrentA / circuitsNeeded;
    // Two poles carrying current: P_loss = N * 2 * (I_pole)^2 * R_dc
    ohmicLossMW = (circuitsNeeded * 2 * currentPerCircuitA * currentPerCircuitA * totalR) / 1e6;
  }

  const stationLossMW = powerMW * (spec.converterLossPct / 100);
  const rawTotalLossMW = ohmicLossMW + stationLossMW;
  const totalLossMW = Math.min(powerMW, rawTotalLossMW);
  const totalLossPct = (totalLossMW / Math.max(1, powerMW)) * 100;
  const deliveredMW = Math.max(0, powerMW - totalLossMW);

  let feasible = true;
  let verdict = 'Optimal';

  if (chargingSaturated) {
    feasible = false;
    verdict = `Saturated (I_c > ${criticalCableKm} km limit)`;
  } else if (totalLossPct >= 25) {
    feasible = false;
    verdict = 'Excessive I²R Loss';
  } else if (circuitsNeeded > 6) {
    feasible = false;
    verdict = `Impractical (${circuitsNeeded} circuits)`;
  } else if (totalLossPct <= 5.5 && circuitsNeeded <= 2) {
    verdict = 'High Efficiency';
  } else if (totalLossPct <= 10) {
    verdict = 'Viable';
  } else {
    verdict = 'High Loss';
  }

  return {
    spec,
    circuitsNeeded,
    totalCurrentA,
    currentPerCircuitA,
    ohmicLossMW,
    stationLossMW,
    totalLossMW,
    totalLossPct,
    deliveredMW,
    chargingCurrentA,
    chargingSaturated,
    criticalCableKm,
    verdict,
    feasible,
  };
}

export function evaluateAllVoltageClasses(inputs: HvInputs): HvClassResult[] {
  return VOLTAGE_CLASSES.map((spec) =>
    evaluateVoltageClass(
      spec,
      inputs.powerMW,
      inputs.distanceKm,
      inputs.powerFactor,
      inputs.corridor
    )
  );
}

/**
 * Computes the distance (km) where ±800 kV HVDC achieves lower total loss than 765 kV HVAC
 * (or 400 kV HVAC for subsea cables).
 */
export function computeBreakEvenKm(
  powerMW: number,
  powerFactor: number,
  corridor: CorridorType
): number {
  if (corridor === 'subsea') {
    // Subsea AC saturates rapidly; HVDC VSC breaks even around 50-80 km
    const ac400 = VOLTAGE_CLASSES.find((v) => v.id === 'ac400')!;
    const dc500 = VOLTAGE_CLASSES.find((v) => v.id === 'dc500')!;
    for (let d = 10; d <= 500; d += 5) {
      const acRes = evaluateVoltageClass(ac400, powerMW, d, powerFactor, 'subsea');
      const dcRes = evaluateVoltageClass(dc500, powerMW, d, powerFactor, 'subsea');
      if (acRes.chargingSaturated || dcRes.totalLossPct < acRes.totalLossPct) {
        return d;
      }
    }
    return 60;
  }

  const ac765 = VOLTAGE_CLASSES.find((v) => v.id === 'ac765')!;
  const dc800 = VOLTAGE_CLASSES.find((v) => v.id === 'dc800')!;
  for (let d = 50; d <= 2000; d += 10) {
    const acRes = evaluateVoltageClass(ac765, powerMW, d, powerFactor, 'overhead');
    const dcRes = evaluateVoltageClass(dc800, powerMW, d, powerFactor, 'overhead');
    if (dcRes.totalLossPct < acRes.totalLossPct) {
      return d;
    }
  }
  return 700;
}

export function buildMarkdownReport(
  hvInputs: HvInputs,
  hvResults: HvClassResult[],
  breakEvenKm: number,
  gridSummaryMarkdown: string
): string {
  const focus = hvResults.find((r) => r.spec.id === hvInputs.focusClassId) || hvResults[2];
  const rows = hvResults
    .map(
      (r) =>
        `| ${r.spec.label} | ${r.circuitsNeeded} | ${Math.round(r.totalCurrentA).toLocaleString()} A | ${r.totalLossMW.toFixed(1)} MW (${r.totalLossPct.toFixed(2)}%) | ${r.deliveredMW.toFixed(1)} MW | ${r.verdict} |`
    )
    .join('\n');

  return `# Power Grid, HV Transmission & Storage Engineering Report
Generated by Applied Physics & Deep-Tech Labs (labs.mohammed-km.in) — Mohammed KM

---

## 1. HV Transmission Loss (I^2R) & Distance Analysis

- **Transmitted Power (P):** ${hvInputs.powerMW.toLocaleString()} MW
- **Corridor Length (L):** ${hvInputs.distanceKm.toLocaleString()} km (${hvInputs.corridor === 'overhead' ? 'Overhead Line' : 'Subsea / Underground XLPE Cable'})
- **AC Power Factor (cos theta):** ${hvInputs.powerFactor.toFixed(2)}
- **HVAC vs HVDC Break-Even Distance:** ~${breakEvenKm} km
- **Selected Voltage Class:** ${focus.spec.label}
  - Total Line Current: ${Math.round(focus.totalCurrentA).toLocaleString()} A (${Math.round(focus.currentPerCircuitA).toLocaleString()} A/circuit across ${focus.circuitsNeeded} circuit${focus.circuitsNeeded > 1 ? 's' : ''})
  - Ohmic Line Loss: ${focus.ohmicLossMW.toFixed(2)} MW | Station/Converter Loss: ${focus.stationLossMW.toFixed(2)} MW
  - Total Loss: ${focus.totalLossMW.toFixed(2)} MW (${focus.totalLossPct.toFixed(2)}%)
  - Delivered Power: ${focus.deliveredMW.toFixed(2)} MW
  - Engineering Verdict: ${focus.verdict}

### Voltage Class Comparison Matrix

| Transmission Class | Circuits | Total Current | Total Loss (MW / %) | Delivered Power | Verdict |
|---|---:|---:|---:|---:|---|
${rows}

### Governing Physics
- Three-phase AC Ohmic Loss: \`P_loss = 3 * I^2 * R = (P^2 * R) / (V^2 * cos^2(theta))\`
- Voltage Scaling Law: \`P_loss proportional to 1 / V^2\` (10x voltage step-up reduces I^2R loss by 100x / 99%).
- AC Subsea/Underground Limit: Capacitive charging current \`I_c = 2 * pi * f * C * V_ph * L\` saturates cable ampacity beyond ~50-80 km; HVDC (\`f = 0\`) eliminates charging current and skin effect.

---

${gridSummaryMarkdown}
`;
}
