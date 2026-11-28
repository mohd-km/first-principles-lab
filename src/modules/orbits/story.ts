import type { Story } from '../../shell/Shell';
// Plain-English 3-beat intro shown above this tab.
const story: Story = {
  what: 'Why internet from low satellites feels fast and from high ones feels slow, and why reaching higher orbits costs so much more rocket fuel.',
  how: 'Real orbit physics (Kepler and Newton) turns a height into speed, lap time and signal delay. A radio link budget then adds up what the satellite sends, what is lost over distance and in rain, and what your dish catches, to give a top download speed (the Shannon limit).',
  tryThis: 'Click the "GEO 35,786 km" quick pick: the signal delay there and back jumps from about 5 ms to about 250 ms, and the top speed in the radio lab below falls from about 2.6 Gbps to about 180 Mbps, because the satellite is now 50 times further away.',
};
export default story;
