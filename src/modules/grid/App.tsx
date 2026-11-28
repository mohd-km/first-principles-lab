import './styles.css';
import React, { useMemo, useState } from 'react';
import { GRID_PRESETS, GridInputs, simulateGridDispatch } from './engine/gridDispatch';
import { HvInputs } from './engine/hvTransmission';
import { GridDispatchLab } from './components/GridDispatchLab';
import { HvTransmissionLab } from './components/HvTransmissionLab';

type ActiveView = 'both' | 'grid' | 'hv';

export const App: React.FC = () => {
  const [view, setView] = useState<ActiveView>('both');

  const [gridInputs, setGridInputs] = useState<GridInputs>({
    ...GRID_PRESETS[0].inputs,
  });

  const [hvInputs, setHvInputs] = useState<HvInputs>({
    powerMW: 1000,
    distanceKm: 800,
    powerFactor: 0.95,
    corridor: 'overhead',
    focusClassId: 'ac400',
  });

  const gridSummary = useMemo(() => simulateGridDispatch(gridInputs), [gridInputs]);

  return (
    <div className="page-shell">
      <div className="masthead">
        <nav className="nav-tabs" aria-label="Simulator modules">
          <button
            type="button"
            className={`nav-tab ${view === 'both' ? 'active' : ''}`}
            onClick={() => setView('both')}
          >
            Both labs
          </button>
          <button
            type="button"
            className={`nav-tab ${view === 'grid' ? 'active' : ''}`}
            onClick={() => setView('grid')}
          >
            <span className="nav-tab-num">01</span> A day on the grid
          </button>
          <button
            type="button"
            className={`nav-tab ${view === 'hv' ? 'active' : ''}`}
            onClick={() => setView('hv')}
          >
            <span className="nav-tab-num">02</span> AC vs DC power lines
          </button>
        </nav>
      </div>

      <main>
        {(view === 'both' || view === 'grid') && (
          <GridDispatchLab
            inputs={gridInputs}
            onChange={setGridInputs}
            summary={gridSummary}
          />
        )}

        {(view === 'both' || view === 'hv') && (
          <HvTransmissionLab
            inputs={hvInputs}
            onChange={setHvInputs}
            gridInputs={gridInputs}
            gridSummary={gridSummary}
          />
        )}
      </main>

    </div>
  );
};

export default App;
