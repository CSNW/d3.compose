import {
  isUndefined,
  objectFind
} from '../utils';
import {
  mixin,
  property,
  di,
  createHelper
} from '../helpers';
import {
  Series,
  XYValues,
  XYLabels,
  Hover,
  Transition, 
  StandardLayer
} from '../mixins';
import Chart from '../Chart';

/**
  Bars chart with centered or adjacent display for single or series data.

  To display bars for different series next to each other (adjacent),
  use the `adjacent` option when creating the `xScale` (see example below).

  ### Extending

  To extend the `Bars` chart, the following methods are available:

  - `barHeight`
  - `barWidth`
  - `barX`
  - `barY`
  - `barClass`
  - `onDataBind`
  - `onInsert`
  - `onEnter`
  - `onEnterTransition`
  - `onUpdate`
  - `onUpdateTransition`
  - `onMerge`
  - `onMergeTransition`
  - `onExit`
  - `onExitTransition`

  @example
  ```js
  var chart = d3.select('#chart').chart('Compose', function(data) {
    // Display bars for different series next to each other (adjacent: true)
    var xScale = {type: 'ordinal', adjacent: true, domain: [0, 1, 2]};

    return {
      charts: {
        output: {
          type: 'Bars',
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
  @class Bars
  @extends Chart, Series, XYValues, XYLabels, Hover, Transition, StandardLayer
*/
var Bars = Chart.extend('Bars', mixin(
  Series,
  XYValues,
  XYLabels,
  Hover,
  Transition, 
  StandardLayer, 
  {
    initialize: function() {
      this.on('before:draw', function() {
        this.offset_axis = this.getOffsetAxis();
      }.bind(this));

      // Use standard series layer for extensibility
      // (dataBind, insert, and events defined in prototype)
      this.standardSeriesLayer('Bars', this.base.append('g').classed('chart-bars', true));
      this.attachLabels();
    },

    barHeight: di(function(chart, d, i) {
      var height = Math.abs(chart.y0() - chart.y.call(this, d, i)) - chart.barOffset();
      return height > 0 ? height : 0;
    }),
    barWidth: di(function(chart, d, i) {
      return chart.itemWidth();
    }),
    barX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) - chart.itemWidth() / 2;
    }),
    barY: di(function(chart, d, i) {
      var y = chart.y.call(this, d, i);
      var y0 = chart.y0();

      return y < y0 ? y : y0 + chart.barOffset();
    }),
    bar0: di(function(chart, d, i) {
      var y0 = chart.y0();
      var offset = chart.barOffset();
      return chart.y.call(this, d, i) <= y0 ? y0 - offset : y0 + offset;
    }),
    barClass: di(function(chart, d, i) {
      return 'chart-bar' + (d['class'] ? ' ' + d['class'] : '');
    }),

    // Shift bars slightly to account for axis thickness
    barOffset: function barOffset() {
      if (this.offset_axis) {
        var axis_thickness = parseInt(this.offset_axis.base.select('.domain').style('stroke-width')) || 0;
        return axis_thickness / 2;
      }
      else {
        return 0;
      }
    },

    getOffsetAxis: function getOffsetAxis() {
      var components = this.container && this.container.components();
      return objectFind(components, function(component, id) {
        if (component.type == 'Axis' && component.position() == 'bottom')
          return component;
      });
    },

    // Override StandardLayer
    onDataBind: function onDataBind(selection, data) {
      return selection.selectAll('rect')
        .data(data, this.key);
    },
    
    // Override StandardLayer
    onInsert: function onInsert(selection) {
      return selection.append('rect')
        .on('mouseenter', this.mouseEnterPoint)
        .on('mouseleave', this.mouseLeavePoint);
    },

    // Override StandardLayer
    onEnter: function onEnter(selection) {
      selection
        .attr('y', this.bar0)
        .attr('height', 0);
    },

    // Override StandardLayer
    onMerge: function onMerge(selection) {
      selection
        .attr('class', this.barClass)
        .attr('style', this.itemStyle)
        .attr('x', this.barX)
        .attr('width', this.barWidth);
    },

    // Override StandardLayer
    onMergeTransition: function onMergeTransition(selection) {
      this.setupTransition(selection);

      selection
        .attr('y', this.barY)
        .attr('height', this.barHeight);
    },

    // Override StandardLayer
    onExit: function onExit(selection) {
      selection.remove();
    }
  }
));

var bars = createHelper('Bars');

export {
  Bars as default,
  bars
};
