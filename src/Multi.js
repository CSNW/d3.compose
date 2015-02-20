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
  d3.chart('Container').extend('Multi', {
    initialize: function() {
      // When "options" changes, a full redraw is required to setup config
      this._full_redraw = false;
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

    charts: property('charts', {
      set: function(charts, previous) {
        charts = charts || {};
        
        // Remove charts that are no longer needed
        var remove_ids = _.difference(_.keys(this.charts_by_id), _.keys(charts));
        _.each(remove_ids, this.detachChart, this);

        // Create or update charts
        _.each(charts, function(options, id) {
          var chart = this.charts_by_id[id];

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

            this.attachChart(id, chart);
          }
          else {
            chart.options(options);
          }
        }, this);
      },
      default_value: {}
    }),

    components: property('components', {
      set: function(components) {
        components = components || {};

        // Remove components that are no longer needed
        var remove_ids = _.difference(_.keys(this.components_by_id), _.keys(components));
        _.each(remove_ids, this.detachComponent, this);

        // Create or update components
        _.each(components, function(options, id) {
          var component = this.components_by_id[id];

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

            this.attachComponent(id, component);
          }
          else {
            component.options(options);
          }
        }, this);
      },
      default_value: {}
    }),
  
    draw: function(data) {
      var config = this._prepareConfig(data);

      this.charts(config.charts);
      this.components(config.components);

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
    }
  });

})(d3, _, d3.chart.helpers);
