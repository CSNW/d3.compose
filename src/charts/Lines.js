(function(d3, helpers, mixins, charts) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

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
      {values: [{x: 0, y: 1}, {x: 0, y: 2}, {x: 0, y: 3}]}
      {values: [{x: 0, y: 3}, {x: 0, y: 2}, {x: 0, y: 1}]}
    ]);
    ```
    @class Lines
    @extends Chart, Series, XY, XYLabels, Hover, HoverPoints, Transition, StandardLayer
  */
  charts.Lines = charts.Chart.extend('Lines', mixin(
    mixins.Series, 
    mixins.XY, 
    mixins.XYLabels, 
    mixins.Hover, 
    mixins.HoverPoints, 
    mixins.Transition, 
    mixins.StandardLayer, 
    {
      initialize: function() {
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
      interpolate: property('interpolate', {
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
    }
  ));

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);
