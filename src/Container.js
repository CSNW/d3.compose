(function(d3, _, helpers, extensions) {
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
      this.chartsById = {};
      this.componentsById = {};

      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      };

      this.base.classed('chart-container', true);

      this.options(options || {});
      this.redrawFor('options');

      this.on('change:dimensions', this.redraw);
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
      defaultValue: {top: 0, right: 0, bottom: 0, left: 0},
      set: function(values) {
        return {
          override: _.defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0}),
          after: function() {
            this.trigger('change:dimensions');
          }
        };
      }
    }),

    /**
      Chart position (generally used internally)

      @param {Object} value {top, right, bottom, left}
    */
    chartPosition: property('chartPosition', {
      defaultValue: function() {
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
      defaultValue: function() {
        return d3.chart('Base').prototype.width.call(this);
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    }),
    height: property('height', {
      defaultValue: function() {
        return d3.chart('Base').prototype.height.call(this);
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    }),

    draw: function(data) {
      helpers.log('draw', data);
      helpers.log.time('Base#draw');

      // Explicitly set width and height of container
      // (if width/height > 0)
      this.base
        .attr('width', this.width() || null)
        .attr('height', this.height() || null);

      // Pre-draw for accurate dimensions for layout
      helpers.log.time('Base#draw.layout');
      this.layout(data);
      helpers.log.timeEnd('Base#draw.layout');

      // Full draw now that everything has been laid out
      d3.chart().prototype.draw.call(this, data);

      helpers.log.timeEnd('Base#draw');
    },

    /**
      Redraw with existing data
    */
    redraw: function() {
      // Using previously saved rawData, redraw chart      
      if (this.rawData()) {
        helpers.log('redraw');
        this.draw(this.rawData());
      }
    },

    /**
      Get chart layer (for laying out with charts)

      @param {Object} options
      - zIndex
    */
    chartLayer: function(options) {
      options = _.defaults({}, options, {
        zIndex: helpers.zIndex.chart
      });

      return this.base.append('g')
        .attr('class', 'chart-layer')
        .attr('data-zIndex', options.zIndex);
    },

    /**
      Get component layer

      @param {Object} options
      - zIndex
    */
    componentLayer: function(options) {
      options = _.defaults({}, options, {
        zIndex: helpers.zIndex.component
      });

      return this.base.append('g')
        .attr('class', 'chart-component-layer')
        .attr('data-zIndex', options.zIndex);
    },

    attachChart: function(id, chart) {
      this._attach(id, chart);
      this.chartsById[id] = chart;
    },

    detachChart: function(id) {
      var chart = this.chartsById[id];
      if (!chart) return;

      this._detach(id, chart);
      delete this.chartsById[id];
    },

    attachComponent: function(id, component) {
      this._attach(id, component);
      this.componentsById[id] = component;

      component.on('change:position', this.redraw);
    },

    detachComponent: function(id) {
      var component = this.componentsById[id];
      if (!component) return;

      component.off('change:position');
      this._detach(id, component);
      delete this.componentsById[id];
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
      var chartPosition = _.extend({}, this.margins());
      _.each(layout, function(parts, key) {
        _.each(parts, function(part) {
          chartPosition[key] += part.offset || 0;
        });
      });
      this.chartPosition(chartPosition);

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
        var chartPosition = this.chartPosition();
        var chartX = x - chartPosition.left;
        var chartY = y - chartPosition.top;
        
        // Set at chart bounds if outside of chart
        if (x > (chartPosition.left + chartPosition.width))
          chartX = chartPosition.left + chartPosition.width;
        else if (x < chartPosition.left)
          chartX = 0;

        if (y > (chartPosition.top + chartPosition.height))
          chartY = chartPosition.top + chartPosition.height;
        else if (y < chartPosition.top)
          chartY = 0;

        return {
          container: {x: x, y: y},
          chart: {x: chartX, y: chartY}
        };
      }.bind(this);
    },

    _attach: function(id, item) {
      item.id = id;
      item.base.attr('data-id', id);
      item.container = this;

      this.attach(id, item);

      if (item && _.isFunction(item.trigger)) {
        item.trigger('attached');
      }
    },

    _detach: function(id, item) {
      item.base.remove();

      delete this._attached[id];

      if (item && _.isFunction(item.trigger)) {
        item.trigger('detached');
      }
    },

    _positionLayers: function(layout) {
      this._positionChartLayers();
      this._positionComponents(layout);
      this._positionByZIndex();      
    },

    _positionChartLayers: function() {
      var position = this.chartPosition();
      
      this.base.selectAll('.chart-layer')
        .attr('transform', helpers.transform.translate(position.left, position.top))
        .attr('width', position.width)
        .attr('height', position.height);
    },

    _positionComponents: function(layout) {
      var margins = this.margins();
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
        return +d3.select(element).attr('data-zIndex') || 0;
      });

      // Move layers to z-index order
      _.each(elements, function(element) {
        element.parentNode.appendChild(element);
      }, this);
    },

    // Extract layout from components
    _extractLayout: function(data) {
      var overallLayout = {top: [], right: [], bottom: [], left: []};
      _.each(this.componentsById, function(component) {
        if (component.skipLayout)
          return;

        var layout = component.getLayout(data);
        var position = layout && layout.position;

        if (!_.contains(['top', 'right', 'bottom', 'left'], position))
          return;

        overallLayout[position].push({
          offset: position == 'top' || position == 'bottom' ? layout.height : layout.width,
          component: component
        });
      });
      
      return overallLayout;
    },

    // TODO Refactor into charts
    _convertPointsToLabels: function(points) {
      var labels = _.map(points, function(series) {
        series = _.clone(series);
        var chart = this.chartsById[series.chartId];
        if (chart && _.isFunction(chart._convertPointToLabel)) {
          series.labels = _.map(series.points, chart._convertPointToLabel, chart);
        }
        else {
          series.labels = [];
        }

        // Remove points from labels
        delete series.points;

        return series;
      }, this);

      return labels;
    },

    // TODO Refactor into charts
    _getLabels: function() {
      var labels = _.reduce(this.chartsById, function(memo, chart, id) {
        if (chart && _.isFunction(chart._getLabels)) {
          var labels = chart._getLabels();
          if (!labels || !_.isArray(labels)) {
            throw new Error('d3.chart.multi: Expected _getLabels to return an Array for chart with id: ' + id);
          }
          else {
            // Add chart id to series key
            _.map(labels, function(series) {
              series.chartId = id;
              series.seriesKey = series.key;
              series.key = series.key ? id + '-' + series.key : id;
            });

            return memo.concat(labels);
          }
        }
        else {
          return memo;
        }
      }, [], this);

      return labels;
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
