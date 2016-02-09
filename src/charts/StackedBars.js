import {
  extend
} from '../utils';
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
    data = Bars.prototype.transform.call(this, data);

    var grouped = {};
    var x_key = this.xKey();
    var y_key = this.yKey();
    data = data.map(function(series) {
      series = extend({}, series);
      series.values = series.values.map(function(value) {
        value = extend({}, value);
        var x = value[x_key];
        var y = value.__original_y = value[y_key];

        if (!grouped[x])
          grouped[x] = {pos: 0, neg: 0};

        if (y >= 0) {
          value.__previous = grouped[x].pos;
          grouped[x].pos = value[y_key] = grouped[x].pos + y;
        }
        else {
          value.__previous = grouped[x].neg;
          grouped[x].neg = value[y_key] = grouped[x].neg + y;
        }

        return value;
      }, this);

      return series;
    }, this);

    return data;
  },

  barHeight: di(function(chart, d, i) {
    var height = Math.abs(chart.yScale()(d.__previous) - chart.y.call(this, d, i));
    var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
    height = height - offset;
    return height > 0 ? height : 0;
  })
});

var stackedBars = createHelper('StackedBars');

export {
  StackedBars as default,
  stackedBars
};
