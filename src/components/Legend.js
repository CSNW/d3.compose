import d3 from 'd3';
import {
  compact,
  contains,
  find
} from '../utils';
import {
  alignText,
  createHelper,
  di,
  getMargins,
  isSeriesData,
  mixin,
  property,
  stack,
  translate
} from '../helpers';
import { StandardLayer } from '../mixins';
import Component from '../Component';
var default_legend_margins = {top: 8, right: 8, bottom: 8, left: 8};

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

      var charts = [
        d3c.lines('a', {data: input}), // ...
        d3c.bars('b', {data: output}) // ...
      ];
      var legend = d3c.legend({charts: ['a', 'b']});

      return [
        [d3c.layered(charts), legend]
      ];
    });

  // -> automatically creates legend from series data for 'a' and 'b'
  //    (Lines Swatch) Input
  //    (Bars Swatch) Output 1
  //    (Bars Swatch) Output 2

  // or, manually set data for legend
  return [
    d3c.legend({
      data: [
        {type: 'Lines', text: 'Input', class: 'series-index-0'},
        {type: 'Bars', text: 'Output 1', class: 'series-index-0'},
        {type: 'Bars', text: 'Output 2', class: 'series-index-1'},
      ]
    })
  };
  ```
  @class Legend
  @extends Component, StandardLayer
*/
var Mixed = mixin(Component, StandardLayer);
var Legend = Mixed.extend({
  initialize: function(options) {
    Mixed.prototype.initialize.call(this, options);
    this.legend_base = this.base.append('g').classed('chart-legend', true);
    this.standardLayer('Legend', this.legend_base);
  },

  /**
    Array of chart keys from container to display in legend

    @example
    ```js
    d3.select('#chart')
    .chart('Compose', function(data) {
      var charts = [
        {id: 'a'},
        {id: 'b'},
        {id: 'c'}
      ];
      var legend = d3c.legend({charts: ['a', 'c']});

      return [
        [d3c.layered(charts), legend]
      ];
    });
    ```
    @property charts
    @type Array
  */
  charts: property(),

  /**
    Dimensions of "swatch" in px

    @property swatchDimensions
    @type Object
    @default {width: 20, height: 20}
  */
  swatchDimensions: property({
    default_value: {width: 20, height: 20}
  }),

  /**
    Margins (in pixels) around legend

    @property margins
    @type Object
    @default {top: 8, right: 8, bottom: 8, left: 8}
  */
  margins: property({
    default_value: default_legend_margins,
    set: function(values) {
      return {
        override: getMargins(values, default_legend_margins)
      };
    }
  }),

  /**
    Direction to "stack" legend, "vertical" or "horizontal".
    (Default is set based on position: top/bottom = "horizontal", left/right = "vertical")

    @property stackDirection
    @type String
    @default (based on position)
  */
  stackDirection: property({
    validate: function(value) {
      return contains(['vertical', 'horizontal'], value);
    },
    default_value: function() {
      var direction_by_position = {
        top: 'horizontal',
        right: 'vertical',
        bottom: 'horizontal',
        left: 'vertical'
      };
      return direction_by_position[this.position()];
    }
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
            memo.push(this.getLegendData(chart, series, index));
          }

          return memo;
        }.bind(this), []);

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
    return compact(['chart-legend-swatch', d['class']]).join(' ');
  }),

  // Create swatch (using registered swatches based on type from data)
  createSwatch: di(function(chart, d, i) {
    var selection = d3.select(this);

    // Clear existing swatch
    selection.selectAll('*').remove();
    selection
      .attr('class', chart.swatchClass);

    var swatches = Legend.swatches;
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
      .attr('class', 'chart-legend-group')
      .style('pointer-events', 'all')
      .on('mouseenter', function(d, i) {
        this.container.trigger('mouseenter:legend', this._itemDetails(d, i));
      }.bind(this))
      .on('mousemove', function(d, i) {
        this.container.trigger('mousemove:legend', this._itemDetails(d, i));
      }.bind(this))
      .on('mouseleave', function(d, i) {
        this.container.trigger('mouseleave:legend', this._itemDetails(d, i));
      }.bind(this));

    groups.append('g')
      .attr('width', this.swatchDimensions().width)
      .attr('height', this.swatchDimensions().height)
      .attr('class', 'chart-legend-swatch');
    groups.append('text')
      .attr('class', 'chart-legend-label');

    groups.append('rect')
      .attr('class', 'chart-legend-hover')
      .style('visibility', 'hidden');

    return groups;
  },
  onMerge: function onMerge(selection) {
    var swatch = this.swatchDimensions();

    selection.select('.chart-legend-swatch').each(this.createSwatch);

    selection.select('.chart-legend-label')
      .text(this.itemText)
      .each(function() {
        // Vertically center text
        var offset = alignText(this, swatch.height);
        d3.select(this)
          .attr('transform', translate(swatch.width + 5, offset));
      });

    // Position groups after positioning everything inside
    selection.call(stack({
      direction: this.stackDirection(),
      origin: 'top',
      padding: 5,
      min_height: swatch.height,
      min_width: swatch.width
    }));

    // Position hover listeners
    var sizes = [];
    selection.each(function() {
      sizes.push(this.getBBox());
    });
    selection.select('.chart-legend-hover').each(function(d, i) {
      var size = sizes[i];
      var transform = null;

      if (size.height > swatch.height) {
        var offset = (size.height - swatch.height) / 2;
        transform = translate(0, -offset);
      }

      d3.select(this)
        .attr('width', size.width)
        .attr('height', size.height)
        .attr('transform', transform);
    });
  },
  onExit: function onExit(selection) {
    selection.remove();
  },

  getLegendData: function getLegendData(chart, series, series_index) {
    return {
      text: series.name || 'Series ' + (series_index + 1),
      key: chart.id + '.' + (series.key || series_index),
      type: chart.type,
      'class': compact([
        'chart-series',
        'chart-index-' + series_index,
        chart.options()['class'],
        series['class']
      ]).join(' ')
    };
  },

  _itemDetails: function _itemDetails(d, i) {
    return {
      legend: this,
      d: d,
      i: i
    };
  }
}, {
  z_index: 200,
  swatches: {
    'default': function(chart) {
      var swatch_dimensions = chart.swatchDimensions();

      this.append('circle')
        .attr('cx', swatch_dimensions.width / 2)
        .attr('cy', swatch_dimensions.height / 2)
        .attr('r', d3.min([swatch_dimensions.width, swatch_dimensions.height]) / 2)
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
  var swatch_dimensions = chart.swatchDimensions();

  return this.append('line')
    .attr('x1', 0).attr('y1', swatch_dimensions.height / 2)
    .attr('x2', swatch_dimensions.width).attr('y2', swatch_dimensions.height / 2)
    .attr('class', 'chart-line');
});

// Create bars swatch for Bars and StackedBars
Legend.registerSwatch(['Bars', 'StackedBars', 'HorizontalBars', 'HorizontalStackedBars'], function(chart) {
  var swatch_dimensions = chart.swatchDimensions();

  return this.append('rect')
    .attr('x', 0).attr('y', 0)
    .attr('width', swatch_dimensions.width).attr('height', swatch_dimensions.height)
    .attr('class', 'chart-bar');
});

var legend = createHelper('Legend');

export {
  Legend as default,
  legend
};
