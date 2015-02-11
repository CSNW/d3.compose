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
      // When "options" changes, a full redraw is required to setup config
      this._full_redraw = false;

      // Internal storage of components and axes
      this._components = {};
      this._axes = {};
    },

    options: property('options', {
      default_value: function(data) { return {}; },
      type: 'Function',
      set: function(options) {
        this._full_redraw = true;

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
          this.detachComponent('title');
          return;
        }

        // Title may be set directly
        if (_.isString(options))
          options = {text: options};

        // Load defaults
        options = _.defaults({}, options, d3.chart('Multi').defaults.title);

        this.attachComponents({title: options});
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
      set: function(axes) {
        // Prepare axis and title options
        var components = {};
        _.each(axes || {}, function(options, id) {
          options = _.defaults({}, options, d3.chart('Multi').defaults.axes);
          components['axis.' + id] = options;

          if (options.title) {
            var title_options = _.isString(options.title) ? {text: options.title} : options.title;
            title_options = _.defaults({}, title_options, {
              type: 'Title',
              position: options.position,
              'class': 'chart-title-axis'
            });

            components['axis_title.' + id] = title_options;
          }
        });
        
        this.attachComponents(components, this._axes);
      },
      default_value: {}
    }),

    legend: property('legend', {
      set: function(options) {
        if (!options || options === false || options.display === false) {
          this.detachComponent('legend');
          return;
        }
        
        options = _.defaults({}, options, d3.chart('Multi').defaults.legend);

        // Load charts
        if (options.charts) {
          options.charts = _.map(options.charts, function(chart_id) {
            return this.charts_by_id[chart_id];
          }, this);
        }

        this.attachComponents({legend: options});
      }
    }),

    components: property('components', {
      set: function(components) {
        this.attachComponents(components, this._components);
      },
      default_value: {}
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
      // Redraw chart with previously saved raw data / config
      if (this.rawData()) {
        if (this._full_redraw) {
          this._full_redraw = false;
          this.draw(this.rawData().original);
        }
        else {
          d3.chart('Container').prototype.draw.call(this, this.rawData());
        }
      }  
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

    attachComponents: function(components, reference) {
      if (reference) {
        var remove_ids = _.difference(_.keys(reference), _.keys(components));
        _.each(remove_ids, function(remove_id) {
          this.detachComponent(remove_id);
          delete reference[remove_id];
        }, this);  
      }

      _.each(components, function(options, id) {
        var component = this.components_by_id[id];

        // If component type has change, detach and recreate
        if (component && component.type != options.type) {
          this.detachComponent(componentId);
          component = undefined;
        }

        if (!component) {
          var Component = d3.chart(options.type);

          var layer_options = {z_index: helpers.valueOrDefault(Component.z_index, helpers.z_index.component)};
          var base = Component.layer_type == 'chart' ? this.chartLayer(layer_options) : this.componentLayer(layer_options);

          component = new Component(base, options);
          component.type = options.type;

          this.attachComponent(id, component);

          if (reference)
            reference[id] = component;
        }
        else {
          component.options(options);
        }
      }, this);
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
