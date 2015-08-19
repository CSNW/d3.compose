import {
  di,
  createHelper
} from '../helpers';
import Bars from './Bars';

/**
  Bars chart with values stacked on top of each other

  (See `Bars` for extensibility details)

  @example
  ```js
  var chart = d3.select('#chart').chart('Compose', function(data) {
    // Display bars for different series next to each other (adjacent: true)
    var xScale = {type: 'ordinal', adjacent: true, domain: [0, 1, 2]};

    return {
      charts: {
        stacked_output: {
          type: 'StackedBars',
          data: data.output,
          xScale: xScale,
          // yScale: ...,
          // other properties...
        }
      }
    };
  });

  // Single y-values
  chart.draw([10, 20, 30]);

  // Series (x,y) values
  chart.draw([
    {values: [{x: 0, y: 10}, {x: 1, y: 20}, {x: 2, y: 30}]},
    {values: [{x: 0, y: 30}, {x: 1, y: 20}, {x: 2, y: 10}]}
  ]);
  ```
  @class StackedBars
  @extends Bars
*/
var StackedBars = Bars.extend({
  transform: function(data) {
    // Re-initialize bar positions each time data changes
    this.bar_positions = [];
    return Bars.prototype.transform.call(this, data);
  },

  barHeight: di(function(chart, d, i) {
    var height = Math.abs(chart.y0() - chart.y.call(this, d, i));
    var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
    return height > 0 ? height - offset : 0;
  }),
  barY: di(function(chart, d, i) {
    var y = chart.y.call(this, d, i);
    var y0 = chart.y0();

    // Only handle positive y-values
    if (y > y0)
      return;

    if (chart.bar_positions.length <= i)
      chart.bar_positions.push(0);

    var previous = chart.bar_positions[i] || y0;
    var new_position = previous - (y0 - y);

    chart.bar_positions[i] = new_position;

    return new_position;
  })
});

var stackedBars = createHelper('StackedBars');

d3.chart().StackedBars = StackedBars;
export {
  StackedBars as default,
  stackedBars
};
