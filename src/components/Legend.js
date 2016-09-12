import d3 from 'd3';
import {
  compact,
  contains,
  extend,
  find
} from '../utils';
import {
  alignText,
  createHelper,
  getMargins,
  isSeriesData,
  mixin,
  stack,
  translate,

  architecture,
  types,
  createPrepare,
  createDraw,
  getLayer,
  curry,

  createProperties
} from '../helpers';
import Component from '../Component';

var default_legend_margins = {top: 8, right: 8, bottom: 8, left: 8};

// TODO Define after Legend
// Possibly by passing into Legend/wrapping with Legend
var drawLegend = createDraw({
  select: select,
  enter: enter,
  merge: merge
});

/**
  Legend component that can automatically pull chart and series information from d3.compose

  Notes:

  - To exclude a chart from the legend, use `exclude_from_legend = true` in chart prototype or options
  - To exclude a series from the legend, use `exclude_from_legend = true` in series object
  - To add swatch for custom chart, use `Legend.registerSwatch()`

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
var Mixed = mixin(Component, architecture);
var Legend = Mixed.extend({
  prepare: createPrepare(
    prepareMargins,
    prepareLegendData,
    prepareLegend
  ),

  render: function() {
    // TODO Move to lifecycle
    this.update(this.base, this.options());

    var layer = getLayer(this.base, 'legend')
      .classed('chart-legend', true);
    var props = this.prepare();

    drawLegend(layer, props);
  },

  swatchClass: function(props, context, d) {
    return compact(['chart-legend-swatch', d['class']]).join(' ');
  },

  createSwatch: function(props, context, d, i) {
    var swatches = context.constructor.swatches;
    if (!swatches)
      return;

    var swatch = d && d.type && swatches[d.type] || swatches['default'];
    if (!swatch)
      return;

    var selection = d3.select(this);
    swatch.call(selection, context, d, i);
  },

  getLegendData: function(chart, series, series_index) {
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

  // TODO
  // _itemDetails: function _itemDetails(d, i) {
  //   return {
  //     legend: this,
  //     d: d,
  //     i: i
  //   };
  // },

  // === TODO Remove, compatibility with current system
  initialize: function() {
    Mixed.prototype.initialize.apply(this, arguments);
    this.attached = {};
  },
  draw: function() {
    this.render();
  },
  swatchDimensions: function() {
    return this.props.swatchDimensions;
  }
  // ===
}, {
  properties: extend({}, Component.properties, {
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
    charts: {
      type: types.array
    },

    /**
      Dimensions of "swatch" in px

      @property swatchDimensions
      @type Object
      @default {width: 20, height: 20}
    */
    swatchDimensions: {
      type: types.object,
      getDefault: function() {
        return {width: 20, height: 20};
      }
    },

     /**
      Margins (in pixels) around legend

      @property margins
      @type Object
      @default {top: 8, right: 8, bottom: 8, left: 8}
    */
    margins: {
      type: types.any,
      getDefault: function() {
        return default_legend_margins;
      }
    },

    /**
      Direction to "stack" legend, "vertical" or "horizontal".
      (Default is set based on position: top/bottom = "horizontal", left/right = "vertical")

      @property stackDirection
      @type String
      @default (based on position)
    */
    stackDirection: {
      type: types.string,
      validate: function(value) {
        return contains(['vertical', 'horizontal'], value);
      },
      getDefault: function(selection, props) {
        var direction_by_position = {
          top: 'horizontal',
          right: 'vertical',
          bottom: 'horizontal',
          left: 'vertical'
        };
        return direction_by_position[props.position];
      }
    }
  }),

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
  registerSwatch: function(chart_types, create) {
    if (!Array.isArray(chart_types))
      chart_types = [chart_types];

    chart_types.forEach(function(chart_type) {
      this.swatches[chart_type] = create;
    }, this);
  }
});

// DEPRECATED Backwards compatibility for properties
createProperties(Legend);

function prepareMargins(selection, props) {
  return extend({}, props, {
    margins: getMargins(props.margins, default_legend_margins)
  });
}

function prepareLegendData(selection, props, context) {
  // Pull legend data from charts, if specified
  var data = props.data;
  if (props.charts) {
    var charts = context.container.charts();
    data = props.charts.reduce(function(combined_data, chart_id) {
      var chart = find(charts, function(find_chart) {
        return find_chart.id == chart_id;
      });

      // Check for exclude from legend option
      if (!chart || chart.exclude_from_legend || chart.options().exclude_from_legend)
        return combined_data;

      var chart_data = context.container.demux(chart_id, context.container.data());
      if (!isSeriesData(chart_data))
        chart_data = [{values: chart_data}];

      var legend_data = chart_data.reduce(function(memo, series, index) {
        if (series && !series.exclude_from_legend)
          memo.push(context.getLegendData(chart, series, index));

        return memo;
      }, []);

      return combined_data.concat(legend_data);
    }, []);
  }

  return extend({}, props, {
    data: data
  });
}

function prepareLegend(selection, props, context) {
  var data = props.data.map(function(d, i) {
    return extend({}, d, {
      'class': context.swatchClass(props, context, d, i)
    });
  });

  return extend({}, props, {
    data: data,
    createSwatch: curry(context.createSwatch, props, context)
  });
}

function select(props) {
  return this.selectAll('.chart-legend-group')
    .data(props.data, function(d) { return d.key; });
}

function enter(props) {
  var groups = this.append('g')
    .attr('class', 'chart-legend-group')
    .style({'pointer-events': 'all'});
    // TODO
    // .on('mouseenter', function(d, i) {
    //   this.container.trigger('mouseenter:legend', this._itemDetails(d, i));
    // }.bind(this))
    // .on('mousemove', function(d, i) {
    //   this.container.trigger('mousemove:legend', this._itemDetails(d, i));
    // }.bind(this))
    // .on('mouseleave', function(d, i) {
    //   this.container.trigger('mouseleave:legend', this._itemDetails(d, i));
    // }.bind(this));

  groups.append('g')
    .attr('width', props.swatchDimensions.width)
    .attr('height', props.swatchDimensions.height)
    .attr('class', 'chart-legend-swatch');
  groups.append('text')
    .attr('class', 'chart-legend-label');

  groups.append('rect')
    .attr('class', 'chart-legend-hover')
    .style({visibility: 'hidden'});
}

function merge(props) {
  var size = props.swatchDimensions;
  var swatch = this.select('.chart-legend-swatch');

  swatch
    .attr('class', function(d) { return d['class']; })
    .selectAll('*').remove();

  swatch.each(props.createSwatch);

  this.select('.chart-legend-label')
    .text(function(d) { return d.text; })
    .each(function() {
      // Vertically center text
      var offset = alignText(this, size.height);
      d3.select(this)
        .attr('transform', translate(size.width + 5, offset));
    });

  // Position groups after positioning everything inside
  this.call(stack({
    direction: props.stackDirection,
    origin: 'top',
    padding: 5,
    min_height: size.height,
    min_width: size.width
  }));

  // Position hover listeners
  var sizes = [];
  this.each(function() {
    sizes.push(this.getBBox());
  });
  this.select('.chart-legend-hover').each(function(d, i) {
    var item_size = sizes[i];
    var transform = null;

    if (item_size.height > size.height)
      transform = translate(0, item_size.y);

    d3.select(this)
      .attr('width', item_size.width)
      .attr('height', item_size.height)
      .attr('transform', transform);
  });
}

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
  legend,
  prepareLegend,
  drawLegend
};
