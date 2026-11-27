import './styles.css';
import { initIdiotIndex } from './tabs/idiotIndex.js';
import { initFactorySim } from './tabs/factorySim.js';
import { initRocketSim } from './tabs/rocketSim.js';

const panels = {
  idiot: document.getElementById('panel-idiot'),
  factory: document.getElementById('panel-factory'),
  rocket: document.getElementById('panel-rocket')
};

const tabs = Array.from(document.querySelectorAll('.tab-btn'));

const factoryController = initFactorySim(panels.factory);
initIdiotIndex(panels.idiot);
initRocketSim(panels.rocket);

function activateTab(tabKey) {
  tabs.forEach((btn) => {
    const active = btn.dataset.tab === tabKey;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });

  Object.entries(panels).forEach(([key, panel]) => {
    const active = key === tabKey;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });

  factoryController.setVisible(tabKey === 'factory');
}

tabs.forEach((btn) => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

// Pause factory animation when tab is hidden initially
factoryController.setVisible(false);
