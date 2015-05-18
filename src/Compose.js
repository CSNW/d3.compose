(function(d3, helpers, charts) {
  var utils = helpers.utils;
  var property = helpers.property;

  /**
    d3.compose
    Compose rich, data-bound charts from charts (like Lines and Bars) and components (like Axis, Title, and Legend) with d3 and d3.chart

    @example
    ```javascript
    var chart = d3.select('#chart')
      .chart('Compose', function(data) {
        // Process data...
        var participation = data.participation;
        var results = data.results;
        var scales = {
          x: {data: participation.concat(results), key: 'x', adjacent: true},
          y: {data: participation, key: 'y'},
          y2: {data: results, key: 'y'}
        };

        return {
          charts: {
            participation: {type: 'Bars', data: participation, xScale: scales.x, yScale: scales.y},
            results: {type: 'Line', data: results, xScale: scales.x, yScale: scales.y2, labels: {position: 'top'}}
          },
          components: {
            title: {type: 'Title', position: 'top', text: 'd3.compose'}
          }
        });
      });

    chart.draw({participation: [...], results: [...]});
    ```

    @class Compose
    @param {Function|Object} [options]
  */
  charts.Compose = charts.Base.extend('Compose', {
    initialize: function(options) {
      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      };

      if (options)
        this.options(options);

      this.base.classed('chart-compose', true);
      this.attachHoverListeners();
    },

    /**
      Options function that returns {chart,component} for data or static {chart,component}

      @property options
      @type Function|Object
    */
    options: property('options', {
      default_value: function(data) { return {}; },
      type: 'Function',
      set: function(options) {
        // If options is plain object,
        // return from generic options function
        if (!utils.isFunction(options)) {
          return {
            override: function(data) {
              return options;
            }
          };
        }
      }
    }),

    /**
      Store raw data for container before it has been transformed

      @property rawData
      @type Any
    */
    rawData: property('rawData'),

    /**
      Margins between edge of container and components/chart

      @property margins
      @type Object {top, right, bottom, left}
    */
    margins: property('margins', {
      default_value: {top: 10, right: 10, bottom: 10, left: 10},
      set: function(values) {
        return {
          override: utils.defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0})
        };
      }
    }),

    /**
      Chart position (generally used internally)

      @internal
      @property chartPosition
      @param Object {top, right, bottom, left}
    */
    chartPosition: property('chartPosition', {
      default_value: {top: 0, right: 0, bottom: 0, left: 0},
      set: function(values) {
        return {
          override: utils.defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0})
        };
      },
      get: function(values) {
        values.width = this._width() - values.right - values.left;
        values.height = this._height() - values.bottom - values.top;

        return values;
      }
    }),

    /**
      Get/set overall width of chart

      @property width
      @type Number
    */
    width: property('width'),

    /**
      Get/set overall height of chart

      @property height
      @type Number
    */
    height: property('height'),

    _width: function() {
      var width = this.width();
      return width != null ? width : d3.chart('Base').prototype.width.call(this);
    },
    _height: function() {
      var height = this.height();
      return height != null ? height : d3.chart('Base').prototype.height.call(this);
    },

    /**
      Set charts from options or get charts
      (Set from charts returned from `options` function)

      @property charts
      @type Object
    */
    charts: property('charts', {
      set: function(chart_options, charts) {
        // Store actual charts rather than options
        return {
          override: attachItems(chart_options, charts, this)
        };
      },
      default_value: {}
    }),

    /**
      Set components from options or get components
      (Set from components returned from `options` function)

      @property components
      @type Object
    */
    components: property('components', {
      set: function(component_options, components) {
        // Store actual components rather than options
        return {
          override: attachItems(component_options, components, this)
        };
      },
      default_value: {}
    }),

    /**
      Draw chart with given data

      @method draw
      @param {Object} data
    */
    draw: function(data) {
      // On redraw, get original data
      data = data && data.original || data;
      var config = prepareConfig(this.options(), data);

      // Set charts and components from config
      utils.each(config, function(value, key) {
        if (this[key] && this[key].is_property && this[key].set_from_options)
          this[key](value);
      }, this);

      // Add config data
      data = {
        original: data,
        config: config.data
      };
      this.data(data);

      // Explicitly set width and height of container if width/height is defined
      this.base
        .attr('width', this.width() || null)
        .attr('height', this.height() || null);

      // Layout components
      this.layout(data);

      // Full draw now that everything has been laid out
      d3.chart().prototype.draw.call(this, data);
    },

    /**
      Redraw chart with current data

      @method redraw
    */
    redraw: function() {
      if (this.rawData())
        this.draw(this.rawData().original);
    },

    demux: function(name, data) {
      if (!data || !data.config || !data.original)
        return data;

      if (this.charts()[name] && data.config.charts[name])
        return data.config.charts[name];
      else if (this.components()[name] && data.config.components[name])
        return data.config.components[name];
      else
        return data.original;
    },

    /**
      Create chart layer (for laying out with charts)

      @method createChartLayer
      @param {Object} options
        @param {Number} options.z_index
      @return {d3.selection}
    */
    createChartLayer: function(options) {
      options = utils.defaults({}, options, {
        z_index: d3.chart('Chart').z_index
      });

      return this.base.append('g')
        .attr('class', 'chart-layer')
        .attr('data-zIndex', options.z_index);
    },

    /**
      create component layer

      @method createComponentLayer
      @param {Object} options
        @param {Number} options.z_index
      @return {d3.selection}
    */
    createComponentLayer: function(options) {
      options = utils.defaults({}, options, {
        z_index: d3.chart('Component').z_index
      });

      return this.base.append('g')
        .attr('class', 'chart-component-layer')
        .attr('data-zIndex', options.z_index);
    },

    // Layout components and chart for given data
    layout: function(data) {
      // 1. Place chart layers
      positionChartLayers(this.base.selectAll('.chart-layer'), this.chartPosition());

      // 2. Extract layout from components
      var layout = extractLayout(this.components(), data, this.demux.bind(this));

      // 3. Set chart position from layout
      var chart_position = utils.extend({}, this.margins());
      utils.each(layout, function(parts, key) {
        utils.each(parts, function(part) {
          chart_position[key] += part.offset || 0;
        });
      });
      this.chartPosition(chart_position);

      // 4. Position layers with layout
      this.positionLayers(layout);
    },

    attachHoverListeners: function() {
      var trigger = this.trigger.bind(this);
      var chartPosition = this.chartPosition.bind(this);
      var inside, chart_position;

      var throttledMouseMove = utils.throttle(function(coordinates) {
        if (inside)
          trigger('mousemove', coordinates);
      }, 50);

      this.base.on('mouseenter', function() {
        // Calculate chart position on enter and cache during move
        chart_position = chartPosition();

        inside = true;
        trigger('mouseenter', translateToXY(d3.mouse(this), chart_position));
      });
      this.base.on('mousemove', function() {
        throttledMouseMove(translateToXY(d3.mouse(this), chart_position));
      });
      this.base.on('mouseleave', function() {
        inside = false;
        trigger('mouseleave');
      });

      function translateToXY(coordinates, chart_position) {
        var x = coordinates[0];
        var y = coordinates[1];
        var chart_x = x - chart_position.left;
        var chart_y = y - chart_position.top;

        // Set at chart bounds if outside of chart
        if (x > (chart_position.left + chart_position.width))
          chart_x = chart_position.left + chart_position.width;
        else if (x < chart_position.left)
          chart_x = 0;

        if (y > (chart_position.top + chart_position.height))
          chart_y = chart_position.top + chart_position.height;
        else if (y < chart_position.top)
          chart_y = 0;

        return {
          container: {x: x, y: y},
          chart: {x: chart_x, y: chart_y}
        };
      }
    },

    attach: function(id, item) {
      item.id = id;
      item.base.attr('data-id', id);
      item.container = this;

      d3.chart('Base').prototype.attach.call(this, id, item);

      if (item && utils.isFunction(item.trigger))
        item.trigger('attach');
    },

    detach: function(id, item) {
      item.base.remove();

      delete this._attached[id];

      if (item && utils.isFunction(item.trigger))
        item.trigger('detach');
    },

    positionLayers: function(layout) {
      positionChartLayers(this.base.selectAll('.chart-layer'), this.chartPosition());
      positionComponents(layout, this.chartPosition(), this._width(), this._height());
      positionByZIndex(this.base.selectAll('.chart-layer, .chart-component-layer')[0]);
    },
  });

  //
  // Internal
  //

  function attachItems(items, container, context) {
    items = items || {};
    container = container || {};

    // Remove charts that are no longer needed
    var remove_ids = utils.difference(utils.keys(container), utils.keys(items));
    utils.each(remove_ids, function(remove_id) {
      context.detach(remove_id, container[remove_id]);
      delete container[remove_id];
    });

    // Create or update charts
    utils.each(items, function(options, id) {
      var item = container[id];

      if (options instanceof d3.chart()) {
        // If chart instance, replace with instance
        if (item)
          context.detach(id, item);

        context.attach(id, options);
        container[id] = options;
      }
      else {
        if (item && item.type != options.type) {
          // If chart type has changed, detach and re-create
          context.detach(id, item);
          item = undefined;
        }

        if (!item) {
          var Item = d3.chart(options.type);

          if (!Item)
            throw new Error('No registered d3.chart found for ' + options.type);

          var layer_options = {z_index: Item.z_index};
          var base = Item.layer_type == 'chart' ? context.createChartLayer(layer_options) : context.createComponentLayer(layer_options);

          item = new Item(base, options);
          item.type = options.type;

          context.attach(id, item);
          container[id] = item;
        }
        else {
          item.options(options);
        }
      }
    });

    return container;
  }

  function prepareConfig(options, data) {
    // Load config from options fn
    var config = options(data);

    config = utils.defaults({}, config, {
      charts: {},
      components: {}
    });

    config.data = {
      charts: {},
      components: {}
    };

    utils.each(config.charts, function(options, id) {
      if (options.data) {
        // Store data for draw later
        config.data.charts[id] = options.data;

        // Remove data from options
        options = utils.clone(options);
        delete options.data;
        config.charts[id] = options;
      }
    });

    utils.each(config.components, function(options, id) {
      if (options.data) {
        // Store data for draw later
        config.data.components[id] = options.data;

        // Remove data from options
        options = utils.clone(options);
        delete options.data;
        config.components[id] = options;
      }
    });

    return config;
  }

  function positionChartLayers(chart_layers, position) {
    chart_layers
      .attr('transform', helpers.translate(position.left, position.top))
      .attr('width', position.width)
      .attr('height', position.height);
  }

  function positionComponents(layout, chart, width, height) {
    utils.reduce(layout.top, function(previous, part, index, parts) {
      var y = previous - part.offset;
      setLayout(part.component, chart.left, y, {width: chart.width});

      return y;
    }, chart.top);

    utils.reduce(layout.right, function(previous, part, index, parts) {
      var previousPart = parts[index - 1] || {offset: 0};
      var x = previous + previousPart.offset;
      setLayout(part.component, x, chart.top, {height: chart.height});

      return x;
    }, width - chart.right);

    utils.reduce(layout.bottom, function(previous, part, index, parts) {
      var previousPart = parts[index - 1] || {offset: 0};
      var y = previous + previousPart.offset;
      setLayout(part.component, chart.left, y, {width: chart.width});

      return y;
    }, height - chart.bottom);

    utils.reduce(layout.left, function(previous, part, index, parts) {
      var x = previous - part.offset;
      setLayout(part.component, x, chart.top, {height: chart.height});

      return x;
    }, chart.left);

    function setLayout(component, x, y, options) {
      if (component && utils.isFunction(component.setLayout))
        component.setLayout(x, y, options);
    }
  }

  function positionByZIndex(layers) {
    // Sort by z-index
    layers = utils.sortBy(layers, function(layer) {
      return parseInt(d3.select(layer).attr('data-zIndex')) || 0;
    });

    // Move layers to z-index order
    utils.each(layers, function(layer) {
      if (layer && layer.parentNode && layer.parentNode.appendChild)
        layer.parentNode.appendChild(layer);
    });
  }

  function extractLayout(components, data, demux) {
    var overall_layout = {top: [], right: [], bottom: [], left: []};
    utils.each(components, function(component, id) {
      if (component.skip_layout)
        return;

      var layout = component.getLayout(demux(id, data));
      var position = layout && layout.position;

      if (!utils.contains(['top', 'right', 'bottom', 'left'], position))
        return;

      overall_layout[position].push({
        offset: position == 'top' || position == 'bottom' ? layout.height : layout.width,
        component: component
      });
    }, this);

    return overall_layout;
  }

})(d3, d3.compose.helpers, d3.compose.charts);
