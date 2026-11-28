import type { Story } from '../../shell/Shell';
// Plain-English 3-beat intro shown above this tab.
const story: Story = {
  what:
    'Why a grid full of cheap solar can still struggle after sunset, and why big power lines run at very high voltage.',
  how:
    'You choose the power plants and batteries. The model fills each hour of a day from the cheapest source first, counts wasted solar, blackouts, cost and how steady the grid stays. A second lab compares how much power AC and DC lines lose over distance.',
  tryThis:
    'Click the "California Duck Curve" scenario: the wasted solar (curtailment) jumps from 0.4% to 15.8%, and other plants must ramp up 17 GW per hour at sunset instead of 10.7.',
};
export default story;
