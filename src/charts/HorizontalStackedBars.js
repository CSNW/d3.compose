import {
  di,
  createHelper
} from '../helpers';
import HorizontalBars from './HorizontalBars';

/**
  Horizontal Stacked Bars

  (See `Bars` for extensibility details)

  @example
  ```js
  var chart = d3.select('#chart').chart('Compose', function(data) {
    // Display bars for different series next to each other (adjacent: true)
    var xScale = {type: 'ordinal', adjacent: true, domain: [0, 1, 2]};

    return {
      charts: {
        output: {
          type: 'HorizontalStackedBars',
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
  @class HorizontalStackedBars
  @extends HorizontalBars
*/
var HorizontalStackedBars = HorizontalBars.extend({
  transform: function(data) {
    // Re-initialize bar positions each time data changes
    this.bar_positions = [];
    return HorizontalBars.prototype.transform.call(this, data);
  },

  barWidth: di(function(chart, d, i) {
    var width = Math.abs(chart.x0() - chart.x.call(this, d, i));
    var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
    return width > 0 ? width - offset : 0;
  }),
  barX: di(function(chart, d, i) {
    var x = chart.x.call(this, d, i);
    var x0 = chart.x0();

    // Only handle positive x-values
    if (x < x0)
      return;

    if (chart.bar_positions.length <= i)
      chart.bar_positions.push(0);

    var previous = chart.bar_positions[i] || (x0 + chart.barOffset());
    var new_position = previous + (x - x0);

    chart.bar_positions[i] = new_position;

    return previous;
  })
});

var horizontalStackedBars = createHelper('HorizontalStackedBars');

d3.chart().HorizontalStackedBars = HorizontalStackedBars;
export {
  HorizontalStackedBars as default,
  horizontalStackedBars
};
