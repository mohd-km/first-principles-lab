import type { Story } from '../../shell/Shell';
// Plain-English 3-beat intro shown above this tab.
const story: Story = {
  what:
    'Why things cost what they cost. Three small simulators compare a part\'s price with the raw materials inside it, show how a factory line speeds up when you remove needless steps, and show why reusable rockets make space far cheaper.',
  how:
    'Each one runs simple, open formulas in your browser: price divided by material value, output set by the slowest station on the line, and the rocket equation (how much fuel a rocket needs to reach orbital speed) combined with build cost shared over many flights.',
  tryThis:
    'Click the "Aerospace Hydraulic Valve" preset: a $12,000 part made from about $9 of metal, a 1,333x markup. Then open "Rocket launch cost" and drag Flights per rocket from 1 to 100 to watch the price per kg fall from about $2,283 to about $40.',
};
export default story;
