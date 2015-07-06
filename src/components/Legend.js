(function(d3, helpers, mixins, charts) {
  var utils = helpers.utils;
  var property = helpers.property;
  var di = helpers.di;
  var mixin = helpers.mixin;

  /**
    Legend component that can automatically pull chart and series information from d3.compose

    Notes:

    - To exclude a chart from the legend, use `exclude_from_legend = true` in chart prototype or options
    - To exclude a series from the legend, use `exclude_from_legend = true` in series object
    - To add swatch for custom chart, use `Legend.registerSwatch()`

    ### Extending

    To extend the `Legend` component, the following methods are available:

    - `itemKey`
    - `itemText`
    - `swatchClass`
    - `createSwatch`
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
    d3.select('#chart')
      .chart('Compose', function(data) {
        var input = [{key: 'input', name: 'Input', values: data.input}];
        var output = [
          {key: 'output1', name: 'Output 1', values: data.output1},
          {key: 'output2', name: 'Output 2', values: data.output2}
        ];

        return {
          charts: {
            a: {type: 'Lines', data: input}, // ...
            b: {type: 'Bars', data: output} // ...
          },
          components: {
            legend: {
              type: 'Legend',
              charts: ['a', 'b']
            }
          }
        };
      });

    // -> automatically creates legend from series data for 'a' and 'b'
    //    (Lines Swatch) Input
    //    (Bars Swatch) Output 1
    //    (Bars Swatch) Output 2

    // or, manually set data for legend
    return {
      components: {
        legend: {
          type: 'Legend',
          data: [
            {type: 'Lines', text: 'Input', class: 'series-index-0'},
            {type: 'Bars', text: 'Output 1', class: 'series-index-0'},
            {type: 'Bars', text: 'Output 2', class: 'series-index-1'},
          ]
        }
      }
    };
    ```
    @class Legend
    @extends Component, StandardLayer
  */
  charts.Legend = charts.Component.extend('Legend', mixin(mixins.StandardLayer, {
    initialize: function() {
      this.legend_base = this.base.append('g').classed('chart-legend', true);
      this.standardLayer('Legend', this.legend_base);
    },

    /**
      Array of chart keys from container to display in legend

      @example
      ```js
      d3.select('#chart')
      .chart('Compose', function(data) {
        return {
          charts: {
            a: {},
            b: {},
            c: {}
          },
          components: {
            legend: {
              type: 'Legend',
              charts: ['a', 'c']
            }
          }
        };
      });
      ```
      @property charts
      @type Array
    */
    charts: property('charts'),

    /**
      Dimensions of "swatch"

      @property swatchDimensions
      @type Object
      @default {width: 20, height: 20}
    */
    swatchDimensions: property('swatchDimensions', {
      default_value: {width: 20, height: 20}
    }),

    transform: function(data) {
      if (this.charts()) {
        // Pull legend data from charts
        var charts = this.container.charts();
        data = utils.reduce(this.charts(), function(data, chart_id) {
          var chart = charts[chart_id];

          // Check for exclude from legend option
          if (!chart || chart.exclude_from_legend || chart.options().exclude_from_legend)
            return data;

          var chart_data = this.container.demux(chart_id, this.container.data());
          if (!helpers.isSeriesData(chart_data))
            chart_data = [chart_data];

          var legend_data = utils.compact(utils.map(chart_data, function(series, index) {
            // Check for exclude from legend option on series
            if (!series || series.exclude_from_legend) return;

            return {
              text: series.name || 'Series ' + (index + 1),
              key: chart_id + '.' + (series.key || index),
              type: chart.type,
              'class': utils.compact([
                'chart-series',
                'chart-index-' + index,
                chart.options()['class'],
                series['class']
              ]).join(' ')
            };
          }));

          return data.concat(legend_data);
        }, [], this);
      }

      return data;
    },

    // Key for legend item (default is key from data)
    itemKey: di(function(chart, d, i) {
      return d.key;
    }),

    // Text for legend item (default is text from data)
    itemText: di(function(chart, d, i) {
      return d.text;
    }),

    // Class to apply to swatch (default is class from data)
    swatchClass: di(function(chart, d, i) {
      return d['class'];
    }),

    // Create swatch (using registered swatches based on type from data)
    createSwatch: di(function(chart, d, i) {
      var selection = d3.select(this);

      // Clear existing swatch
      selection.selectAll('*').remove();
      selection
        .attr('class', chart.swatchClass);

      var swatches = d3.chart('Legend').swatches;
      if (!swatches)
        return;

      if (d && d.type && swatches[d.type])
        swatches[d.type].call(selection, chart, d, i);
      else if (swatches['default'])
        swatches['default'].call(selection, chart, d, i);
    }),

    onDataBind: function onDataBind(selection, data) {
      return selection.selectAll('.chart-legend-group')
        .data(data, this.itemKey);
    },
    onInsert: function onInsert(selection) {
      var groups = selection.append('g')
        .attr('class', 'chart-legend-group');

      groups.append('g')
        .attr('width', this.swatchDimensions().width)
        .attr('height', this.swatchDimensions().height)
        .attr('class', 'chart-legend-swatch');
      groups.append('text')
        .attr('class', 'chart-legend-label');

      return groups;
    },
    onMerge: function onMerge(selection) {
      var swatch = this.swatchDimensions();

      selection.select('g').each(this.createSwatch);
      selection.select('text')
        .text(this.itemText)
        .each(function() {
          // Vertically center text
          var offset = helpers.alignText(this, swatch.height);
          d3.select(this)
            .attr('transform', helpers.translate(swatch.width + 5, offset));
        });

      // Position groups after positioning everything inside
      var direction_by_position = {
        top: 'horizontal',
        right: 'vertical',
        bottom: 'horizontal',
        left: 'vertical'
      };
      selection.call(helpers.stack.bind(selection, {direction: direction_by_position[this.position()], origin: 'top', padding: 5}));
    },
    onExit: function onExit(selection) {
      selection.remove();
    }
  }), {
    z_index: 200,
    swatches: {
      'default': function(chart, d, i) {
        var dimensions = chart.swatchDimensions();

        this.append('circle')
          .attr('cx', dimensions.width / 2)
          .attr('cy', dimensions.height / 2)
          .attr('r', utils.min([dimensions.width, dimensions.height]) / 2)
          .attr('class', 'chart-swatch');
      }
    },

    /**
      Register a swatch create function for the given chart type

      @example
      ```js
      d3.chart('Legend').registerSwatch(['Lines'], function(chart, d, i) {
        var dimensions = chart.swatchDimensions();

        return this.append('line')
          .attr('x1', 0).attr('y1', dimensions.height / 2)
          .attr('x2', dimensions.width).attr('y2', dimensions.height / 2)
          .attr('class', 'chart-line');
      });
      ```
      @method registerSwatch
      @static
      @param {String|Array} type Chart type
      @param {Function} create "di" function that inserts swatch
    */
    registerSwatch: function(type, create) {
      if (!utils.isArray(type))
        type = [type];

      utils.each(type, function(type) {
        this.swatches[type] = create;
      }, this);
    }
  });

  // Create line swatch for Line and LineValues
  charts.Legend.registerSwatch(['Lines'], function(chart, d, i) {
    var dimensions = chart.swatchDimensions();

    return this.append('line')
      .attr('x1', 0).attr('y1', dimensions.height / 2)
      .attr('x2', dimensions.width).attr('y2', dimensions.height / 2)
      .attr('class', 'chart-line');
  });

  // Create bars swatch for Bars and StackedBars
  charts.Legend.registerSwatch(['Bars', 'StackedBars', 'HorizontalBars', 'HorizontalStackedBars'], function(chart, d, i) {
    var dimensions = chart.swatchDimensions();

    return this.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', dimensions.width).attr('height', dimensions.height)
      .attr('class', 'chart-bar');
  });

  /**
    Legend positioned within chart bounds.

    @class InsetLegend
    @extends Legend
  */
  charts.InsetLegend = charts.Legend.extend('InsetLegend', {
    initialize: function() {
      this.on('draw', function() {
        // Position legend on draw
        // (Need actual width/height for relative_to)
        var translation = this.translation();
        this.legend_base.attr('transform', helpers.translate(translation.x, translation.y));
      }.bind(this));
    },

    /**
      Position legend within chart layer `{x, y, relative_to}`
      Use `relative_to` to use x,y values relative to x-y origin
      (e.g. `"left-top"` is default)

      @example
      ```js
      d3.select('#chart')
        .chart('Compose', function(data) {
          return {
            components: {
              legend: {
                type: 'InsetLegend',
                // Position legend 10px away from right-bottom corner of chart
                translation: {x: 10, y: 10, relative_to: 'right-bottom'}
              }
            }
          }
        });
      ```
      @property translation
      @type Object {x,y}
      @default {x: 10, y: 10, relative_to: 'left-top'}
    */
    translation: property('translation', {
      default_value: {x: 10, y: 0, relative_to: 'left-top'},
      get: function(value) {
        var x = value.x || 0;
        var y = value.y || 0;
        var relative_to_x = (value.relative_to && value.relative_to.split('-')[0]) || 'left';
        var relative_to_y = (value.relative_to && value.relative_to.split('-')[1]) || 'top';

        if (relative_to_x === 'right') {
          x = this.width() - helpers.dimensions(this.legend_base).width - x;
        }
        if (relative_to_y === 'bottom') {
          y = this.height() - helpers.dimensions(this.legend_base).height - y;
        }

        return {
          x: x,
          y: y
        };
      }
    }),

    skip_layout: true
  }, {
    layer_type: 'chart'
  });

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);
