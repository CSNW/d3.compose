import {
  di,
  createHelper
} from '../helpers';
import HorizontalBars from './HorizontalBars';
import StackedBars from './StackedBars';

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
    data = StackedBars.prototype.transform.call(this, data);
    data = HorizontalBars.prototype.transform.call(this, data);
    return data;
  },

  barWidth: di(function(chart, d, i) {
    var width = Math.abs(chart.yScale()(d.__previous) - chart.x.call(this, d, i));
    var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
    return width > 0 ? width - offset : 0;
  }),
  barX: di(function(chart, d, i) {
    var x = chart.x.call(this, d, i);
    var x0 = chart.yScale()(d.__previous);

    return x < x0 ? x : x0 + chart.barOffset();
  })
});

var horizontalStackedBars = createHelper('HorizontalStackedBars');

d3.chart().HorizontalStackedBars = HorizontalStackedBars;
export {
  HorizontalStackedBars as default,
  horizontalStackedBars
};
