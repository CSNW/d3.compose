(function(d3, helpers, mixins, charts) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;
  var isUndefined = helpers.utils.isUndefined;

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
  charts.Bars = charts.Chart.extend('Bars', mixin(
    mixins.Series,
    mixins.XYValues,
    mixins.XYLabels,
    mixins.Hover,
    mixins.Transition, 
    mixins.StandardLayer, 
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
        return utils.find(components, function(component, id) {
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
  charts.StackedBars = charts.Bars.extend('StackedBars', {
    transform: function(data) {
      // Re-initialize bar positions each time data changes
      this.bar_positions = [];
      return data;
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
      if (y > y0) return;

      if (chart.bar_positions.length <= i)
        chart.bar_positions.push(0);

      var previous = chart.bar_positions[i] || y0;
      var new_position = previous - (y0 - y);

      chart.bar_positions[i] = new_position;

      return new_position;
    })
  });

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
  charts.HorizontalBars = charts.Bars.extend('HorizontalBars', mixin(mixins.InvertedXY, {
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
    barHeight: di(function(chart, d, i) {
      return chart.itemWidth();
    }),
    bar0: di(function(chart, d, i) {
      var x0 = chart.x0();
      var offset = chart.barOffset();
      return chart.x.call(this, d, i) >= x0 ? x0 + offset : x0 - offset;
    }),

    getOffsetAxis: function getOffsetAxis() {
      var components = this.container && this.container.components();
      return utils.find(components, function(component, id) {
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
    },
  }));

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
  charts.HorizontalStackedBars = charts.HorizontalBars.extend('HorizontalStackedBars', {
    transform: function(data) {
      // Re-initialize bar positions each time data changes
      this.bar_positions = [];
      return data;
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
      if (x < x0) return;

      if (chart.bar_positions.length <= i)
        chart.bar_positions.push(0);

      var previous = chart.bar_positions[i] || (x0 + chart.barOffset());
      var new_position = previous + (x - x0);

      chart.bar_positions[i] = new_position;

      return previous;
    })
  });

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);
