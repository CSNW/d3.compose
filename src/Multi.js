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

        return {
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
        };
      })
    ```

    @param {Function|Object} options
  */
  d3.chart('Container').extend('Multi', {
    initialize: function() {
      // Internal storage of axes and components
      this._axes = {};
      this._components = {};
    },

    options: property('options', {
      default_value: function(data) { return {}; },
      type: 'Function',
      set: function(options) {
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
      set: function(options, previous) {
        // Remove title if no options are given
        if (!options || _.isEmpty(options)) {
          return this.detachComponent('title');
        }

        // Title may be set directly
        if (_.isString(options))
          options = {text: options};

        // Load defaults
        options = _.defaults({}, options, d3.chart('Multi').defaults.title);

        var title = this.components_by_id['title'];
        if (!title) {
          var Title = d3.chart(options.type);
          title = new Title(this.componentLayer({z_index: helpers.z_index.title}), options);

          this.attachComponent('title', title);
        }
        else {
          title.options(options);
        }
      }
    }),

    charts: property('charts', {
      set: function(charts, previous) {
        charts = charts || {};
        
        // Find charts to remove
        var remove_ids = _.difference(_.keys(this.charts_by_id), _.keys(charts));
        _.each(remove_ids, function(remove_id) {
          this.detachChart(remove_id);
        }, this);

        // Create or update charts
        _.each(charts, function(chart_options, chart_id) {
          var chart = this.charts_by_id[chart_id];
          chart_options = _.defaults({}, chart_options, d3.chart('Multi').defaults.charts);

          if (!chart) {
            var Chart = d3.chart(chart_options.type);
            chart = new Chart(this.chartLayer(), chart_options);

            this.attachChart(chart_id, chart);
          }
          else {
            chart.options(chart_options);
          }
        }, this);
      },
      default_value: {}
    }),

    axes: property('axes', {
      set: function(axes, previous) {
        axes = axes || {};
        
        // Find axes to remove
        var remove_ids = _.difference(_.keys(this._axes), _.keys(axes));
        _.each(remove_ids, function(remove_id) {
          this.detachComponent('axis.' + remove_id);
          this.detachComponent('axis_title.' + remove_id);
          delete this._axes[remove_id];
        }, this);

        // Create or update axes
        _.each(axes, function(axis_options, axis_id) {
          var axis = this._axes[axis_id];
          axis_options = _.defaults({}, axis_options, d3.chart('Multi').defaults.axes);

          if (!axis) {
            var Axis = d3.chart(axis_options.type);
            axis = new Axis(this.chartLayer({z_index: helpers.z_index.axis}), axis_options);
            
            this.attachComponent('axis.' + axis_id, axis);
            this._axes[axis_id] = axis;
          }
          else {
            axis.options(axis_options);
          }

          var axis_title_id = 'axis_title.' + axis_id;
          var axis_title = this.components_by_id[axis_title_id];
          if (axis_options.title) {
            var title_options = _.isString(axis_options.title) ? {text: axis_options.title} : axis_options.title;
            title_options = _.defaults({}, title_options, {
              type: 'Title',
              position: axis_options.position,
              'class': 'chart-title-axis'
            });

            if (!axis_title) {
              var Title = d3.chart(title_options.type);
              title = new Title(this.componentLayer({z_index: helpers.z_index.title}), title_options);

              this.attachComponent(axis_title_id, title);
            }
            else {
              title.options(title_options);
            }
          }
          else if (axis_title) {
            this.detachComponent(axis_title_id);
          }
        }, this);   
      },
      default_value: {}
    }),

    legend: property('legend', {
      set: function(options, previous) {
        if (!options || options === false || options.display === false) {
          return this.detachComponent('legend');
        }

        if (options === true)
          options = {display: true};
        
        options = _.defaults({}, options, d3.chart('Multi').defaults.legend);

        // Load charts
        if (options.charts) {
          options.charts = _.map(options.charts, function(chartId) {
            return this.charts_by_id[chartId];
          }, this);
        }

        // If switching legend types, remove existing for clean slate
        if (previous && previous.type != options.type) {
          this.detachComponent('legend');
        }

        var legend = this.components_by_id['legend'];
        if (!legend) {
          var Legend = d3.chart(options.type);

          // TODO Make this happen within component
          var layer_options = {z_index: helpers.z_index.legend};
          var base = Legend.layerType == 'chart' ? this.chartLayer(layer_options) : this.componentLayer(layer_options);

          legend = new Legend(base, options);

          this.attachComponent('legend', legend);
        }
        else {
          legend.options(options);
        }
      }
    }),

    components: property('components', {
      set: function(components, previous) {
        components = components || {};

        var remove_ids = _.difference(_.keys(this._components), _.keys(components));
        _.each(remove_ids, function(remove_id) {
          this.detachComponent(remove_id);
          delete this._components[remove_id];
        }, this);

        _.each(components, function(component_options, component_id) {
          var component = this.components_by_id[component_id];
          component_options = _.defaults({}, component_options);

          if (!component) {
            var Component = d3.chart(component_options.type);
            var base = Component.layerType == 'chart' ? this.chartLayer() : this.componentLayer();

            component = new Component(base, component_options);

            this.attachComponent(component_id, component);
            this._components[component_id] = component;
          }
          else {
            component.options(component_options);
          }
        }, this);
      }
    }),
  
    draw: function(data) {
      var config = this._prepareConfig(data);

      this.axes(config.axes);
      this.charts(config.charts);
      this.components(config.components);
      this.legend(config.legend);
      this.title(config.title);

      d3.chart('Container').prototype.draw.call(this, {
        original: data,
        config: config.data
      });
    },

    redraw: function() {
      // Redraw chart with previously saved raw data
      if (this.rawData())
        this.draw(this.rawData().original);
    },

    demux: function(name, data) {
      var item_data;
      var item = this.charts_by_id[name];
      if (item) {
        item_data = data.config.charts[name];
        if (item_data)
          return item_data;
      }
      else {
        item = this.components_by_id[name];
        if (item) {
          item_data = data.config.components[name];
          if (item_data)
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
        title: false,
        options: {}
      });

      // Normalize legend and title config
      if (config.legend === true)
        config.legend = {};

      if (!config.legend.charts && !config.legend.data)
        config.legend.charts = _.keys(config.charts);

      if (_.isString(config.title))
        config.title = {text: config.title};

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

})(d3, _, d3.chart.helpers);
