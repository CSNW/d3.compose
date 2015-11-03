import d3 from 'd3';
import {
  property,
  di,
  mixin,
  createHelper
} from '../helpers';
import {
  Series,
  XY,
  LabelsXY,
  Hover,
  HoverPoints,
  Transition,
  StandardLayer
} from '../mixins';
import Chart from '../Chart';

/**
  Create an XY Lines chart with single or series data.

  ### Extending

  Great care has been taken in making the standard charts in d3.compose extensible.
  To extend the `Lines` chart, the following methods are available:

  - `createLine`
  - `lineKey`
  - `lineData`
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

  View the `Lines.js` source for the default implementation and more information on these methods.

  @example
  ```js
  var chart = d3.select('#chart').chart('Compose', function(data) {
    return {
      charts: {
        input: {
          type: 'Lines'
          data: data.input,
          // xScale: ...,
          // yScale: ...,
          // other properties...
        }
      }
    };
  });

  // Single y-values
  chart.draw([1, 2, 3]);

  // Series (x,y) values
  chart.draw([
    {values: [{x: 0, y: 1}, {x: 1, y: 2}, {x: 2, y: 3}]}
    {values: [{x: 0, y: 3}, {x: 1, y: 2}, {x: 2, y: 1}]}
  ]);
  ```
  @class Lines
  @extends Chart, Series, XY, LabelsXY, Hover, HoverPoints, Transition, StandardLayer
*/
var Mixed = mixin(Chart, Series, XY, LabelsXY, Hover, HoverPoints, Transition, StandardLayer);
var Lines = Mixed.extend({
  initialize: function(options) {
    Mixed.prototype.initialize.call(this, options);

    this.lines = {};

    // Use standard series layer for extensibility
    // (dataBind, insert, and events defined in prototype)
    this.standardSeriesLayer('Lines', this.base.append('g').classed('chart-lines', true));

    this.attachLabels();
  },

  /**
    Set interpolation mode for line

    - See: [SVG-Shapes#line_interpolate](https://github.com/mbostock/d3/wiki/SVG-Shapes#line_interpolate)
    - Set to `null` or `'linear'` for no interpolation

    @property interpolate
    @type String
    @default monotone
  */
  interpolate: property({
    default_value: 'monotone'
  }),

  // Create line on insert (keyed by series/index)
  createLine: di(function(chart, d, i, j) {
    var key = chart.lineKey.call(this, d, i, j);
    var line = chart.lines[key] = d3.svg.line()
      .x(chart.x)
      .y(chart.y);

    var interpolate = d.interpolate || chart.interpolate();
    if (interpolate)
      line.interpolate(interpolate);
  }),

  // Get key for line (from series key or index)
  lineKey: di(function(chart, d, i, j) {
    var key = chart.seriesKey(chart.seriesData.call(this, d, i, j));
    return key != null ? key : chart.seriesIndex.call(this, d, i, j);
  }),

  // Get data for line
  lineData: di(function(chart, d, i, j) {
    var key = chart.lineKey.call(this, d, i, j);
    if (chart.lines[key])
      return chart.lines[key](d);
  }),

  // Override StandardLayer
  onDataBind: function onDataBind(selection, data) {
    return selection.selectAll('path')
      .data(function(d, i, j) {
        return [data.call(selection, d, i, j)];
      });
  },

  // Override StandardLayer
  onInsert: function onInsert(selection) {
    return selection.append('path')
      .classed('chart-line', true)
      .each(this.createLine);
  },

  // Override StandardLayer
  onMergeTransition: function onMergeTransition(selection) {
    this.setupTransition(selection);

    selection
      .attr('d', this.lineData)
      .attr('style', this.itemStyle);
  }
});

var lines = createHelper('Lines');

export {
  Lines as default,
  lines
};
