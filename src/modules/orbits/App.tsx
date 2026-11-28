import './styles.css';
import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  BAND_PRESETS,
  FrequencyBandId,
  WeatherCondition,
  computeLinkBudget,
  computeOrbitMetrics,
} from './physics/astrodynamics';
import { OrbitalCanvas } from './components/OrbitalCanvas';
import { LinkBudgetLab } from './components/LinkBudgetLab';
import { ReferenceDrawers } from './components/ReferenceDrawers';
import {
  exportCsvReport,
  exportJsonReport,
  exportMarkdownReport,
} from './utils/exportReport';

export const App: React.FC = () => {
  // Lab 1: Orbital Mechanics state (default: 550 km Starlink LEO shell, 45 deg elevation)
  const [altitudeKm, setAltitudeKm] = useState<number>(550);
  const [elevationDeg, setElevationDeg] = useState<number>(45);

  // Lab 2: Shannon Wireless Link-Budget state (default: Ku-band 12 GHz, 240 MHz, 34 dBi phased array)
  const [bandId, setBandId] = useState<FrequencyBandId>('Ku');
  const [frequencyGHz, setFrequencyGHz] = useState<number>(12.0);
  const [bandwidthMHz, setBandwidthMHz] = useState<number>(240);
  const [dishGainDbi, setDishGainDbi] = useState<number>(34);
  const [eirpDbw, setEirpDbw] = useState<number>(50);
  const [weather, setWeather] = useState<WeatherCondition>('clear');
  const [coupleToOrbit, setCoupleToOrbit] = useState<boolean>(true);
  const [manualDistanceKm, setManualDistanceKm] = useState<number>(750);

  const orbitMetrics = useMemo(
    () => computeOrbitMetrics(altitudeKm, elevationDeg),
    [altitudeKm, elevationDeg]
  );

  const effectiveDistanceKm = coupleToOrbit ? orbitMetrics.slantRangeKm : manualDistanceKm;

  const linkResult = useMemo(
    () =>
      computeLinkBudget({
        frequencyGHz,
        bandwidthMHz,
        dishGainDbi,
        eirpDbw,
        distanceKm: effectiveDistanceKm,
        weather,
      }),
    [frequencyGHz, bandwidthMHz, dishGainDbi, eirpDbw, effectiveDistanceKm, weather]
  );

  const handleSelectBand = (id: FrequencyBandId) => {
    const preset = BAND_PRESETS.find((b) => b.id === id);
    if (!preset) return;
    setBandId(id);
    setFrequencyGHz(preset.frequencyGHz);
    setBandwidthMHz(preset.defaultBandwidthMHz);
    setDishGainDbi(preset.defaultDishGainDbi);
    setEirpDbw(preset.defaultEirpDbw);
  };

  const handleFrequencyChange = (f: number) => {
    setFrequencyGHz(f);
    if (f < 6) setBandId('S');
    else if (f < 20) setBandId('Ku');
    else setBandId('Ka');
  };

  return (
    <div className="page-shell">
      <div className="site-header">
        <h2 className="module-heading">orbits & link budget</h2>
        <div className="header-actions" aria-label="Export simulation reports">
          <button
            type="button"
            className="btn"
            onClick={() => exportCsvReport(orbitMetrics, linkResult, weather)}
          >
            <Download size={14} aria-hidden="true" />
            <span>CSV Sweep</span>
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => exportMarkdownReport(orbitMetrics, linkResult, weather)}
          >
            <Download size={14} aria-hidden="true" />
            <span>Markdown</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => exportJsonReport(orbitMetrics, linkResult, weather)}
          >
            <Download size={14} aria-hidden="true" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      <main className="lab-grid">
        <OrbitalCanvas
          altitudeKm={altitudeKm}
          elevationDeg={elevationDeg}
          metrics={orbitMetrics}
          onAltitudeChange={setAltitudeKm}
          onElevationChange={setElevationDeg}
        />

        <LinkBudgetLab
          bandId={bandId}
          frequencyGHz={frequencyGHz}
          bandwidthMHz={bandwidthMHz}
          dishGainDbi={dishGainDbi}
          eirpDbw={eirpDbw}
          weather={weather}
          coupleToOrbit={coupleToOrbit}
          manualDistanceKm={manualDistanceKm}
          orbitSlantRangeKm={orbitMetrics.slantRangeKm}
          result={linkResult}
          onSelectBand={handleSelectBand}
          onFrequencyChange={handleFrequencyChange}
          onBandwidthChange={setBandwidthMHz}
          onDishGainChange={setDishGainDbi}
          onEirpChange={setEirpDbw}
          onWeatherChange={setWeather}
          onCoupleToggle={setCoupleToOrbit}
          onManualDistanceChange={setManualDistanceKm}
        />
      </main>

      <ReferenceDrawers />

    </div>
  );
};

export default App;
