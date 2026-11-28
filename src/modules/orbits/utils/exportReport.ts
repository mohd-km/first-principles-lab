import {
  BAND_PRESETS,
  LinkBudgetResult,
  ORBIT_PRESETS,
  OrbitMetrics,
  WeatherCondition,
  computeLinkBudget,
  computeOrbitMetrics,
  formatThroughput,
} from '../physics/astrodynamics';

function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCsvReport(
  orbit: OrbitMetrics,
  link: LinkBudgetResult,
  weather: WeatherCondition
): void {
  const header = [
    'profile',
    'altitude_km',
    'slant_range_km',
    'velocity_km_s',
    'period_min',
    'rtt_ms',
    'total_delta_v_km_s',
    'freq_ghz',
    'bandwidth_mhz',
    'dish_gain_dbi',
    'fspl_db',
    'snr_db',
    'shannon_mbps',
    'practical_ldpc_mbps',
  ].join(',');

  const rows: string[] = [];

  // Current active configuration first
  rows.push(
    [
      'active_config',
      orbit.altitudeKm.toFixed(0),
      link.distanceKm.toFixed(1),
      orbit.orbitalVelocityKmS.toFixed(3),
      orbit.periodMinutes.toFixed(2),
      orbit.singleHopRttMs.toFixed(2),
      orbit.totalLaunchDeltaVKmS.toFixed(3),
      link.frequencyGHz.toFixed(2),
      link.bandwidthMHz.toFixed(0),
      link.dishGainDbi.toFixed(1),
      link.fsplDb.toFixed(2),
      link.snrDb.toFixed(2),
      link.shannonCapacityMbps.toFixed(2),
      link.practicalLdpcMbps.toFixed(2),
    ].join(',')
  );

  // Reference sweep across orbit presets x band presets
  for (const op of ORBIT_PRESETS) {
    const om = computeOrbitMetrics(op.altitudeKm, orbit.elevationDeg);
    for (const bp of BAND_PRESETS) {
      const lm = computeLinkBudget({
        frequencyGHz: bp.frequencyGHz,
        bandwidthMHz: bp.defaultBandwidthMHz,
        dishGainDbi: bp.defaultDishGainDbi,
        eirpDbw: bp.defaultEirpDbw,
        distanceKm: om.slantRangeKm,
        weather,
      });
      rows.push(
        [
          `${op.id}_${bp.id}`,
          om.altitudeKm.toFixed(0),
          om.slantRangeKm.toFixed(1),
          om.orbitalVelocityKmS.toFixed(3),
          om.periodMinutes.toFixed(2),
          om.singleHopRttMs.toFixed(2),
          om.totalLaunchDeltaVKmS.toFixed(3),
          lm.frequencyGHz.toFixed(2),
          lm.bandwidthMHz.toFixed(0),
          lm.dishGainDbi.toFixed(1),
          lm.fsplDb.toFixed(2),
          lm.snrDb.toFixed(2),
          lm.shannonCapacityMbps.toFixed(2),
          lm.practicalLdpcMbps.toFixed(2),
        ].join(',')
      );
    }
  }

  triggerDownload('orbital-link-lab-report.csv', `${header}\n${rows.join('\n')}\n`, 'text/csv;charset=utf-8');
}

export function exportJsonReport(
  orbit: OrbitMetrics,
  link: LinkBudgetResult,
  weather: WeatherCondition
): void {
  const payload = {
    lab: 'Applied Physics & Deep-Tech Labs · orbits (labs.mohammed-km.in)',
    author: 'Mohammed KM',
    exportedAt: new Date().toISOString(),
    weather,
    orbit,
    linkBudget: link,
  };
  triggerDownload(
    'orbital-link-lab-snapshot.json',
    JSON.stringify(payload, null, 2),
    'application/json;charset=utf-8'
  );
}

export function exportMarkdownReport(
  orbit: OrbitMetrics,
  link: LinkBudgetResult,
  weather: WeatherCondition
): void {
  const md = [
    '# Orbits & Link Budget — Snapshot',
    '',
    'Generated client-side by Applied Physics & Deep-Tech Labs (https://labs.mohammed-km.in/#orbits), Mohammed KM.',
    '',
    '## 1. Orbital Mechanics Telemetry',
    `- **Regime:** ${orbit.regime}`,
    `- **Altitude:** ${Math.round(orbit.altitudeKm).toLocaleString()} km (Slant range at ${orbit.elevationDeg} deg elevation: ${Math.round(orbit.slantRangeKm).toLocaleString()} km)`,
    `- **Orbital Velocity:** ${orbit.orbitalVelocityKmS.toFixed(2)} km/s (${Math.round(orbit.orbitalVelocityKmH).toLocaleString()} km/h)`,
    `- **Orbital Period:** ${orbit.periodMinutes.toFixed(1)} min (${orbit.orbitsPerDay.toFixed(2)} orbits/day)`,
    `- **Round-Trip Propagation Latency:** ${orbit.singleHopRttMs.toFixed(2)} ms (1-way: ${orbit.oneWayLatencyMs.toFixed(2)} ms; gateway hop: ${orbit.gatewayHopRttMs.toFixed(2)} ms)`,
    `- **Required Delta-V:** ${orbit.totalLaunchDeltaVKmS.toFixed(2)} km/s (Hohmann transfer from 550 km LEO: +${orbit.hohmannTotalKmS.toFixed(2)} km/s)`,
    `- **Local Gravity:** ${orbit.gravityPercent.toFixed(1)}% of g0 (${orbit.gravityMs2.toFixed(2)} m/s^2)`,
    '',
    '## 2. Shannon Wireless Link Budget',
    `- **Carrier Frequency:** ${link.frequencyGHz.toFixed(1)} GHz (wavelength ${link.wavelengthMm.toFixed(1)} mm)`,
    `- **Channel Bandwidth:** ${link.bandwidthMHz} MHz`,
    `- **Link Distance:** ${Math.round(link.distanceKm).toLocaleString()} km | **Weather:** ${weather}`,
    `- **Satellite EIRP:** ${link.eirpDbw} dBW | **Receiver Gain:** ${link.dishGainDbi} dBi`,
    `- **Free-Space Path Loss (FSPL):** ${link.fsplDb.toFixed(2)} dB (Atm + Rain: ${(link.atmLossDb + link.rainFadeDb).toFixed(2)} dB)`,
    `- **Received Power:** ${link.receivedPowerDbw.toFixed(2)} dBW | **Thermal Noise Floor:** ${link.noiseFloorDbw.toFixed(2)} dBW`,
    `- **SNR:** ${link.snrDb.toFixed(2)} dB (${link.modulationScheme})`,
    `- **Shannon Capacity:** ${formatThroughput(link.shannonCapacityMbps)} (${link.spectralEfficiencyBpsHz.toFixed(2)} bits/s/Hz)`,
    `- **Practical LDPC Throughput:** ${formatThroughput(link.practicalLdpcMbps)}`,
    '',
  ].join('\n');

  triggerDownload('orbital-link-lab-snapshot.md', md, 'text/markdown;charset=utf-8');
}
