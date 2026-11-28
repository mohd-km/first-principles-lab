import { initIdiotIndex } from './tabs/idiotIndex.js';
import { initFactorySim } from './tabs/factorySim.js';
import { initRocketSim } from './tabs/rocketSim.js';

const SUBS = [
  { key: 'idiot', idx: '01', label: 'Price vs raw materials' },
  { key: 'factory', idx: '02', label: 'Factory line' },
  { key: 'rocket', idx: '03', label: 'Rocket launch cost' },
];

// Renders the three engineering simulators into `root` with an internal sub-switch.
export function mountEngineering(root) {
  root.innerHTML = `
    <nav class="tab-bar sub-switch" role="tablist" aria-label="Engineering simulators">
      ${SUBS.map((s, i) => `<button type="button" class="tab-btn${i === 0 ? ' is-active' : ''}" role="tab" aria-selected="${i === 0}" data-sub="${s.key}"><span class="tab-index">${s.idx}</span><span class="tab-label">${s.label}</span></button>`).join('')}
    </nav>
    ${SUBS.map((s, i) => `<section class="tab-panel${i === 0 ? ' is-active' : ''}" data-panel="${s.key}" role="tabpanel"${i === 0 ? '' : ' hidden'}></section>`).join('')}
  `;
  const panel = (k) => root.querySelector(`[data-panel="${k}"]`);
  initIdiotIndex(panel('idiot'));
  const factory = initFactorySim(panel('factory'));
  initRocketSim(panel('rocket'));

  let sub = 'idiot';
  let onScreen = false;
  const sync = () => factory.setVisible(sub === 'factory' && onScreen);

  // Pause the conveyor animation whenever the factory is off-screen or its shell tab is hidden.
  const io = new IntersectionObserver((entries) => {
    onScreen = entries.some((e) => e.isIntersecting);
    sync();
  });
  io.observe(panel('factory'));

  const btns = Array.from(root.querySelectorAll('[data-sub]'));
  btns.forEach((btn) =>
    btn.addEventListener('click', () => {
      sub = btn.dataset.sub;
      btns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
      });
      SUBS.forEach((s) => {
        const p = panel(s.key);
        p.hidden = s.key !== sub;
        p.classList.toggle('is-active', s.key === sub);
      });
      sync();
    }),
  );

  return () => {
    io.disconnect();
    factory.setVisible(false);
    root.innerHTML = '';
  };
}
