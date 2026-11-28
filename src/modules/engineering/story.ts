import type { Story } from '../../shell/Shell';
// Plain-English 3-beat intro shown above this tab.
const story: Story = {
  what:
    'A finished part can cost far more than the metal inside it (one valve here is 1,333 times). Three small simulators look at where that money goes: the markup on parts, a factory line slowed by steps it never needed, and rockets thrown away after one flight.',
  how:
    'Each runs open formulas in your browser. Price divided by material value gives the markup. The slowest station sets the output of the whole line. For rockets, the rocket equation (how much fuel you need to reach orbital speed) is paired with the build cost shared over many flights.',
  tryThis:
    'Click the "Aerospace Hydraulic Valve" preset: a $12,000 part made from about $9 of metal, a 1,333x markup. Then open "Rocket launch cost" and drag Flights per rocket from 1 to 100 to watch the price per kg fall from about $2,283 to about $40.',
};
export default story;
