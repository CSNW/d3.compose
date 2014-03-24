(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  /**
    Container

    Foundation for chart and component placement
  */
  d3.chart('Base').extend('Container', {
    initialize: function() {
      this.charts = [];
      this.chartsById = {};
      this.components = [];
      this.componentsById = {};

      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      };

      this.base.classed('chart', true);
      this.chartBase(this.base.append('g').classed('chart-base', true));

      this.updateDimensions();
      this.on('change:dimensions', function() {
        this.updateDimensions();
        this.redraw();
      });
    },

    updateDimensions: function() {
      // Explicitly set width and height of container
      this.base
        .attr('width', this.width())
        .attr('height', this.height());

      // Place chart base within container
      var margins = this.updateChartMargins();
      this.chartBase()
        .attr('transform', helpers.translate(margins.left, margins.top))
        .attr('width', this.chartWidth())
        .attr('height', this.chartHeight());
    },

    redraw: function() {
      // Using previously saved rawData, redraw chart      
      if (this.rawData())
        this.draw(this.rawData());
    },

    attachChart: function(id, chart) {
      chart.id = id;
      this.attach(id, chart);
      this.charts.push(chart);
      this.chartsById[id] = chart;
    },

    attachComponent: function(id, component) {
      component.id = id;
      this.attach(id, component);
      this.components.push(component);
      this.componentsById[id] = component;

      component.on('change:dimensions', function() {
        this.trigger('change:dimensions');
      });
    },

    updateChartMargins: function() {
      // Get user-defined chart margins
      var margins = this.chartMargins();

      // Update overall chart margins with component chartOffsets
      _.each(this.components, function(component) {
        var offset = component && component.chartOffset && component.chartOffset();

        if (offset) {
          margins.top += offset.top || 0;
          margins.right += offset.right || 0;
          margins.bottom += offset.bottom || 0;
          margins.left += offset.left || 0;
        }
      }, this);
      
      this._chartMargins(margins);
      return margins;
    },

    rawData: property('rawData'),
    chartBase: property('chartBase'),

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
    // Internal chart margins to separate from user-defined margins
    _chartMargins: property('_chartMargins', {
      defaultValue: function() {
        return _.extend({}, this.chartMargins());
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
    })
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
