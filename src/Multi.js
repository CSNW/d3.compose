(function(d3, _, helpers, extensions) {
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
          x: ...,
          y: ...,
          secondaryY: ...
        };

        return {
          charts: {
            participation: {type: 'Bars', data: participation, xScale: scales.x, yScale: scales.y, itemPadding: 20},
            results: {type: 'Line', data: results, xScale: scales.x, yScale: scales.secondaryY, labels: {position: 'top'}}
          }
          axes: {
            x: {scale: scales.x}
            y: {scale: scales.y},
            secondaryY: {scale: scales.secondaryY}
          },
          legend: true,
          title: 'd3.chart.multi'
        };
      })
      .width(600)
      .height(400)
      .chartMargins({top: 10});
    ```

    @param {Object} options
  */
  d3.chart('Container').extend('Multi', {
    initialize: function() {
      this.redrawFor('title', 'charts', 'axes', 'legend', 'components');
      
      this._full_draw = false;
      this._axes = {};
      this._components = {};
    },

    options: property('options', {
      defaultValue: function(data) { return {}; },
      type: 'Function',
      set: function(options) {
        this._full_draw = true;

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

    title: property('title', {
      set: function(options, previous, setOptions) {
        // Remove title if no options are given
        if (!options || _.isEmpty(options)) {
          return this.detachComponent('title');
        }

        // Title may be set directly
        if (_.isString(options))
          options = {text: options};

        // Load defaults
        options = _.defaults({}, options, d3.chart('Multi').defaults.title);

        var title = this.componentsById['title'];
        if (!title) {
          var Title = d3.chart(options.type);
          title = new Title(this.componentLayer({zIndex: helpers.zIndex.title}), options);

          this.attachComponent('title', title);
        }
        else {
          title.options(options, {silent: setOptions && setOptions.silent});
        }
      }
    }),

    charts: property('charts', {
      set: function(charts, previous, setOptions) {
        charts = charts || {};
        
        // Find charts to remove
        var removeIds = _.difference(_.keys(this.chartsById), _.keys(charts));
        _.each(removeIds, function(removeId) {
          this.detachChart(removeId);
        }, this);

        // Create or update charts
        _.each(charts, function(chartOptions, chartId) {
          var chart = this.chartsById[chartId];
          chartOptions = _.defaults({}, chartOptions, d3.chart('Multi').defaults.charts);

          if (!chart) {
            var Chart = d3.chart(chartOptions.type);
            chart = new Chart(this.chartLayer(), chartOptions);

            this.attachChart(chartId, chart);
          }
          else {
            chart.options(chartOptions, {silent: setOptions && setOptions.silent});
          }
        }, this);
      },
      defaultValue: {}
    }),

    axes: property('axes', {
      set: function(axes, previous, setOptions) {
        axes = axes || {};
        
        // Find axes to remove
        var removeIds = _.difference(_.keys(this._axes), _.keys(axes));
        _.each(removeIds, function(removeId) {
          this.detachComponent('axis.' + removeId);
          this.detachComponent('axis_title.' + removeId);
          delete this._axes[removeId];
        }, this);

        // Create or update axes
        _.each(axes, function(axisOptions, axisId) {
          var axis = this._axes[axisId];
          axisOptions = _.defaults({}, axisOptions, d3.chart('Multi').defaults.axes);

          if (!axis) {
            var Axis = d3.chart(axisOptions.type);
            axis = new Axis(this.chartLayer({zIndex: helpers.zIndex.axis}), axisOptions);
            
            this.attachComponent('axis.' + axisId, axis);
            this._axes[axisId] = axis;
          }
          else {
            axis.options(axisOptions, {silent: setOptions && setOptions.silent});
          }

          var axisTitleId = 'axis_title.' + axisId;
          var axisTitle = this.componentsById[axisTitleId];
          if (axisOptions.title) {
            var titleOptions = _.isString(axisOptions.title) ? {text: axisOptions.title} : axisOptions.title;
            titleOptions = _.defaults({}, titleOptions, {
              type: 'Title',
              position: axisOptions.position,
              'class': 'chart-title-axis'
            });

            if (!axisTitle) {
              var Title = d3.chart(titleOptions.type)
              title = new Title(this.componentLayer({zIndex: helpers.zIndex.title}), titleOptions);

              this.attachComponent(axisTitleId, title);
            }
            else {
              title.options(titleOptions, {silent: setOptions && setOptions.silent});
            }
          }
          else if (axisTitle) {
            this.detachComponent(axisTitleId);
          }
        }, this);   
      },
      defaultValue: {}
    }),

    legend: property('legend', {
      set: function(options, previous, setOptions) {
        if (!options || options === false || options.display === false) {
          return this.detachComponent('legend');
        }

        if (options === true) {
          options = {display: true};
        }
        options = _.defaults({}, options, d3.chart('Multi').defaults.legend);

        // Load charts
        if (options.charts) {
          options.charts = _.map(options.charts, function(chartId) {
            return this.chartsById[chartId];
          }, this);
        }

        // If switching legend types, remove existing for clean slate
        if (previous && previous.type != options.type) {
          this.detachComponent('legend');
        }

        var legend = this.componentsById['legend'];
        if (!legend) {
          var Legend = d3.chart(options.type);

          // TODO Make this happen within component
          var layerOptions = {zIndex: helpers.zIndex.legend};
          var base = Legend.layerType == 'chart' ? this.chartLayer(layerOptions) : this.componentLayer(layerOptions);

          legend = new Legend(base, options);

          this.attachComponent('legend', legend);
        }
        else {
          legend.options(options, {silent: setOptions && setOptions.silent});
        }
      }
    }),

    components: property('components', {
      set: function(components, previous, setOptions) {
        components = components || {};

        var removeIds = _.difference(_.keys(this._components), _.keys(components));
        _.each(removeIds, function(removeId) {
          this.detachComponent(removeId);
          delete this._components[removeId];
        }, this);

        _.each(components, function(componentOptions, componentId) {
          var component = this.componentsById[componentId];
          componentOptions = _.defaults({}, componentOptions);

          if (!component) {
            var Component = d3.chart(componentOptions.type);
            var base = Component.layerType == 'chart' ? this.chartLayer() : this.componentLayer();

            component = new Component(layer, componentOptions);

            this.attachComponent(componentId, component);
            this._components[componentId] = component;
          }
          else {
            component.options(componentOptions, {silent: setOptions && setOptions.silent});
          }
        }, this);
      }
    }),
  
    draw: function(data) {
      var config = this._prepareConfig(data);

      this.axes(config.axes, {silent: true});
      this.charts(config.charts, {silent: true});
      this.components(config.components, {silent: true});
      this.legend(config.legend, {silent: true});
      this.title(config.title, {silent: true});  

      d3.chart('Container').prototype.draw.call(this, {
        original: data,
        config: config.data
      });

      this._full_draw = false;
    },

    redraw: function() {
      // Redraw chart with previously saved raw data / config
      if (this.rawData()) {
        if (this._full_draw) {
          this.draw(this.rawData().original);
        }
        else {
          d3.chart('Container').prototype.draw.call(this, this.rawData());
        }
      }
    },

    demux: function(name, data) {
      var item, item_data;
      if (item = this.chartsById[name]) {
        if (item_data = data.config.charts[name]) {
          return item_data;
        }
      }
      else if (item = this.componentsById[name]) {
        if (item_data = data.config.components[name]) {
          return item_data;
        }
      }

      // If no item data is found, use original data
      return data.original;
    },

    _prepareConfig: function(data) {
      var config = _.defaults({}, this.options()(data), {
        charts: {},
        axes: {},
        components: {},
        legend: false,
        title: false
      });

      // Normalize legend and title config
      if (config.legend === true) {
        config.legend = {};
      }
      if (!config.legend.charts && !config.legend.data) {
        config.legend.charts = _.keys(config.charts);
      }
      if (_.isString(config.title)) {
        config.title = {text: config.title};
      }

      // Extract and remove data from config
      var config_data = {
        charts: {},
        components: {}
      };
      _.each(config.charts, function(chart_options, chart_id) {
        config_data.charts[chart_id] = chart_options.data;
        delete chart_options.data;
      });
      _.each(config.axes, function(axis_options, axis_id) {
        config_data.components['axis.' + axis_id] = axis_options.data;
        delete axis_options.data;
      });
      _.each(config.components, function(component_options, component_id) {
        config_data.components[component_id] = component_options.data;
        delete component_options.data;
      });
      if (_.isObject(config.legend)) {
        config_data.components.legend = config.legend.data;
        delete config.legend.data;
      }

      // Attach data to config
      config.data = config_data;
      return config;
    }
  }, {
    defaults: {
      charts: {},
      axes: {
        type: 'Axis'
      },
      legend: {
        type: 'Legend',
        position: 'right'
      },
      title: {
        type: 'Title',
        position: 'top',
        'class': 'chart-title-main'
      }
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
