import { objectFind } from '../utils';
import {
  mixin,
  di,
  createHelper
} from '../helpers';
import { InvertedXY } from '../mixins';
import Bars from './Bars';

/**
  Bars chart with bars that group from left-to-right

  (See `Bars` for extensibility details)

  @example
  ```js
  var chart = d3.select('#chart').chart('Compose', function(data) {
    // Display bars for different series next to each other (adjacent: true)
    var xScale = {type: 'ordinal', adjacent: true, domain: [0, 1, 2]};

    return {
      charts: {
        output: {
          type: 'HorizontalBars',
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
  @class HorizontalBars
  @extends Bars, InvertedXY
*/
var HorizontalBars = Bars.extend('HorizontalBars', mixin(InvertedXY, {
  barX: di(function(chart, d, i) {
    var x = chart.x.call(this, d, i);
    var x0 = chart.x0();

    return x < x0 ? x : x0 + chart.barOffset();
  }),
  barY: di(function(chart, d, i) {
    return chart.y.call(this, d, i) - chart.itemWidth() / 2;
  }),
  barWidth: di(function(chart, d, i) {
    var width = Math.abs(chart.x0() - chart.x.call(this, d, i)) - chart.barOffset();
    return width > 0 ? width : 0;
  }),
  barHeight: di(function(chart) {
    return chart.itemWidth();
  }),
  bar0: di(function(chart, d, i) {
    var x0 = chart.x0();
    var offset = chart.barOffset();
    return chart.x.call(this, d, i) >= x0 ? x0 + offset : x0 - offset;
  }),

  getOffsetAxis: function getOffsetAxis() {
    var components = this.container && this.container.components();
    return objectFind(components, function(component) {
      if (component.type == 'Axis' && component.position() == 'left')
        return component;
    });
  },

  onEnter: function onEnter(selection) {
    selection
      .attr('x', this.bar0)
      .attr('width', 0);
  },

  onMerge: function onMerge(selection) {
    selection
      .attr('class', this.barClass)
      .attr('style', this.itemStyle)
      .attr('y', this.barY)
      .attr('height', this.barHeight);
  },

  onMergeTransition: function onMergeTransition(selection) {
    this.setupTransition(selection);

    selection
      .attr('x', this.barX)
      .attr('width', this.barWidth);
  }
}));

var horizontalBars = createHelper('HorizontalBars');

export {
  HorizontalBars as default,
  horizontalBars
};
