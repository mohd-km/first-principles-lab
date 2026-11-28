export type DemandProfileId = 'metro50' | 'india256' | 'flat1';

export interface GridInputs {
  profileId: DemandProfileId;
  solarGW: number;
  windGW: number;
  nuclearGW: number;
  gasGW: number;
  lfpGWh: number;
  phsGWh: number;
}

export interface HourlyDispatchPoint {
  hour: number;
  label: string;
  demandGW: number;
  nuclearGW: number;
  windAvailGW: number;
  solarAvailGW: number;
  windUsedGW: number;
  solarUsedGW: number;
  netLoadGW: number; // demand - (solarAvail + windAvail) -> the Duck Curve
  lfpDischargeGW: number;
  lfpChargeGW: number;
  phsDischargeGW: number;
  phsChargeGW: number;
  gasGW: number;
  curtailedGW: number;
  unservedGW: number;
  lfpSocPct: number;
  phsSocPct: number;
  inertiaSec: number;
  rocofHzPerSec: number;
  marginalSource: string;
}

export interface GridSummary {
  hourly: HourlyDispatchPoint[];
  totalDemandGWh: number;
  deliveredGWh: number;
  unservedGWh: number;
  curtailedGWh: number;
  curtailmentPctOfVre: number;
  cleanSharePct: number;
  nuclearGWh: number;
  solarDeliveredGWh: number;
  windDeliveredGWh: number;
  gasGWh: number;
  lfpDischargeGWh: number;
  phsDischargeGWh: number;
  storageLossGWh: number;
  headlineLcoeUsdMWh: number;
  firmLcoeUsdMWh: number;
  firmingPremiumUsdMWh: number;
  peakEveningRampGWPerHr: number;
  minNetLoadGW: number;
  maxNetLoadGW: number;
  minInertiaSec: number;
  worstRocofHzPerSec: number;
  inertiaStatus: 'Nominal' | 'Tight' | 'Low-Inertia Risk';
  landFootprintKm2: number;
  deficitHours: number;
}

export interface GridPreset {
  id: string;
  name: string;
  note: string;
  inputs: GridInputs;
}

// Normalized hourly solar profile (utility PV, CF ~ 21.8%, within the 18-25% utility PV range)
const SOLAR_SHAPE: number[] = [
  0.0, 0.0, 0.0, 0.0, 0.0, 0.02,
  0.10, 0.28, 0.49, 0.67, 0.78, 0.84,
  0.86, 0.82, 0.72, 0.56, 0.36, 0.16,
  0.04, 0.0, 0.0, 0.0, 0.0, 0.0,
];

// Normalized hourly wind profile (onshore wind, CF ~ 33.5%, within the 30-35% onshore range)
const WIND_SHAPE: number[] = [
  0.42, 0.43, 0.44, 0.43, 0.41, 0.38,
  0.34, 0.29, 0.25, 0.23, 0.22, 0.23,
  0.24, 0.25, 0.27, 0.30, 0.34, 0.37,
  0.40, 0.42, 0.43, 0.43, 0.42, 0.42,
];

// Demand profiles (GW per hour)
const DEMAND_PROFILES: Record<DemandProfileId, { name: string; peakGW: number; hourlyGW: number[] }> = {
  metro50: {
    name: 'Metro Grid (50 GW Peak)',
    peakGW: 50,
    hourlyGW: [
      31.0, 29.5, 28.5, 28.0, 28.5, 30.5,
      34.5, 39.0, 41.5, 42.5, 43.0, 43.5,
      43.0, 42.5, 42.0, 43.0, 45.5, 48.5,
      50.0, 49.5, 47.0, 43.0, 38.0, 34.0,
    ],
  },
  india256: {
    name: 'India Summer Peak (256 GW)',
    peakGW: 256.1,
    hourlyGW: [
      198, 192, 188, 186, 189, 196,
      208, 219, 228, 236, 244, 250,
      254, 256.1, 255, 252, 246, 242,
      246, 250, 247, 238, 224, 210,
    ],
  },
  flat1: {
    name: '24/7 Flat Baseload (1 GW)',
    peakGW: 1,
    hourlyGW: Array(24).fill(1.0),
  },
};

export const DEMAND_PROFILE_LIST = Object.entries(DEMAND_PROFILES).map(([id, p]) => ({
  id: id as DemandProfileId,
  name: p.name,
  peakGW: p.peakGW,
}));

export const GRID_PRESETS: GridPreset[] = [
  {
    id: 'balanced',
    name: 'Balanced Hybrid',
    note: '50 GW metro grid with solar, wind, nuclear baseload, gas & storage.',
    inputs: {
      profileId: 'metro50',
      solarGW: 42,
      windGW: 22,
      nuclearGW: 14,
      gasGW: 24,
      lfpGWh: 40,
      phsGWh: 24,
    },
  },
  {
    id: 'duck-curve',
    name: 'California Duck Curve',
    note: 'Heavy midday solar overbuild forcing steep evening ramp & curtailment.',
    inputs: {
      profileId: 'metro50',
      solarGW: 72,
      windGW: 12,
      nuclearGW: 5,
      gasGW: 30,
      lfpGWh: 28,
      phsGWh: 12,
    },
  },
  {
    id: 'solar-megapack-1gw',
    name: '1 GW Solar + Megapack',
    note: 'Benchmark: 4.8 GWp PV + 16 GWh LFP serving 1 GW round-the-clock.',
    inputs: {
      profileId: 'flat1',
      solarGW: 4.8,
      windGW: 0,
      nuclearGW: 0,
      gasGW: 0.2,
      lfpGWh: 16,
      phsGWh: 0,
    },
  },
  {
    id: 'india-peak',
    name: 'India Apr 2026 Peak (256 GW)',
    note: 'Grounded in Grid-India 256.1 GW afternoon peak & 150 GW solar fleet.',
    inputs: {
      profileId: 'india256',
      solarGW: 150,
      windGW: 56,
      nuclearGW: 9,
      gasGW: 185,
      lfpGWh: 20,
      phsGWh: 40,
    },
  },
  {
    id: 'low-inertia',
    name: 'Low-Inertia Stress Test',
    note: 'High inverter share (solar + wind + LFP) with minimal synchronous mass.',
    inputs: {
      profileId: 'metro50',
      solarGW: 85,
      windGW: 45,
      nuclearGW: 3,
      gasGW: 14,
      lfpGWh: 120,
      phsGWh: 0,
    },
  },
];

// Constants grounded in published benchmarks
const LFP_RTE = 0.865; // 85-88% AC-to-AC
const LFP_CHG_EFF = Math.sqrt(LFP_RTE);
const LFP_DIS_EFF = Math.sqrt(LFP_RTE);
const LFP_DURATION_HR = 4; // 2-4 hr typical discharge duration
const LFP_LCOS_USD_MWH = 130; // $110-150/MWh

const PHS_RTE = 0.785; // 75-82% AC-to-AC
const PHS_CHG_EFF = Math.sqrt(PHS_RTE);
const PHS_DIS_EFF = Math.sqrt(PHS_RTE);
const PHS_DURATION_HR = 8; // 6-12+ hr typical discharge duration
const PHS_LCOS_USD_MWH = 110; // $80-140/MWh

const NUCLEAR_CF = 0.92; // 90-95% PWR baseline
const SOLAR_CF = SOLAR_SHAPE.reduce((a, b) => a + b, 0) / 24;
const WIND_CF = WIND_SHAPE.reduce((a, b) => a + b, 0) / 24;

// Baseline uncurtailed LCOE ($/MWh) & daily fixed cost structure
const LCOE_SOLAR = 36;
const LCOE_WIND = 42;
const LCOE_NUCLEAR = 88;
const GAS_FIXED_PER_GW_DAY_USD = 240_000; // ~$88/kW-yr annualized fixed CAPEX + O&M
const GAS_VAR_PER_MWH_USD = 54; // CCGT/peaker blended fuel + variable O&M

// Standby annualized capital cost for installed storage capacity (so idle GWh still count)
const LFP_STANDBY_PER_GWH_DAY_USD = 22_000;
const PHS_STANDBY_PER_GWH_DAY_USD = 14_000;

export function simulateGridDispatch(inputs: GridInputs): GridSummary {
  const profile = DEMAND_PROFILES[inputs.profileId];
  const lfpMaxPowerGW = inputs.lfpGWh / LFP_DURATION_HR;
  const phsMaxPowerGW = inputs.phsGWh / PHS_DURATION_HR;

  // Run 48 hours (2 identical days) so Day 2 reflects steady-state cyclic SoC
  let lfpEnergyGWh = inputs.lfpGWh * 0.5;
  let phsEnergyGWh = inputs.phsGWh * 0.5;

  const day2Points: HourlyDispatchPoint[] = [];

  for (let step = 0; step < 48; step++) {
    const hour = step % 24;
    const demandGW = profile.hourlyGW[hour];
    const nuclearGW = inputs.nuclearGW * NUCLEAR_CF;
    const solarAvailGW = inputs.solarGW * SOLAR_SHAPE[hour];
    const windAvailGW = inputs.windGW * WIND_SHAPE[hour];
    const netLoadGW = demandGW - (solarAvailGW + windAvailGW);

    const mustTakeGW = nuclearGW + solarAvailGW + windAvailGW;

    let lfpChargeGW = 0;
    let lfpDischargeGW = 0;
    let phsChargeGW = 0;
    let phsDischargeGW = 0;
    let gasGW = 0;
    let curtailedGW = 0;
    let unservedGW = 0;
    let marginalSource = 'Solar / Wind';

    if (mustTakeGW >= demandGW) {
      // Surplus generation: charge LFP first, then PHS, curtail remainder
      let surplusGW = mustTakeGW - demandGW;

      if (inputs.lfpGWh > 0 && surplusGW > 0) {
        const roomGWh = Math.max(0, inputs.lfpGWh - lfpEnergyGWh);
        const maxGridDrawForRoom = roomGWh / LFP_CHG_EFF;
        lfpChargeGW = Math.min(surplusGW, lfpMaxPowerGW, maxGridDrawForRoom);
        lfpEnergyGWh += lfpChargeGW * LFP_CHG_EFF;
        surplusGW -= lfpChargeGW;
      }

      if (inputs.phsGWh > 0 && surplusGW > 0) {
        const roomGWh = Math.max(0, inputs.phsGWh - phsEnergyGWh);
        const maxGridDrawForRoom = roomGWh / PHS_CHG_EFF;
        phsChargeGW = Math.min(surplusGW, phsMaxPowerGW, maxGridDrawForRoom);
        phsEnergyGWh += phsChargeGW * PHS_CHG_EFF;
        surplusGW -= phsChargeGW;
      }

      curtailedGW = Math.max(0, surplusGW);
      marginalSource = curtailedGW > 0.01 ? 'Spare solar / wind ($0)' : 'Storage Charging';
    } else {
      // Deficit: discharge LFP, then PHS, then Gas, else Unserved
      let deficitGW = demandGW - mustTakeGW;

      if (inputs.lfpGWh > 0 && deficitGW > 0) {
        const maxDeliverableFromSoc = lfpEnergyGWh * LFP_DIS_EFF;
        lfpDischargeGW = Math.min(deficitGW, lfpMaxPowerGW, maxDeliverableFromSoc);
        lfpEnergyGWh -= lfpDischargeGW / LFP_DIS_EFF;
        deficitGW -= lfpDischargeGW;
        if (lfpDischargeGW > 0.001) marginalSource = 'LFP BESS';
      }

      if (inputs.phsGWh > 0 && deficitGW > 0) {
        const maxDeliverableFromSoc = phsEnergyGWh * PHS_DIS_EFF;
        phsDischargeGW = Math.min(deficitGW, phsMaxPowerGW, maxDeliverableFromSoc);
        phsEnergyGWh -= phsDischargeGW / PHS_DIS_EFF;
        deficitGW -= phsDischargeGW;
        if (phsDischargeGW > 0.001) marginalSource = 'Pumped Hydro';
      }

      if (inputs.gasGW > 0 && deficitGW > 0) {
        gasGW = Math.min(deficitGW, inputs.gasGW);
        deficitGW -= gasGW;
        if (gasGW > 0.001) marginalSource = 'Natural Gas';
      }

      if (deficitGW > 0.001) {
        unservedGW = deficitGW;
        marginalSource = 'Shortfall (blackout)';
      } else if (lfpDischargeGW <= 0.001 && phsDischargeGW <= 0.001 && gasGW <= 0.001) {
        marginalSource = nuclearGW >= demandGW ? 'Nuclear' : 'Solar / Wind';
      }
    }

    // Allocate curtailment proportionally between solar and wind
    const vreAvail = solarAvailGW + windAvailGW;
    const vreCurtailed = Math.min(curtailedGW, vreAvail);
    const solarCurtailed = vreAvail > 0 ? vreCurtailed * (solarAvailGW / vreAvail) : 0;
    const windCurtailed = vreAvail > 0 ? vreCurtailed * (windAvailGW / vreAvail) : 0;

    // Synchronous inertia calculation (50 Hz grid):
    // H = 4.5s for Nuclear & Gas turbines, 3.5s for PHS hydro turbines/pumps, 0s for Solar/Wind/LFP
    const syncWeightedH =
      nuclearGW * 4.5 +
      gasGW * 4.5 +
      (phsDischargeGW + phsChargeGW) * 3.5;
    const inertiaSec = demandGW > 0 ? syncWeightedH / demandGW : 0;
    // RoCoF for a 5% generation trip: df/dt = f0 * dP / (2 * H * Sn) = 50 * 0.05 / (2 * H)
    const effectiveH = Math.max(inertiaSec, 0.15);
    const rocofHzPerSec = (50 * 0.05) / (2 * effectiveH);

    if (step >= 24) {
      day2Points.push({
        hour,
        label: `${String(hour).padStart(2, '0')}:00`,
        demandGW,
        nuclearGW,
        windAvailGW,
        solarAvailGW,
        windUsedGW: Math.max(0, windAvailGW - windCurtailed),
        solarUsedGW: Math.max(0, solarAvailGW - solarCurtailed),
        netLoadGW,
        lfpDischargeGW,
        lfpChargeGW,
        phsDischargeGW,
        phsChargeGW,
        gasGW,
        curtailedGW,
        unservedGW,
        lfpSocPct: inputs.lfpGWh > 0 ? (lfpEnergyGWh / inputs.lfpGWh) * 100 : 0,
        phsSocPct: inputs.phsGWh > 0 ? (phsEnergyGWh / inputs.phsGWh) * 100 : 0,
        inertiaSec,
        rocofHzPerSec,
        marginalSource,
      });
    }
  }

  // Aggregate Day 2 totals
  let totalDemandGWh = 0;
  let unservedGWh = 0;
  let curtailedGWh = 0;
  let nuclearGWh = 0;
  let solarAvailGWh = 0;
  let windAvailGWh = 0;
  let solarUsedGWh = 0;
  let windUsedGWh = 0;
  let gasGWh = 0;
  let lfpDischargeGWh = 0;
  let lfpChargeGWh = 0;
  let phsDischargeGWh = 0;
  let phsChargeGWh = 0;
  let deficitHours = 0;
  let minNetLoadGW = Infinity;
  let maxNetLoadGW = -Infinity;
  let peakEveningRampGWPerHr = 0;
  let minInertiaSec = Infinity;
  let worstRocofHzPerSec = 0;

  for (let i = 0; i < day2Points.length; i++) {
    const p = day2Points[i];
    totalDemandGWh += p.demandGW;
    unservedGWh += p.unservedGW;
    curtailedGWh += p.curtailedGW;
    nuclearGWh += p.nuclearGW;
    solarAvailGWh += p.solarAvailGW;
    windAvailGWh += p.windAvailGW;
    solarUsedGWh += p.solarUsedGW;
    windUsedGWh += p.windUsedGW;
    gasGWh += p.gasGW;
    lfpDischargeGWh += p.lfpDischargeGW;
    lfpChargeGWh += p.lfpChargeGW;
    phsDischargeGWh += p.phsDischargeGW;
    phsChargeGWh += p.phsChargeGW;
    if (p.unservedGW > 0.01) deficitHours++;
    if (p.netLoadGW < minNetLoadGW) minNetLoadGW = p.netLoadGW;
    if (p.netLoadGW > maxNetLoadGW) maxNetLoadGW = p.netLoadGW;
    if (i > 0) {
      const ramp = p.netLoadGW - day2Points[i - 1].netLoadGW;
      if (ramp > peakEveningRampGWPerHr) peakEveningRampGWPerHr = ramp;
    }
    if (p.inertiaSec < minInertiaSec) minInertiaSec = p.inertiaSec;
    if (p.rocofHzPerSec > worstRocofHzPerSec) worstRocofHzPerSec = p.rocofHzPerSec;
  }

  const deliveredGWh = Math.max(0.001, totalDemandGWh - unservedGWh);
  const storageLossGWh = Math.max(
    0,
    lfpChargeGWh + phsChargeGWh - (lfpDischargeGWh + phsDischargeGWh)
  );
  const totalVreAvailGWh = solarAvailGWh + windAvailGWh;
  const curtailmentPctOfVre =
    totalVreAvailGWh > 0 ? (curtailedGWh / totalVreAvailGWh) * 100 : 0;

  // Clean share of delivered demand (everything except Gas)
  const cleanDeliveredGWh = Math.max(0, deliveredGWh - gasGWh);
  const cleanSharePct = Math.min(100, (cleanDeliveredGWh / deliveredGWh) * 100);

  // Cost accounting (daily USD):
  // Generation fixed costs are paid on installed capacity regardless of curtailment
  const solarDailyCostUSD = inputs.solarGW * 24 * SOLAR_CF * 1000 * LCOE_SOLAR;
  const windDailyCostUSD = inputs.windGW * 24 * WIND_CF * 1000 * LCOE_WIND;
  const nuclearDailyCostUSD = inputs.nuclearGW * 24 * NUCLEAR_CF * 1000 * LCOE_NUCLEAR;
  const gasDailyCostUSD =
    inputs.gasGW * GAS_FIXED_PER_GW_DAY_USD + gasGWh * 1000 * GAS_VAR_PER_MWH_USD;

  // Storage cost: LCOS on throughput + standby capital floor on installed GWh
  const lfpDailyCostUSD = Math.max(
    inputs.lfpGWh * LFP_STANDBY_PER_GWH_DAY_USD,
    lfpDischargeGWh * 1000 * LFP_LCOS_USD_MWH
  );
  const phsDailyCostUSD = Math.max(
    inputs.phsGWh * PHS_STANDBY_PER_GWH_DAY_USD,
    phsDischargeGWh * 1000 * PHS_LCOS_USD_MWH
  );

  const totalGenAvailableMWh = Math.max(
    1,
    (solarAvailGWh + windAvailGWh + nuclearGWh + gasGWh) * 1000
  );
  const totalGenOnlyCostUSD =
    solarDailyCostUSD + windDailyCostUSD + nuclearDailyCostUSD + gasDailyCostUSD;

  // Headline LCOE: generation cost divided by total available generation (ignores curtailment & storage)
  const headlineLcoeUsdMWh = totalGenOnlyCostUSD / totalGenAvailableMWh;

  // True Firm Power LCOE: all generation + storage costs divided by actually delivered MWh
  const totalSystemCostUSD =
    totalGenOnlyCostUSD + lfpDailyCostUSD + phsDailyCostUSD;
  const firmLcoeUsdMWh = totalSystemCostUSD / (deliveredGWh * 1000);
  const firmingPremiumUsdMWh = Math.max(0, firmLcoeUsdMWh - headlineLcoeUsdMWh);

  // Inertia status
  let inertiaStatus: 'Nominal' | 'Tight' | 'Low-Inertia Risk' = 'Nominal';
  if (minInertiaSec < 1.5) inertiaStatus = 'Low-Inertia Risk';
  else if (minInertiaSec < 2.5) inertiaStatus = 'Tight';

  // Spatial land footprint (km²) from typical spatial power densities
  // Nuclear: 1 km²/GW avg; Gas: 2.5 km²/GW avg; Solar: 100 km²/GW avg (~20 km²/GWp); Wind: 750 km²/GW avg (~250 km²/GW); LFP: 0.025 km²/GWh
  const landFootprintKm2 =
    inputs.nuclearGW * NUCLEAR_CF * 1.0 +
    inputs.gasGW * 0.55 * 2.5 +
    inputs.solarGW * SOLAR_CF * 100 +
    inputs.windGW * WIND_CF * 750 +
    inputs.lfpGWh * 0.025 +
    inputs.phsGWh * 0.12;

  return {
    hourly: day2Points,
    totalDemandGWh,
    deliveredGWh,
    unservedGWh,
    curtailedGWh,
    curtailmentPctOfVre,
    cleanSharePct,
    nuclearGWh,
    solarDeliveredGWh: solarUsedGWh,
    windDeliveredGWh: windUsedGWh,
    gasGWh,
    lfpDischargeGWh,
    phsDischargeGWh,
    storageLossGWh,
    headlineLcoeUsdMWh,
    firmLcoeUsdMWh,
    firmingPremiumUsdMWh,
    peakEveningRampGWPerHr,
    minNetLoadGW,
    maxNetLoadGW,
    minInertiaSec,
    worstRocofHzPerSec,
    inertiaStatus,
    landFootprintKm2,
    deficitHours,
  };
}

export function buildDispatchCsv(inputs: GridInputs, summary: GridSummary): string {
  const headers = [
    'Hour',
    'Demand_GW',
    'Nuclear_GW',
    'Solar_Delivered_GW',
    'Wind_Delivered_GW',
    'LFP_Discharge_GW',
    'LFP_Charge_GW',
    'PHS_Discharge_GW',
    'PHS_Charge_GW',
    'Gas_GW',
    'Curtailed_GW',
    'Unserved_GW',
    'Net_Load_Duck_GW',
    'LFP_SoC_Pct',
    'PHS_SoC_Pct',
    'Inertia_H_sec',
    'RoCoF_Hz_per_s',
    'Marginal_Source',
  ];
  const rows = summary.hourly.map((h) => [
    h.label,
    h.demandGW.toFixed(2),
    h.nuclearGW.toFixed(2),
    h.solarUsedGW.toFixed(2),
    h.windUsedGW.toFixed(2),
    h.lfpDischargeGW.toFixed(2),
    h.lfpChargeGW.toFixed(2),
    h.phsDischargeGW.toFixed(2),
    h.phsChargeGW.toFixed(2),
    h.gasGW.toFixed(2),
    h.curtailedGW.toFixed(2),
    h.unservedGW.toFixed(2),
    h.netLoadGW.toFixed(2),
    h.lfpSocPct.toFixed(1),
    h.phsSocPct.toFixed(1),
    h.inertiaSec.toFixed(2),
    h.rocofHzPerSec.toFixed(2),
    `"${h.marginalSource}"`,
  ]);
  const meta = `# Power Grid Dispatch Export (Profile=${inputs.profileId}, Solar=${inputs.solarGW}GW, Wind=${inputs.windGW}GW, Nuclear=${inputs.nuclearGW}GW, Gas=${inputs.gasGW}GW, LFP=${inputs.lfpGWh}GWh, PHS=${inputs.phsGWh}GWh, FirmLCOE=$${summary.firmLcoeUsdMWh.toFixed(2)}/MWh)`;
  return [meta, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
