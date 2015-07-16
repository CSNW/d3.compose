(function(d3, helpers, charts) {
  var utils = helpers.utils;
  var property = helpers.property;

  /**
    d3.compose
    Compose rich, data-bound charts from charts (like Lines and Bars) and components (like Axis, Title, and Legend) with d3 and d3.chart.
    Using the `options` property, charts and components can be bound to data and customized to create dynamic charts.

    @example
    ```html
    <div id="#chart"></div>
    ```
    ```js
    var chart = d3.select('#chart')
      .chart('Compose', function(data) {
        // Process data...
        
        // Create shared scales
        var scales = {
          x: {data: data.input, key: 'x', adjacent: true},
          y: {data: data.input, key: 'y'},
          y2: {data: data.output, key: 'y'}
        };

        return {
          charts: {
            input: {
              type: 'Bars', data: data.input, xScale: scales.x, yScale: scales.y
            },
            output: {
              type: 'Lines', data: data.output, xScale: scales.x, yScale: scales.y2}
            }
          },
          components: {
            'axis.y': {
              type: 'Axis', scale: scales.y, position: 'left'
            },
            'axis.y2': {
              type: 'Axis', scale: scales.y2, position: 'right'
            }
            title: {
              type: 'Title', position: 'top', text: 'd3.compose'
            }
          }
        });
      });

    chart.draw({input: [...], output: [...]});
    ```

    @class Compose
    @param {Function|Object} [options]
  */
  charts.Compose = charts.Base.extend('Compose', {
    initialize: function() {
      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      };

      // Responsive svg based on the following approach (embedded + padding hack)
      // http://tympanus.net/codrops/2014/08/19/making-svgs-responsive-with-css/
      // (not enabled if selection is svg)
      if (this.base.node().tagName != 'svg') {
        this.container = this.base.append('div')
          .attr('class', 'chart-compose-container');

        this.base = this.container.append('svg')
          .attr('xlmns', 'http://www.w3.org/2000/svg')
          .attr('version', '1.1')
          .attr('class', 'chart-compose');
      }
      else {
        this.base.classed('chart-compose', true);
      }

      this.attachHoverListeners();
    },

    /**
      Get/set the options `object/function` for the chart that takes `data` and
      returns `{charts, components}` for composing child charts and components.
      All values are passed to the corresponding property (`{components}` sets `components` property).

      @example
      ```js
      // get
      chart.options();

      // set (static)
      chart.options({
        charts: {},
        components: {}
      });

      // set (dynamic, takes data and returns options)
      chart.options(function(data) {
        // process data...

        return {
          charts: {},
          components: {}
        };
      });

      // Set directly from d3.chart creation
      d3.select('#chart')
        .chart('Compose', function(data) {
          // ...
        });
      ```
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

    // Store raw data for container before it has been transformed
    rawData: property('rawData'),

    /**
      Margins between edge of container and components/chart

      @example
      ```js
      chart.margins({top: 10, right: 20, bottom: 10, left: 20});
      ```
      @property margins
      @type Object {top, right, bottom, left}
      @default {top: 10, right: 10, bottom: 10, left: 10}
    */
    margins: property('margins', {
      default_value: {top: 10, right: 10, bottom: 10, left: 10},
      set: function(values) {
        return {
          override: utils.defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0})
        };
      }
    }),

    // Chart position
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
      return width != null ? width : charts.Base.prototype.width.call(this);
    },
    _height: function() {
      var height = this.height();
      return height != null ? height : charts.Base.prototype.height.call(this);
    },

    /**
      @property responsive
      @type Boolean
      @default true
    */
    responsive: property('responsive', {
      default_value: true
    }),

    // Set svg viewBox attribute
    viewBox: property('viewBox', {
      default_value: function() {
        if (this.responsive() && this.width() && this.height())
          return '0 0 ' + this.width() + ' ' + this.height();
        else
          return null;
      }
    }),

    // Set svg preserveAspectRatio attribute
    preserveAspectRatio: property('preserveAspectRatio', {
      default_value: function() {
        if (this.responsive())
          return 'xMidYMid meet';
        else
          return null;
      }
    }),

    // Set container style
    containerStyle: property('containerStyle', {
      default_value: function() {
        if (this.responsive()) {
          var aspect_ratio = 1;
          if (this.width() && this.height())
            aspect_ratio = this.height() / this.width();

          return helpers.style({
            width: '100%',
            height: 0,
            'padding-top': (aspect_ratio * 100) + '%',
            position: 'relative'
          });  
        }
        else {
          return helpers.style({position: 'relative'});
        }
      }
    }),

    // Set base style
    baseStyle: property('baseStyle', {
      default_value: function() {
        if (this.responsive()) {
          return helpers.style({
            position: 'absolute',
            top: 0,
            left: 0
          });
        }
        else {
          return null;
        }
      }
    }),

    /**
      Set charts from options or get chart instances.
      Each chart should use a unique key so that updates are passed to the existing chart
      (otherwise they are recreated on update).
      The `type` option must be a registered `d3.chart` and all other options are passed to the chart.

      @example
      ```js
      chart.charts({
        input: {type: 'Bars'}, // options to pass to Bars chart
        output: {type: 'Lines'} // options to pass to Lines chart
      });
      ```
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
      Set components from options or get components instances.
      Each component should use a unique key so that updates are passed to the existing chart
      (otherwise they are recreated on update).
      The `type` option must be a registered `d3.chart` and all other options are passed to the component.

      @example
      ```js
      chart.components({
        'axis.y': {type: 'Axis'}, // options to pass to Axis component
        title: {type: 'Title'} // options to pass to Title component
      })
      ```
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

      @example
      ```js
      var chart = d3.select('#chart')
        .chart('Compose', function(data) {
          // ...
        });

      chart.draw([1, 2, 3]);

      chart.draw({values: [1, 2, 3]});
      
      chart.draw([
        {values: [1, 2, 3]},
        {values: [4, 5, 6]}
      ]);
      ```
      @method draw
      @param {Any} data
    */
    draw: function(data) {
      // On redraw, get original data
      data = data && data.original || data;
      var config = prepareConfig(this.options(), data);

      // Set charts and components from config
      if (config.charts)
        this.charts(config.charts);
      if (config.components)
        this.components(config.components);

      // Add config data
      data = {
        original: data,
        config: config.data
      };
      this.data(data);

      // Set container and svg dimensions
      // (if original selection is svg, no container and skip responsiveness)
      if (this.container) {
        this.container
          .attr('style', this.containerStyle());

        this.base
          .attr('viewBox', this.viewBox())
          .attr('preserveAspectRatio', this.preserveAspectRatio())
          .attr('style', this.baseStyle())
          .attr('width', this.responsive() ? null : this.width() || null)
          .attr('height', this.responsive() ? null : this.height() || null);  
      }
      else {
        this.base
          .attr('width', this.width() || null)
          .attr('height', this.height() || null);
      }

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

    // Create chart layer (for laying out charts)
    createChartLayer: function(options) {
      options = utils.defaults({}, options, {
        z_index: charts.Chart.z_index
      });

      return this.base.append('g')
        .attr('class', 'chart-layer')
        .attr('data-zIndex', options.z_index);
    },

    // Create component layer
    createComponentLayer: function(options) {
      options = utils.defaults({}, options, {
        z_index: charts.Component.z_index
      });

      return this.base.append('g')
        .attr('class', 'chart-component-layer')
        .attr('data-zIndex', options.z_index);
    },

    // Create overlay layer
    createOverlayLayer: function(options) {
      if (!this.container)
        throw new Error('Cannot create overlay layer if original selection "d3.select(...).chart(\'Compose\')" is an svg. Use a div instead for responsive and overlay support.');

      return this.container.append('div')
        .attr('class', 'chart-overlay-layer');
    },

    // Layout components and charts for given data
    layout: function(data) {
      // 1. Place chart layers
      positionChartLayers(this.base.selectAll('.chart-layer'), this.chartPosition());

      // 2. Extract layout from components
      var layout = extractLayout(this.components(), data, this.demux.bind(this));

      // 3. Set chart position from layout
      var chart_position = utils.extend({}, this.margins());
      utils.objectEach(layout, function(parts, key) {
        parts.forEach(function(part) {
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
      var container = this.container || this.base;
      var base = this.base.node();
      var inside, chart_position;

      container.on('mouseenter', function() {
        // Calculate chart position on enter and cache during move
        chart_position = chartPosition();

        inside = true;
        trigger('mouseenter', translateToXY(d3.mouse(base), chart_position));
      });
      container.on('mousemove', function() {
        if (inside) {
          // Overlay layers may inadvertently delay mouseleave
          // so explicity check if mouse is within bounds of svg base element
          var mouse = d3.mouse(document.documentElement);
          var bounds = base.getBoundingClientRect();
          var inside_base = mouse[0] >= bounds.left && mouse[0] <= bounds.right && mouse[1] >= bounds.top && mouse[1] <= bounds.bottom;

          if (inside_base) {
            trigger('mousemove', translateToXY(d3.mouse(base), chart_position));
          }
          else {
            inside = false;
            trigger('mouseleave');
          }
        }
      });
      container.on('mouseleave', function() {
        if (inside) {
          inside = false;
          trigger('mouseleave');  
        }
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

    // Attach chart/component child item with id
    attach: function(id, item) {
      item.id = id;
      item.base.attr('data-id', id);
      item.container = this;

      d3.chart('Base').prototype.attach.call(this, id, item);

      if (item && utils.isFunction(item.trigger))
        item.trigger('attach');
    },

    // Detach chart/component child item by id
    detach: function(id, item) {
      item.base.remove();

      delete this._attached[id];

      if (item && utils.isFunction(item.trigger))
        item.trigger('detach');
    },

    // Position chart and component layers
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
    var remove_ids = utils.difference(Object.keys(container), Object.keys(items));
    remove_ids.forEach(function(remove_id) {
      context.detach(remove_id, container[remove_id]);
      delete container[remove_id];
    });

    // Create or update charts
    utils.objectEach(items, function(options, id) {
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
          var createLayer = {
            'chart': 'createChartLayer',
            'component': 'createComponentLayer',
            'overlay': 'createOverlayLayer'
          }[Item.layer_type];

          if (!createLayer)
            throw new Error('Unrecognized layer type "' + Item.layer_type + '" for ' + options.type);

          var base = context[createLayer](layer_options);

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

    // Clone config and config.charts/components
    config = utils.extend({}, config);
    if (config.charts)
      config.charts = utils.extend({}, config.charts);
    if (config.components)
      config.components = utils.extend({}, config.components);

    config.data = {
      charts: {},
      components: {}
    };

    utils.objectEach(config.charts, function(options, id) {
      if (options.data) {
        // Store data for draw later
        config.data.charts[id] = options.data;

        // Remove data from options
        options = utils.extend({}, options);
        delete options.data;
        config.charts[id] = options;
      }
    });

    utils.objectEach(config.components, function(options, id) {
      if (options.data) {
        // Store data for draw later
        config.data.components[id] = options.data;

        // Remove data from options
        options = utils.extend({}, options);
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
    layout.top.reduce(function(previous, part, index, parts) {
      var y = previous - part.offset;
      setLayout(part.component, chart.left, y, {width: chart.width});

      return y;
    }, chart.top);

    layout.right.reduce(function(previous, part, index, parts) {
      var previousPart = parts[index - 1] || {offset: 0};
      var x = previous + previousPart.offset;
      setLayout(part.component, x, chart.top, {height: chart.height});

      return x;
    }, width - chart.right);

    layout.bottom.reduce(function(previous, part, index, parts) {
      var previousPart = parts[index - 1] || {offset: 0};
      var y = previous + previousPart.offset;
      setLayout(part.component, chart.left, y, {width: chart.width});

      return y;
    }, height - chart.bottom);

    layout.left.reduce(function(previous, part, index, parts) {
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
    function setZIndex(layer) {
      return {
        layer: layer,
        zIndex: parseInt(d3.select(layer).attr('data-zIndex')) || 0
      };
    }
    function sortZIndex(a, b) {
      if (a.zIndex < b.zIndex)
        return -1;
      else if (a.zIndex > b.zIndex)
        return 1;
      else
        return 0;
    }
    function getLayer(wrapped) {
      return wrapped.layer;
    }

    layers = layers.map(setZIndex).sort(sortZIndex).map(getLayer);

    // Move layers to z-index order
    layers.forEach(function(layer) {
      if (layer && layer.parentNode && layer.parentNode.appendChild)
        layer.parentNode.appendChild(layer);
    });
  }

  function extractLayout(components, data, demux) {
    var overall_layout = {top: [], right: [], bottom: [], left: []};
    utils.objectEach(components, function(component, id) {
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
