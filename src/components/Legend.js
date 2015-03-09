(function(d3, helpers) {
  var utils = helpers.utils;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Legend component that can automatically draw data from charts

    @example
    ```js
    // (in Multi options)
    return {
      charts: {
        a: {...},
        b: {...}
      },
      components: {
        legend: {type: 'Legend', charts: ['a', 'b']}
      }
    }
    // -> automatically adds legend with data from charts a and b

    // or, manually set data for legend
    return {
      components: {
        legend: {type: 'Legend', data: [
          {text: 'A', key: 'a', type: 'Bars', class: 'legend-blue'},
          {text: 'B', key: 'b', type: 'Line', class: 'legend-green'},
          {text: 'C', key: 'c', class: 'legend-red'}
        ]}
      }
    }
    ```

    @class Legend
  */
  d3.chart('Component').extend('Legend', {
    initialize: function() {
      this.legend_base = this.base.append('g').classed('chart-legend', true);

      this.layer('Legend', this.legend_base, {
        dataBind: function(data) {
          return this.selectAll('g')
            .data(data, this.chart().itemKey);
        },
        insert: function() {
          var chart = this.chart();
          var groups = this.append('g')
            .attr('class', chart.itemClass);

          groups.append('g')
            .attr('width', chart.swatchDimensions().width)
            .attr('height', chart.swatchDimensions().height)
            .attr('class', 'chart-legend-swatch');
          groups.append('text')
            .attr('class', 'chart-legend-label')
            .attr('transform', helpers.translate(chart.swatchDimensions().width + 5, 0));

          return groups;
        },
        events: {
          merge: function() {
            var chart = this.chart();

            this.select('g').each(chart.createSwatch);
            this.select('text')
              .text(chart.itemText)
              .attr('alignment-baseline', 'before-edge');

            // Position groups after positioning everything inside
            var direction_by_position = {
              top: 'horizontal',
              right: 'vertical',
              bottom: 'horizontal',
              left: 'vertical'
            };
            this.call(stack.bind(this, {direction: direction_by_position[chart.position()], origin: 'top', padding: 5}));
          }
        }
      });
    },

    /**
      Array of chart keys from container to display in legend

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
              key: series.key ? chart_id + '.' + series.key : null,
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

    /**
      Key for legend item (default is key from data)

      @method itemKey
      @return {Any}
    */
    itemKey: di(function(chart, d, i) {
      return d.key;
    }),

    /**
      Text for legend item (default is text from data)

      @method itemText
      @return {String}
    */
    itemText: di(function(chart, d, i) {
      return d.text;
    }),

    /**
      Class to apply to swatch-text group

      @method itemClass
      @return {String}
    */
    itemClass: di(function(chart, d, i) {
      return 'chart-legend-group';
    }),

    /**
      Class to apply to swatch (default is class from data)

      @method swatchClass
      @return {String}
    */
    swatchClass: di(function(chart, d, i) {
      return d['class'];
    }),

    /**
      Create swatch (using registered swatches based on type from data)

      @method createSwatch
    */
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
    })
  }, {
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

      @method registerSwatch
      @static
      @param {String} type Chart type
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
  d3.chart('Legend').registerSwatch(['Line', 'LineValues'], function(chart, d, i) {
    var dimensions = chart.swatchDimensions();

    return this.append('line')
      .attr('x1', 0).attr('y1', dimensions.height / 2)
      .attr('x2', dimensions.width).attr('y2', dimensions.height / 2)
      .attr('class', 'chart-line');
  });

  // Create bars swatch for Bars and StackedBars
  d3.chart('Legend').registerSwatch(['Bars', 'StackedBars'], function(chart, d, i) {
    var dimensions = chart.swatchDimensions();

    return this.append('rect')
      .attr('x', 0).attr('y', 0)
      .attr('width', dimensions.width).attr('height', dimensions.height)
      .attr('class', 'chart-bar');
  });

  /**
    Legend positioned within chart bounds

    @class InsetLegend
  */
  d3.chart('Legend').extend('InsetLegend', {
    initialize: function() {
      this.on('draw', function() {
        // Position legend on draw
        // (Need actual width/height for relative_to)
        var translation = this.translation();
        this.legend_base.attr('transform', helpers.translate(translation.x, translation.y));
      }.bind(this));
    },

    /**
      Position legend within chart layer {x,y,relative_to}
      Use `relative_to` to use x,y values relative to x-y origin
      (e.g. left-top is default)

      @property translation
      @type Object {x,y} translation
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

  /*
    Stack given array of elements using options

    @example
    this.call(helpers.stack)
    this.call(helpers.stack.bind(this, {direction: 'horizontal', origin: 'left'}))

    @param {Object} [options]
    - {String} [direction=vertical] vertical or horizontal
    - {String} [origin=top] top/bottom for vertical and left/right for horizontal
  */
  function stack(options, elements) {
    if (options && !elements) {
      elements = options;
      options = {
        direction: 'vertical',
        origin: 'top',
        padding: 0
      };
    }

    function padding(d, i) {
      return i > 0 && options.padding ? options.padding : 0;
    }

    if (elements && elements.attr) {
      var previous = 0;
      elements
        .attr('transform', function(d, i) {
          var dimensions = this.getBBox();
          var x = 0;
          var y = 0;

          if (options.direction == 'horizontal') {
            if (!(options.origin == 'left' || options.origin == 'right'))
              options.origin = 'left';

            if (options.origin == 'left')
              x = previous + padding(d, i);
            else
              x = previous + dimensions.width + padding(d, i);

            previous = previous + dimensions.width + padding(d, i);
          }
          else {
            if (!(options.origin == 'top' || options.origin == 'bottom'))
              options.origin = 'top';

            if (options.origin == 'top')
              y = previous + padding(d, i);
            else
              y = previous + dimensions.height + padding(d, i);

            previous = previous + dimensions.height + padding(d, i);
          }

          return helpers.translate(x, y);
        });
    }
  }

})(d3, d3.chart.helpers);
