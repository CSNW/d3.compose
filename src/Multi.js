(function(d3, _, helpers) {
  var property = helpers.property;

  /**
    Multi chart

    Configure chart based on given options, including adding charts, axes, legend, and other properties

    @example
    ```javascript
    var chart = d3.select('#chart')
      .append('svg')
      .chart('Multi', function(data) {
        // Process data...
        var participation = data...;
        var results = data...;
        var scales = {
          x: {data: results or participation or join..., key: 'x'},
          y: {data: participation, key: 'y'},
          secondaryY: {data: results, key: 'y'}
        };

        return d3.chart.xy({
          charts: {
            participation: {type: 'Bars', data: participation, xScale: scales.x, yScale: scales.y, itemPadding: 20},
            results: {type: 'Line', data: results, xScale: scales.x, yScale: scales.secondaryY, labels: {position: 'top'}}
          },
          axes: {
            x: {scale: scales.x}
            y: {scale: scales.y},
            secondaryY: {scale: scales.secondaryY}
          },
          legend: true,
          title: 'd3.chart.multi'
        });
      })
    ```

    @param {Function|Object} options
  */
  d3.chart('Base').extend('Multi', {
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

      this.base.classed('chart-multi', true);
      this.attachHoverListeners();
    },

    options: property('options', {
      default_value: function(data) { return {}; },
      type: 'Function',
      set: function(options) {
        this._config = null;

        // If options is plain object,
        // return from generic options function
        if (!_.isFunction(options)) {
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

      @param {Object|Array} value
    */
    rawData: property('rawData'),

    /**
      Margins between edge of container and components/chart

      @param {Object} value {top, right, bottom, left}
    */
    margins: property('margins', {
      default_value: {top: 0, right: 0, bottom: 0, left: 0},
      set: function(values) {
        return {
          override: _.defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0})
        };
      }
    }),

    /**
      Chart position (generally used internally)

      @param {Object} value {top, right, bottom, left}
    */
    chartPosition: property('chartPosition', {
      default_value: {top: 0, right: 0, bottom: 0, left: 0},
      set: function(values) {
        return {
          override: _.defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0})
        };
      },
      get: function(values) {
        values.width = this._width() - values.right - values.left;
        values.height = this._height() - values.bottom - values.top;

        return values;
      }
    }),

    /**
      Get/set overall width/height of Container
    */
    width: property('width'),
    height: property('height'),

    _width: function() {
      var width = this.width();
      return width != null ? width : d3.chart('Base').prototype.width.call(this);
    },
    _height: function() {
      var height = this.height();
      return height != null ? height : d3.chart('Base').prototype.height.call(this);
    },

    charts: property('charts', {
      set: function(chart_options, charts) {
        chart_options = chart_options || {};
        charts = charts || {};
        
        // Remove charts that are no longer needed
        var remove_ids = _.difference(_.keys(charts), _.keys(chart_options));
        _.each(remove_ids, function(remove_id) {
          this.detach(remove_id, charts[remove_id]);
          delete charts[remove_id];
        }, this);

        // Create or update charts
        _.each(chart_options, function(options, id) {
          var chart = charts[id];

          // If chart type has changed, detach and re-create
          if (chart && chart.type != options.type) {
            this.detachChart(id);
            chart = undefined;
          }

          if (!chart) {
            var Chart = d3.chart(options.type);
            
            if (!Chart)
              throw new Error('No registered d3.chart found for ' + options.type);

            var base = this.chartLayer();

            chart = new Chart(base, options);
            chart.type = options.type;

            this.attach(id, chart);
            charts[id] = chart;
          }
          else {
            chart.options(options);
          }
        }, this);

        // Store actual charts rather than options
        return {
          override: charts
        };
      },
      default_value: {}
    }),

    components: property('components', {
      set: function(component_options, components) {
        component_options = component_options || {};
        components = components || {};

        // Remove components that are no longer needed
        var remove_ids = _.difference(_.keys(components), _.keys(component_options));
        _.each(remove_ids, function(remove_id) {
          this.detach(remove_id, components[remove_id]);
          delete components[remove_id];
        }, this);

        // Create or update components
        _.each(component_options, function(options, id) {
          var component = components[id];

          // If component type has change, detach and recreate
          if (component && component.type != options.type) {
            this.detachComponent(id);
            component = undefined;
          }

          if (!component) {
            var Component = d3.chart(options.type);

            if (!Component)
              throw new Error('No registered d3.chart found for ' + options.type);

            var layer_options = {z_index: Component.z_index};
            var base = Component.layer_type == 'chart' ? this.chartLayer(layer_options) : this.componentLayer(layer_options);

            component = new Component(base, options);
            component.type = options.type;

            this.attach(id, component);
            components[id] = component;
          }
          else {
            component.options(options);
          }
        }, this);

        // Store actual components rather than options
        return {
          override: components
        };
      },
      default_value: {}
    }),
  
    draw: function(data) {
      if (!this._config) {
        data = data.original || data;
        this._config = this._prepareConfig(data);

        // Set charts and components from config
        _.each(this._config, function(value, key) {
          if (this[key] && this[key].is_property && this[key].set_from_options)
            this[key](value);
        }, this);
      }

      // Add config data
      data = {
        original: data,
        config: this._config.data
      };

      // Explicitly set width and height of container if width/height is defined
      this.base
        .attr('width', this.width() || null)
        .attr('height', this.height() || null);

      // Layout components
      this.layout(data);

      // Full draw now that everything has been laid out
      d3.chart().prototype.draw.call(this, data);
    },

    redraw: function() {
      if (this.rawData())
        this.draw(this.rawData().original);
    },

    demux: function(name, data) {
      if (!data.config || !data.original)
        return data;

      if (this.charts()[name] && data.config.charts[name])
        return data.config.charts[name];
      else if (this.components()[name] && data.config.components[name])
        return data.config.components[name];
      else
        return data.original;
    },

    /**
      Get chart layer (for laying out with charts)

      @param {Object} options
      - z_index
    */
    chartLayer: function(options) {
      options = _.defaults({}, options, {
        z_index: d3.chart('Chart').z_index
      });

      return this.base.append('g')
        .attr('class', 'chart-layer')
        .attr('data-zIndex', options.z_index);
    },

    /**
      Get component layer

      @param {Object} options
      - z_index
    */
    componentLayer: function(options) {
      options = _.defaults({}, options, {
        z_index: d3.chart('Component').z_index
      });

      return this.base.append('g')
        .attr('class', 'chart-component-layer')
        .attr('data-zIndex', options.z_index);
    },

    /**
      Layout components and charts
    */
    layout: function(data) {
      // 1. Place chart layers
      this._positionChartLayers();

      // 2. Extract layout from components
      var layout = this._extractLayout(data);

      // 3. Set chart position from layout
      var chart_position = _.extend({}, this.margins());
      _.each(layout, function(parts, key) {
        _.each(parts, function(part) {
          chart_position[key] += part.offset || 0;
        });
      });
      this.chartPosition(chart_position);

      // 4. Position layers with layout
      this._positionLayers(layout);
    },

    attachHoverListeners: function() {
      var trigger = this.trigger.bind(this);
      var chartPosition = this.chartPosition.bind(this);
      var inside, chart_position;
      
      var throttledMouseMove = _.throttle(function(coordinates) {
        if (inside)
          trigger('move:mouse', coordinates);
      }, 50);

      this.base.on('mouseenter', function() {
        inside = true;
        chart_position = chartPosition();
        trigger('enter:mouse', translateToXY(d3.mouse(this), chart_position));
      });
      this.base.on('mousemove', function() {
        throttledMouseMove(translateToXY(d3.mouse(this), chart_position));
      });
      this.base.on('mouseleave', function() {
        inside = false;
        trigger('leave:mouse');
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

    _prepareConfig: function(data) {
      // Load config from options fn
      var config = this.options()(data);

      config = _.defaults({}, config, {
        charts: {},
        components: {}
      });

      config.data = {
        charts: {},
        components: {}
      };

      _.each(config.charts, function(options, id) {
        if (options.data) {
          // Store data for draw later
          config.data.charts[id] = options.data;

          // Remove data from options
          options = _.clone(options);
          delete options.data;
          config.charts[id] = options;
        }
      });

      _.each(config.components, function(options, id) {
        if (options.data) {
          // Store data for draw later
          config.data.components[id] = options.data;

          // Remove data from options
          options = _.clone(options);
          delete options.data;
          config.components[id] = options;
        }
      });

      return config;
    },

    attach: function(id, item) {
      item.id = id;
      item.base.attr('data-id', id);
      item.container = this;

      d3.chart('Base').prototype.attach.call(this, id, item);

      if (item && _.isFunction(item.trigger))
        item.trigger('attach');
    },

    detach: function(id, item) {
      item.base.remove();

      delete this._attached[id];

      if (item && _.isFunction(item.trigger))
        item.trigger('detach');
    },

    _positionLayers: function(layout) {
      this._positionChartLayers();
      this._positionComponents(layout);
      this._positionByZIndex();      
    },

    _positionChartLayers: function() {
      var position = this.chartPosition();
      
      this.base.selectAll('.chart-layer')
        .attr('transform', helpers.translate(position.left, position.top))
        .attr('width', position.width)
        .attr('height', position.height);
    },

    _positionComponents: function(layout) {
      var chart = this.chartPosition();
      var width = this._width();
      var height = this._height();
      
      _.reduce(layout.top, function(previous, part, index, parts) {
        var y = previous - part.offset;
        setLayout(part.component, chart.left, y, {width: chart.width});
        
        return y;
      }, chart.top);

      _.reduce(layout.right, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var x = previous + previousPart.offset;
        setLayout(part.component, x, chart.top, {height: chart.height});

        return x;
      }, width - chart.right);

      _.reduce(layout.bottom, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var y = previous + previousPart.offset;
        setLayout(part.component, chart.left, y, {width: chart.width});

        return y;
      }, height - chart.bottom);

      _.reduce(layout.left, function(previous, part, index, parts) {
        var x = previous - part.offset;
        setLayout(part.component, x, chart.top, {height: chart.height});

        return x;
      }, chart.left);

      function setLayout(component, x, y, options) {
        if (component && _.isFunction(component.setLayout))
          component.setLayout(x, y, options);
      }
    },

    _positionByZIndex: function() {
      // Get layers
      var elements = this.base.selectAll('.chart-layer, .chart-component-layer')[0];

      // Sort by z-index
      elements = _.sortBy(elements, function(element) {
        return parseInt(d3.select(element).attr('data-zIndex')) || 0;
      });

      // Move layers to z-index order
      _.each(elements, function(element) {
        element.parentNode.appendChild(element);
      }, this);
    },

    // Extract layout from components
    _extractLayout: function(data) {
      var overall_layout = {top: [], right: [], bottom: [], left: []};
      _.each(this.components(), function(component) {
        if (component.skip_layout)
          return;

        var layout = component.getLayout(data);
        var position = layout && layout.position;

        if (!_.contains(['top', 'right', 'bottom', 'left'], position))
          return;

        overall_layout[position].push({
          offset: position == 'top' || position == 'bottom' ? layout.height : layout.width,
          component: component
        });
      });
      
      return overall_layout;
    }
  });

})(d3, _, d3.chart.helpers);
