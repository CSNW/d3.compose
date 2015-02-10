(function(d3, _, helpers) {
  var property = helpers.property;

  /**
    Container
    Foundation for chart and component placement

    Properties:
    - {Object/Array} rawData
    - {Object} margins {top, right, bottom, left} in px
    - {Number} width in px
    - {Number} height in px
  */
  d3.chart('Base').extend('Container', {
    initialize: function(options) {
      this.charts_by_id = {};
      this.components_by_id = {};

      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      };

      this.options(options || {});
      this.base.classed('chart-container', true);
      this.attachHoverListeners();
    },

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
          override: _.defaults({}, values, {
            top: 0, 
            right: 0, 
            bottom: 0, 
            left: 0
          })
        };
      }
    }),

    /**
      Chart position (generally used internally)

      @param {Object} value {top, right, bottom, left}
    */
    chartPosition: property('chartPosition', {
      default_value: function() {
        return {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: this.width(),
          height: this.height()
        };
      },
      set: function(values) {
        return {
          override: _.defaults({}, values, {
            top: 0, 
            right: 0, 
            bottom: 0, 
            left: 0,
            width: this.width() - values.right - values.left,
            height: this.height() - values.bottom - values.top
          })
        };
      }
    }),

    /**
      Get/set overall width/height of Container
    */
    width: property('width', {
      default_value: function() {
        return d3.chart('Base').prototype.width.call(this);
      },
    }),
    height: property('height', {
      default_value: function() {
        return d3.chart('Base').prototype.height.call(this);
      },
    }),

    draw: function(data) {
      // Explicitly set width and height of container
      // (if width/height > 0)
      this.base
        .attr('width', this.width() || null)
        .attr('height', this.height() || null);

      // Pre-draw for accurate dimensions for layout
      this.layout(data);

      // Full draw now that everything has been laid out
      d3.chart().prototype.draw.call(this, data);
    },

    /**
      Redraw with existing data
    */
    redraw: function() {
      // Using previously saved rawData, redraw chart      
      if (this.rawData())
        this.draw(this.rawData());
    },

    /**
      Get chart layer (for laying out with charts)

      @param {Object} options
      - z_index
    */
    chartLayer: function(options) {
      options = _.defaults({}, options, {
        z_index: helpers.z_index.chart
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
        z_index: helpers.z_index.component
      });

      return this.base.append('g')
        .attr('class', 'chart-component-layer')
        .attr('data-zIndex', options.z_index);
    },

    attachChart: function(id, chart) {
      this._attach(id, chart);
      this.charts_by_id[id] = chart;
    },

    detachChart: function(id) {
      var chart = this.charts_by_id[id];
      if (!chart) return;

      this._detach(id, chart);
      delete this.charts_by_id[id];
    },

    attachComponent: function(id, component) {
      this._attach(id, component);
      this.components_by_id[id] = component;
    },

    detachComponent: function(id) {
      var component = this.components_by_id[id];
      if (!component) return;

      this._detach(id, component);
      delete this.components_by_id[id];
    },

    _width: function() {
      return helpers.valueOrDefault(this.width(), d3.chart('Base').prototype.width.call(this));
    },
    _height: function() {
      return helpers.valueOrDefault(this.height(), d3.chart('Base').prototype.height.call(this));
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
      var inside;
      var trigger = this.trigger.bind(this);
      
      var throttledMouseMove = _.throttle(function(coordinates) {
        if (inside)
          trigger('move:mouse', coordinates);
      }, 50);

      this.base.on('mouseenter', function() {
        inside = true;
        trigger('enter:mouse', translateToXY(d3.mouse(this)));
      });
      this.base.on('mousemove', function() {
        throttledMouseMove(translateToXY(d3.mouse(this)));
      });
      this.base.on('mouseleave', function() {
        inside = false;
        trigger('leave:mouse');
      });

      var translateToXY = function(coordinates) {
        var x = coordinates[0];
        var y = coordinates[1];
        var chart_position = this.chartPosition();
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
      }.bind(this);
    },

    _attach: function(id, item) {
      item.id = id;
      item.base.attr('data-id', id);
      item.container = this;

      this.attach(id, item);

      if (item && _.isFunction(item.trigger))
        item.trigger('attach');
    },

    _detach: function(id, item) {
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
      var width = this.width();
      var height = this.height();
      
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
      _.each(this.components_by_id, function(component) {
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
