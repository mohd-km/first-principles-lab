import React from 'react';
import ReactDOM from 'react-dom/client';
import './shell/shell.css';
import { Shell, type ShellConfig } from './shell/Shell';
import DefaultTab from './modules/engineering/Module';
import engineeringStory from './modules/engineering/story';
import gridStory from './modules/grid/story';
import orbitsStory from './modules/orbits/story';

const config: ShellConfig = {
  pillar: 'worldview & physics',
  title: "Engineering, Energy & Space Lab",
  subtitle:
    "Three simulators built from basic physics: what a rocket and its parts should cost, how a power grid covers a full day of demand, and how high, how fast and how far a satellite can talk. Move a slider and the maths reruns in your browser.",
  footer: "Engineering, Energy & Space Lab · runs entirely in your browser · Mohammed KM",
  tabs: [
    {
      id: 'engineering', story: engineeringStory, label: 'Engineering', sub: 'part prices · factory · rocket cost', scope: 'engineering',
      provenance: [{ kind: 'model', label: 'simple cost, factory-speed & rocket-fuel formulas' }, { kind: 'real', label: 'approximate public material prices' }],
      component: DefaultTab,
      load: () => import('./modules/engineering/Module'),
    },
    {
      id: 'grid', story: gridStory, label: 'Power grid', sub: 'daily power mix · long-distance lines', scope: 'grid',
      provenance: [{ kind: 'model', label: 'hour-by-hour power plant model & wire heat-loss maths' }],
      load: () => import('./modules/grid/App'),
    },
    {
      id: 'orbits', story: orbitsStory, label: 'Orbits & links', sub: 'how high · how fast · how far', scope: 'orbits',
      provenance: [{ kind: 'model', label: 'orbit physics (Kepler, vis-viva)' }, { kind: 'model', label: 'radio signal maths (signal lost over distance, Shannon speed limit)' }],
      load: () => import('./modules/orbits/App'),
    },
  ],
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Shell config={config} />
  </React.StrictMode>,
);
