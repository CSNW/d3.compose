(function(d3, _, helpers, extensions) {
  var property = helpers.property;
  
  /**
    Base
    Shared functionality between all charts, components, and containers

    Properties:
    - {Object|Array} data Store fully-transformed data
    - {Object} style Overall style of chart/component
  */
  d3.chart('Base', {
    initialize: function() {
      // Bind all di-functions to this chart
      helpers.bindAllDi(this);
    },

    data: property('data', {
      set: function(data) {
        // BUG This is triggered automatically, but it needs to be re-triggered
        // Has something to do with how scales are sent to components (e.g. axes)
        this.trigger('change:data', 'BUG');
      }
    }),
    style: property('style', {
      get: function(value) {
        return helpers.style(value) || null;
      }
    }),
    options: property('options', {
      defaultValue: {},
      set: function(options) {
        this.setFromOptions(options);
      }
    }),

    width: function width() {
      return helpers.dimensions(this.base).width;
    },
    height: function height() {
      return helpers.dimensions(this.base).height;
    },

    /**
      Trigger redraw on property changes

      @example
      ```js
      this.redrawFor('title', 'style')
      // -> on change:title, redraw()
      ```

      @param {String...} properties
    */
    redrawFor: function(property) {
      var properties = _.toArray(arguments);
      var events = _.map(properties, function(property) {
        return 'change:' + property;
      });

      // d3.chart doesn't handle events with spaces, register individual handlers
      _.each(events, function(event) {
        this.on(event, function() {
          // console.log('REDRAW', _.isFunction(this.redraw), this.container && _.isFunction(this.container.redraw));
          if (_.isFunction(this.redraw))
            this.redraw();
          else if (this.container && _.isFunction(this.container.redraw))
            this.container.redraw();
        });
      }, this);
    },

    transform: function(data) {
      data = data || [];

      // Base is last transform to be called,
      // so stored data has been fully transformed
      this.data(data);
      return data;
    },

    setFromOptions: function(options) {
      // Set any properties from options
      _.each(options, function(value, key) {
        if (this[key] && this[key].isProperty && this[key].setFromOptions)
          this[key](value, {silent: true});
      }, this);
    }
  });

  /**
    Chart: Foundation for building charts with series data
  */
  d3.chart('Base').extend('Chart', {
    initialize: function(options) {
      this.options(options || {});
      this.redrawFor('options');
    }
  });
  d3.chart('Chart').extend('SeriesChart', extensions.Series);

  /**
    Container

    Foundation for chart and component placement
  */
  d3.chart('Base').extend('Container', {
    initialize: function(options) {
      this.chartsById = {};
      this.componentsById = {};

      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      };

      this.base.classed('chart', true);

      this.on('change:dimensions', function() {
        this.redraw();
      });

      this.options(options || {});
      this.redrawFor('options');

      this.handleResize();
      this.handleHover();
    },

    draw: function(data) {
      // Explicitly set width and height of container
      // (if width/height > 0)
      this.base
        .attr('width', this.width() || null)
        .attr('height', this.height() || null);

      // Pre-draw for accurate dimensions for layout
      this._preDraw(data);

      // Layout now that components' dimensions are known
      this.layout();

      // Full draw now that everything has been laid out
      d3.chart().prototype.draw.call(this, data);
    },

    redraw: function() {
      // Using previously saved rawData, redraw chart      
      if (this.rawData())
        this.draw(this.rawData());
    },

    chartLayer: function(options) {
      options = _.defaults({}, options, {
        zIndex: helpers.zIndex.chart
      });

      return this.base.append('g')
        .attr('class', 'chart-layer')
        .attr('data-zIndex', options.zIndex);
    },

    componentLayer: function(options) {
      options = _.defaults({}, options, {
        zIndex: helpers.zIndex.component
      });

      return this.base.append('g')
        .attr('class', 'chart-component-layer')
        .attr('data-zIndex', options.zIndex);
    },

    attachChart: function(id, chart) {
      chart.id = id;
      chart.base.attr('data-id', id);
      chart.container = this;

      this.attach(id, chart);
      this.chartsById[id] = chart;
    },

    detachChart: function(id) {
      var chart = this.chartsById[id];
      if (!chart) return;

      // Remove chart base layer and all children
      chart.base.remove();

      delete this._attached[id];
      delete this.chartsById[id];
    },

    attachComponent: function(id, component) {
      component.id = id;
      component.base.attr('data-id', id);
      component.container = this;

      this.attach(id, component);
      this.componentsById[id] = component;

      component.on('change:position', function() {
        this.trigger('change:dimensions');
      });
    },

    detachComponent: function(id) {
      var component = this.componentsById[id];
      if (!component) return;

      // Remove component base layer and all children
      component.base.remove();

      component.off('change:position');
      delete this._attached[id];
      delete this.componentsById[id];
    },

    layout: function() {
      var layout = this._extractLayout();
      this._updateChartMargins(layout);
      this._positionLayers(layout);
    },

    rawData: property('rawData'),

    // Chart margins from Container edges ({top, right, bottom, left})
    chartMargins: property('chartMargins', {
      get: function(values) {
        values = (values && typeof values == 'object') ? values : {};
        values = _.defaults(values, {top: 0, right: 0, bottom: 0, left: 0});

        return values;
      },
      set: function(values, previous) {
        values = (values && typeof values == 'object') ? values : {};
        values = _.defaults(values, previous, {top: 0, right: 0, bottom: 0, left: 0});

        return {
          override: values,
          after: function() {
            this.trigger('change:dimensions');
          }
        };
      }
    }),

    width: property('width', {
      defaultValue: function() {
        return helpers.dimensions(this.base).width;
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    }),
    height: property('height', {
      defaultValue: function() {
        return helpers.dimensions(this.base).height;
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    }),
    
    chartWidth: function() {
      var margins = this._chartMargins();
      return this.width() - margins.left - margins.right;
    },
    chartHeight: function() {
      var margins = this._chartMargins();
      return this.height() - margins.top - margins.bottom;
    },

    handleResize: function() {
      // TODO Further work on making sure resize happens properly
      // this.onResize = _.debounce(function() {
      //   this.trigger('change:dimensions');
      // }.bind(this), 250);
      // d3.select(window).on('resize', this.onResize);
    },

    handleHover: function() {
      this.on('enter:mouse', function(coordinates) {
        this.trigger('hover', coordinates);
      });
      this.on('move:mouse', function(coordinates) {
        this.trigger('hover', coordinates);
      });

      var hovering;
      var trigger = this.trigger.bind(this);
      var onMouseMove = this.onMouseMove = _.throttle(function(coordinates) {
        if (hovering)
          trigger('move:mouse', coordinates);
      }, 100);

      this.base.on('mouseenter', function() {
        hovering = true;
        trigger('enter:mouse', d3.mouse(this));
      });
      this.base.on('mousemove', function() {
        onMouseMove(d3.mouse(this));
      });
      this.base.on('mouseleave', function() {
        hovering = false;
        trigger('leave:mouse');
      });
    },

    _preDraw: function(data) {
      this._positionChartLayers();
      _.each(this.componentsById, function(component, id) {
        if (!component.skipLayout)
          component.draw(this.demux ? this.demux(id, data) : data);
      }, this);
    },

    _positionLayers: function(layout) {
      this._positionChartLayers();
      this._positionComponents(layout);
      this._positionByZIndex();      
    },

    _positionChartLayers: function() {
      var margins = this._chartMargins();

      this.base.selectAll('.chart-layer')
        .attr('transform', helpers.transform.translate(margins.left, margins.top))
        .attr('width', this.chartWidth())
        .attr('height', this.chartHeight());
    },

    _positionComponents: function(layout) {
      var margins = this._chartMargins();
      var width = this.width();
      var height = this.height();
      var chartWidth = this.chartWidth();
      var chartHeight = this.chartHeight();

      _.reduce(layout.top, function(previous, part, index, parts) {
        var y = previous - part.offset;
        setLayout(part.component, margins.left, y, {width: chartWidth});
        
        return y;
      }, margins.top);

      _.reduce(layout.right, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var x = previous + previousPart.offset;
        setLayout(part.component, x, margins.top, {height: chartHeight});

        return x;
      }, width - margins.right);

      _.reduce(layout.bottom, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var y = previous + previousPart.offset;
        setLayout(part.component, margins.left, y, {width: chartWidth});

        return y;
      }, height - margins.bottom);

      _.reduce(layout.left, function(previous, part, index, parts) {
        var x = previous - part.offset;
        setLayout(part.component, x, margins.top, {height: chartHeight});

        return x;
      }, margins.left);

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
        return +d3.select(element).attr('data-zIndex') || 0;
      });

      // Move layers to z-index order
      _.each(elements, function(element) {
        element.parentNode.appendChild(element);
      }, this);
    },

    // Update margins from components layout
    _updateChartMargins: function(layout) {
      // Copy margins to prevent updating user-defined margins
      var margins = _.extend({}, this.chartMargins());
      _.each(layout, function(parts, key) {
        _.each(parts, function(part) {
          margins[key] += part.offset || 0;
        });
      });
      
      this._chartMargins(margins);

      return margins;
    },

    // Extract layout from components
    _extractLayout: function() {
      var layout = {top: [], right: [], bottom: [], left: []};
      _.each(this.componentsById, function(component) {
        if (component.skipLayout)
          return;

        var position = component.layoutPosition();
        if (!_.contains(['top', 'right', 'bottom', 'left'], position))
          return;

        var offset;
        if (position == 'top' || position == 'bottom')
          offset = component.layoutHeight();
        else
          offset = component.layoutWidth();

        layout[position].push({
          offset: offset,
          component: component
        });
      });
      
      return layout;
    },

    // Internal chart margins to separate from user-defined margins
    _chartMargins: property('_chartMargins', {
      defaultValue: function() {
        return _.extend({}, this.chartMargins());
      }
    }),
  });
  
  /**
    Component
    Common component functionality / base for creating components

    Properties
    - {String} [position = top] (top, right, bottom, left)
    - {Number} [width = base width]
    - {Number} [height = base height]
    - {Object} [margins] % margins relative to component dimensions
      - top {Number} % of height
      - right {Number} % of width
      - bottom {Number} % of height
      - left {Number} % of width

    Customization
    - skipLayout: Don't use this component type during layout (e.g. inset within chart)
    - layoutWidth: Adjust with more precise sizing calculations
    - layoutHeight: Adjust with more precise sizing calculations
    - layoutPosition: Adjust layout positioning
    - setLayout: Override if layout needs to be customized
  */
  d3.chart('Base').extend('Component', {
    initialize: function(options) {
      this.options(options || {});
      this.redrawFor('options');
    },

    position: property('position', {
      defaultValue: 'top',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),
    width: property('width', {
      defaultValue: function() {
        return helpers.dimensions(this.base).width;
      }
    }),
    height: property('height', {
      defaultValue: function() {
        return helpers.dimensions(this.base).height;
      }
    }),

    margins: property('margins', {
      get: function(values) {
        var percentages = _.defaults({}, values, {top: 0.0, right: 0.0, bottom: 0.0, left: 0.0});
        var width = this.width();
        var height = this.height();

        return {
          top: percentages.top * height,
          right: percentages.right * width,
          bottom: percentages.bottom * height,
          left: percentages.left * width
        };
      }
    }),

    /**
      Height/width/position to use in layout calculations
      (Override for more specific sizing in layout calculations)
    */
    skipLayout: false,
    layoutWidth: function() {
      var margins = this.margins();
      return this.width() + margins.left + margins.right;
    },
    layoutHeight: function() {
      var margins = this.margins();
      return this.height() + margins.top + margins.bottom;
    },
    layoutPosition: function() {
      return this.position();
    },

    /**
      Set layout of underlying base
      (Override for elements placed within chart)
    */
    setLayout: function(x, y, options) {
      var margins = this.margins();
      this.base.attr('transform', helpers.transform.translate(x + margins.left, y + margins.top));
      this.height(options && options.height);
      this.width(options && options.width);
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
