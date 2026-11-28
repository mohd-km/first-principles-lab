// First-principles astrodynamics and RF link-budget engine
// Grounded in standard astrodynamics references:
// - satellite_constellations_orbital_mechanics_and_rocketry.md
// - wireless_spectrum_and_network_data_rates.md
// - telecom_mobile_generations_and_link_protocols.md

export const EARTH_RADIUS_KM = 6371;
export const EARTH_RADIUS_M = 6.371e6;
export const MU_EARTH = 3.986004418e14; // m^3 / s^2
export const SPEED_OF_LIGHT_KM_S = 299792.458; // km/s
export const FIBER_REFRACTIVE_INDEX = 1.468;
export const SPEED_OF_LIGHT_FIBER_KM_S = SPEED_OF_LIGHT_KM_S / FIBER_REFRACTIVE_INDEX; // ~204,218 km/s
export const G0 = 9.80665; // m/s^2
export const BOLTZMANN_K = 1.380649e-23; // J/K
export const LEO_REF_ALTITUDE_KM = 550; // Starlink Gen1 reference shell
export const LEO_LAUNCH_DELTA_V_KM_S = 9.4; // 9.3-9.5 km/s incl. gravity & drag losses

export interface OrbitPreset {
  id: string;
  label: string;
  shortLabel: string;
  altitudeKm: number;
  regime: 'LEO' | 'MEO' | 'GEO';
  mission: string;
  deorbitNote: string;
}

export const ORBIT_PRESETS: OrbitPreset[] = [
  {
    id: 'iss',
    label: 'ISS (400 km)',
    shortLabel: 'ISS 400 km',
    altitudeKm: 400,
    regime: 'LEO',
    mission: 'Crewed station, Earth imaging',
    deorbitNote: 'Re-boosted periodically; decays in months without thrust',
  },
  {
    id: 'starlink-v2',
    label: 'Starlink 2026 Shell (480 km)',
    shortLabel: 'LEO 480 km',
    altitudeKm: 480,
    regime: 'LEO',
    mission: 'Lowered 2026 broadband shell (~4,400 satellites)',
    deorbitNote: 'Passive atmospheric de-orbit in ~2-3 years',
  },
  {
    id: 'starlink',
    label: 'Starlink Gen1 (550 km)',
    shortLabel: 'LEO 550 km',
    altitudeKm: 550,
    regime: 'LEO',
    mission: 'Low-latency broadband mesh (~15 orbits/day)',
    deorbitNote: 'Passive atmospheric burn-up in 3-5 years',
  },
  {
    id: 'gps',
    label: 'GPS MEO (20,200 km)',
    shortLabel: 'MEO 20,200 km',
    altitudeKm: 20200,
    regime: 'MEO',
    mission: 'Global navigation timing (Cs/Rb atomic clocks)',
    deorbitNote: 'Graveyard orbit; persists indefinitely',
  },
  {
    id: 'geo',
    label: 'Geostationary (35,786 km)',
    shortLabel: 'GEO 35,786 km',
    altitudeKm: 35786,
    regime: 'GEO',
    mission: 'Fixed-dish TV & continental backhaul',
    deorbitNote: 'Persists for millions of years without graveyard boost',
  },
];

export interface OrbitMetrics {
  altitudeKm: number;
  radiusKm: number;
  regime: 'LEO' | 'MEO' | 'GEO';
  orbitalVelocityKmS: number;
  orbitalVelocityKmH: number;
  escapeVelocityKmS: number;
  periodSeconds: number;
  periodMinutes: number;
  periodHours: number;
  orbitsPerDay: number;
  gravityMs2: number;
  gravityPercent: number;
  elevationDeg: number;
  slantRangeKm: number;
  oneWayLatencyMs: number;
  singleHopRttMs: number; // 2d / c
  gatewayHopRttMs: number; // 4d / c (user -> sat -> gateway -> sat -> user)
  hohmannDv1KmS: number;
  hohmannDv2KmS: number;
  hohmannTotalKmS: number;
  totalLaunchDeltaVKmS: number;
  methaloxMassFractionPct: number; // Single-stage reference at Isp = 350 s
  groundPassMinutes: number | null; // Approximate horizon-to-horizon pass at >= 25 deg
  footprintRadiusKm: number;
}

export function classifyRegime(altitudeKm: number): 'LEO' | 'MEO' | 'GEO' {
  if (altitudeKm <= 2000) return 'LEO';
  if (altitudeKm < 34000) return 'MEO';
  return 'GEO';
}

export function computeSlantRangeKm(altitudeKm: number, elevationDeg: number): number {
  const elRad = (elevationDeg * Math.PI) / 180;
  const sinEl = Math.sin(elRad);
  const re = EARTH_RADIUS_KM;
  return Math.sqrt(re * re * sinEl * sinEl + 2 * re * altitudeKm + altitudeKm * altitudeKm) - re * sinEl;
}

export function computeOrbitMetrics(altitudeKm: number, elevationDeg: number): OrbitMetrics {
  const h = Math.max(200, Math.min(35786, altitudeKm));
  const rKm = EARTH_RADIUS_KM + h;
  const rM = rKm * 1000;

  // Circular velocity: v = sqrt(mu / r)
  const vMs = Math.sqrt(MU_EARTH / rM);
  const vKmS = vMs / 1000;
  const vKmH = vKmS * 3600;
  const escapeKmS = vKmS * Math.SQRT2;

  // Orbital period: T = 2*pi*sqrt(r^3 / mu)
  const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(rM, 3) / MU_EARTH);
  const periodMinutes = periodSeconds / 60;
  const periodHours = periodSeconds / 3600;
  const orbitsPerDay = 86164.0905 / periodSeconds; // Sidereal day

  // Gravity remaining: g(h) = g0 * (R / (R+h))^2
  const gravityRatio = Math.pow(EARTH_RADIUS_KM / rKm, 2);
  const gravityMs2 = G0 * gravityRatio;
  const gravityPercent = gravityRatio * 100;

  // Slant range & light-speed propagation latency
  const slantRangeKm = computeSlantRangeKm(h, elevationDeg);
  const oneWayLatencyMs = (slantRangeKm / SPEED_OF_LIGHT_KM_S) * 1000;
  const singleHopRttMs = oneWayLatencyMs * 2;
  const gatewayHopRttMs = oneWayLatencyMs * 4;

  // Hohmann transfer from 550 km LEO parking orbit to target altitude h
  const r1M = (EARTH_RADIUS_KM + LEO_REF_ALTITUDE_KM) * 1000;
  const r2M = rM;
  let dv1KmS = 0;
  let dv2KmS = 0;
  if (Math.abs(r2M - r1M) > 1000) {
    const dv1Ms = Math.abs(Math.sqrt(MU_EARTH / r1M) * (Math.sqrt((2 * r2M) / (r1M + r2M)) - 1));
    const dv2Ms = Math.abs(Math.sqrt(MU_EARTH / r2M) * (1 - Math.sqrt((2 * r1M) / (r1M + r2M))));
    dv1KmS = dv1Ms / 1000;
    dv2KmS = dv2Ms / 1000;
  }
  const hohmannTotalKmS = dv1KmS + dv2KmS;
  // If below 550 km, launch requires slightly less delta-v; above 550 km, add Hohmann transfer
  const totalLaunchDeltaVKmS =
    h >= LEO_REF_ALTITUDE_KM
      ? LEO_LAUNCH_DELTA_V_KM_S + hohmannTotalKmS
      : Math.max(9.1, LEO_LAUNCH_DELTA_V_KM_S - hohmannTotalKmS * 0.5);

  // Tsiolkovsky propellant mass fraction for Methalox avg Isp = 350 s (matching SSTO calculation in research file)
  const ispRef = 350;
  const massFraction = 1 - Math.exp(-(totalLaunchDeltaVKmS * 1000) / (ispRef * G0));

  // Footprint central half-angle at minimum elevation (25 deg)
  const minElRad = (25 * Math.PI) / 180;
  const cosMinEl = Math.cos(minElRad);
  const sinAlpha = (EARTH_RADIUS_KM / rKm) * cosMinEl;
  const centralHalfAngleRad = Math.max(0.01, Math.PI / 2 - minElRad - Math.asin(Math.min(1, sinAlpha)));
  const footprintRadiusKm = EARTH_RADIUS_KM * centralHalfAngleRad;

  // Approximate pass duration for non-GEO orbits across 25 deg visibility cone
  const omegaSat = (2 * Math.PI) / periodSeconds;
  const omegaEarth = (2 * Math.PI) / 86164.0905;
  const relOmega = Math.abs(omegaSat - omegaEarth);
  const groundPassMinutes =
    relOmega < 1e-6 ? null : ((2 * centralHalfAngleRad) / relOmega) / 60;

  return {
    altitudeKm: h,
    radiusKm: rKm,
    regime: classifyRegime(h),
    orbitalVelocityKmS: vKmS,
    orbitalVelocityKmH: vKmH,
    escapeVelocityKmS: escapeKmS,
    periodSeconds,
    periodMinutes,
    periodHours,
    orbitsPerDay,
    gravityMs2,
    gravityPercent,
    elevationDeg,
    slantRangeKm,
    oneWayLatencyMs,
    singleHopRttMs,
    gatewayHopRttMs,
    hohmannDv1KmS: dv1KmS,
    hohmannDv2KmS: dv2KmS,
    hohmannTotalKmS,
    totalLaunchDeltaVKmS,
    methaloxMassFractionPct: massFraction * 100,
    groundPassMinutes,
    footprintRadiusKm,
  };
}

// --- Wireless Link-Budget & Shannon Capacity ---

export type FrequencyBandId = 'S' | 'Ku' | 'Ka';
export type WeatherCondition = 'clear' | 'light-rain' | 'heavy-rain';

export interface BandPreset {
  id: FrequencyBandId;
  name: string;
  frequencyGHz: number;
  rangeLabel: string;
  defaultBandwidthMHz: number;
  defaultDishGainDbi: number;
  defaultEirpDbw: number;
  rainFadeClearDb: number;
  rainFadeLightDb: number;
  rainFadeHeavyDb: number;
  atmLossDb: number;
  useCase: string;
}

export const BAND_PRESETS: BandPreset[] = [
  {
    id: 'S',
    name: 'S-band',
    frequencyGHz: 2.2,
    rangeLabel: '2.0 - 4.0 GHz',
    defaultBandwidthMHz: 20,
    defaultDishGainDbi: 18,
    defaultEirpDbw: 44,
    rainFadeClearDb: 0,
    rainFadeLightDb: 0.1,
    rainFadeHeavyDb: 0.3,
    atmLossDb: 0.1,
    useCase: 'Direct-to-device, telemetry, maritime; rain-immune',
  },
  {
    id: 'Ku',
    name: 'Ku-band',
    frequencyGHz: 12.0,
    rangeLabel: '10.7 - 12.7 GHz',
    defaultBandwidthMHz: 240,
    defaultDishGainDbi: 34,
    defaultEirpDbw: 50,
    rainFadeClearDb: 0,
    rainFadeLightDb: 1.8,
    rainFadeHeavyDb: 5.5,
    atmLossDb: 0.3,
    useCase: 'Starlink user downlink, direct-to-home TV; moderate rain fade',
  },
  {
    id: 'Ka',
    name: 'Ka-band',
    frequencyGHz: 28.0,
    rangeLabel: '26.5 - 40.0 GHz',
    defaultBandwidthMHz: 500,
    defaultDishGainDbi: 44,
    defaultEirpDbw: 56,
    rainFadeClearDb: 0,
    rainFadeLightDb: 4.5,
    rainFadeHeavyDb: 13.0,
    atmLossDb: 0.7,
    useCase: 'Starlink gateway backhaul, HTS broadband; strong rain fade',
  },
];

export interface LinkBudgetInput {
  frequencyGHz: number;
  bandwidthMHz: number;
  dishGainDbi: number;
  eirpDbw: number;
  distanceKm: number;
  weather: WeatherCondition;
  systemNoiseTempK?: number;
}

export interface LinkBudgetResult {
  wavelengthMm: number;
  fsplDb: number;
  atmLossDb: number;
  rainFadeDb: number;
  receivedPowerDbw: number;
  noiseFloorDbw: number;
  snrDb: number;
  snrLinear: number;
  spectralEfficiencyBpsHz: number;
  shannonCapacityMbps: number;
  practicalLdpcMbps: number; // ~75% of Shannon capacity with DVB-S2X / 5G NR LDPC framing
  modulationScheme: string;
  linkStatus: 'strong' | 'marginal' | 'outage';
  eirpDbw: number;
  dishGainDbi: number;
  distanceKm: number;
  frequencyGHz: number;
  bandwidthMHz: number;
}

export function estimateRainAndAtmLoss(frequencyGHz: number, weather: WeatherCondition): { atmLossDb: number; rainFadeDb: number } {
  // Smooth frequency-dependent attenuation grounded in ITU/research band characteristics
  const atmLossDb = 0.08 + 0.022 * frequencyGHz;
  if (weather === 'clear') {
    return { atmLossDb, rainFadeDb: 0 };
  }
  const fNorm = Math.max(0.5, frequencyGHz);
  if (weather === 'light-rain') {
    const rainFadeDb = Math.min(8, 0.015 * Math.pow(fNorm, 1.72));
    return { atmLossDb, rainFadeDb };
  }
  // Heavy rain
  const rainFadeDb = Math.min(20, 0.045 * Math.pow(fNorm, 1.72));
  return { atmLossDb, rainFadeDb };
}

export function computeLinkBudget(input: LinkBudgetInput): LinkBudgetResult {
  const fGHz = Math.max(1, Math.min(40, input.frequencyGHz));
  const bMHz = Math.max(1, Math.min(1000, input.bandwidthMHz));
  const dKm = Math.max(100, input.distanceKm);
  const tSys = input.systemNoiseTempK ?? 290;

  // Wavelength in mm: lambda = c / f
  const wavelengthMm = (SPEED_OF_LIGHT_KM_S * 1e6) / (fGHz * 1e9);

  // Free-space path loss: FSPL(dB) = 20*log10(d_km) + 20*log10(f_GHz) + 92.45
  const fsplDb = 20 * Math.log10(dKm) + 20 * Math.log10(fGHz) + 92.45;

  const { atmLossDb, rainFadeDb } = estimateRainAndAtmLoss(fGHz, input.weather);

  // Received power (dBW)
  const receivedPowerDbw = input.eirpDbw - fsplDb - atmLossDb - rainFadeDb + input.dishGainDbi;

  // Thermal noise floor: N = k_B * T_sys * B (in Watts -> dBW)
  const bHz = bMHz * 1e6;
  const noiseWatts = BOLTZMANN_K * tSys * bHz;
  const noiseFloorDbw = 10 * Math.log10(noiseWatts);

  // SNR
  const snrDb = receivedPowerDbw - noiseFloorDbw;
  const snrLinear = Math.pow(10, snrDb / 10);

  // Shannon-Hartley theorem: C = B * log2(1 + SNR)
  const spectralEfficiencyBpsHz = Math.log2(1 + snrLinear);
  const shannonCapacityMbps = bMHz * spectralEfficiencyBpsHz;

  // Practical LDPC-coded throughput (real modems close ~75% of Shannon above -2 dB SNR)
  const practicalFactor = snrDb < -2 ? 0 : snrDb < 3 ? 0.65 : 0.76;
  const practicalLdpcMbps = shannonCapacityMbps * practicalFactor;

  let modulationScheme = 'No Lock (< -2 dB)';
  let linkStatus: 'strong' | 'marginal' | 'outage' = 'outage';

  if (snrDb >= 20) {
    modulationScheme = '256-QAM + LDPC';
    linkStatus = 'strong';
  } else if (snrDb >= 14) {
    modulationScheme = '64-QAM + LDPC';
    linkStatus = 'strong';
  } else if (snrDb >= 9) {
    modulationScheme = '16-QAM / 16-APSK + LDPC';
    linkStatus = 'strong';
  } else if (snrDb >= 3) {
    modulationScheme = 'QPSK + LDPC';
    linkStatus = 'strong';
  } else if (snrDb >= -2) {
    modulationScheme = 'BPSK / Low-Rate LDPC';
    linkStatus = 'marginal';
  }

  return {
    wavelengthMm,
    fsplDb,
    atmLossDb,
    rainFadeDb,
    receivedPowerDbw,
    noiseFloorDbw,
    snrDb,
    snrLinear,
    spectralEfficiencyBpsHz,
    shannonCapacityMbps,
    practicalLdpcMbps,
    modulationScheme,
    linkStatus,
    eirpDbw: input.eirpDbw,
    dishGainDbi: input.dishGainDbi,
    distanceKm: dKm,
    frequencyGHz: fGHz,
    bandwidthMHz: bMHz,
  };
}

// Log-scale helpers for smooth LEO -> MEO -> GEO altitude slider
const MIN_ALT_LOG = Math.log10(200);
const MAX_ALT_LOG = Math.log10(35786);

export function altitudeToSlider(altitudeKm: number): number {
  const clamped = Math.max(200, Math.min(35786, altitudeKm));
  return ((Math.log10(clamped) - MIN_ALT_LOG) / (MAX_ALT_LOG - MIN_ALT_LOG)) * 1000;
}

export function sliderToAltitude(sliderVal: number): number {
  const t = Math.max(0, Math.min(1, sliderVal / 1000));
  const raw = Math.pow(10, MIN_ALT_LOG + t * (MAX_ALT_LOG - MIN_ALT_LOG));
  return Math.round(raw);
}

export function formatThroughput(mbps: number): string {
  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(2)} Gbps`;
  }
  if (mbps >= 10) {
    return `${mbps.toFixed(1)} Mbps`;
  }
  return `${mbps.toFixed(2)} Mbps`;
}
