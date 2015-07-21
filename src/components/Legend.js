import d3 from 'd3';
import {
  find,
  compact
} from '../utils';
import {
  property,
  isSeriesData,
  alignText,
  translate,
  stack,
  di,
  mixin,
  createHelper
} from '../helpers';
import { StandardLayer } from '../mixins';
import Component from '../Component';

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
var Legend = Component.extend('Legend', mixin(StandardLayer, {
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
      data = this.charts().reduce(function(combined_data, chart_id) {
        var chart = find(charts, function(find_chart) { return find_chart.id == chart_id; });

        // Check for exclude from legend option
        if (!chart || chart.exclude_from_legend || chart.options().exclude_from_legend)
          return combined_data;

        var chart_data = this.container.demux(chart_id, this.container.data());
        if (!isSeriesData(chart_data))
          chart_data = [chart_data];

        var legend_data = chart_data.reduce(function(memo, series, index) {
          // Check for exclude from legend option on series
          if (series && !series.exclude_from_legend) {
            memo.push({
              text: series.name || 'Series ' + (index + 1),
              key: chart_id + '.' + (series.key || index),
              type: chart.type,
              'class': compact([
                'chart-series',
                'chart-index-' + index,
                chart.options()['class'],
                series['class']
              ]).join(' ')
            });
          }

          return memo;
        }, []);

        return combined_data.concat(legend_data);
      }.bind(this), []);
    }

    return data;
  },

  // Key for legend item (default is key from data)
  itemKey: di(function(chart, d) {
    return d.key;
  }),

  // Text for legend item (default is text from data)
  itemText: di(function(chart, d) {
    return d.text;
  }),

  // Class to apply to swatch (default is class from data)
  swatchClass: di(function(chart, d) {
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
        var offset = alignText(this, swatch.height);
        d3.select(this)
          .attr('transform', translate(swatch.width + 5, offset));
      });

    // Position groups after positioning everything inside
    var direction_by_position = {
      top: 'horizontal',
      right: 'vertical',
      bottom: 'horizontal',
      left: 'vertical'
    };
    selection.call(stack.bind(selection, {direction: direction_by_position[this.position()], origin: 'top', padding: 5}));
  },
  onExit: function onExit(selection) {
    selection.remove();
  }
}), {
  z_index: 200,
  swatches: {
    'default': function(chart) {
      var dimensions = chart.swatchDimensions();

      this.append('circle')
        .attr('cx', dimensions.width / 2)
        .attr('cy', dimensions.height / 2)
        .attr('r', d3.min([dimensions.width, dimensions.height]) / 2)
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
    @param {Array|String} types Chart type(s)
    @param {Function} create "di" function that inserts swatch
  */
  registerSwatch: function(types, create) {
    if (!Array.isArray(types))
      types = [types];

    types.forEach(function(type) {
      this.swatches[type] = create;
    }, this);
  }
});

// Create line swatch for Line and LineValues
Legend.registerSwatch(['Lines'], function(chart) {
  var dimensions = chart.swatchDimensions();

  return this.append('line')
    .attr('x1', 0).attr('y1', dimensions.height / 2)
    .attr('x2', dimensions.width).attr('y2', dimensions.height / 2)
    .attr('class', 'chart-line');
});

// Create bars swatch for Bars and StackedBars
Legend.registerSwatch(['Bars', 'StackedBars', 'HorizontalBars', 'HorizontalStackedBars'], function(chart) {
  var dimensions = chart.swatchDimensions();

  return this.append('rect')
    .attr('x', 0).attr('y', 0)
    .attr('width', dimensions.width).attr('height', dimensions.height)
    .attr('class', 'chart-bar');
});

var legend = createHelper('Legend');

export {
  Legend as default,
  legend
};
