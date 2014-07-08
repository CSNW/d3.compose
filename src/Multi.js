(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  /**
    Multi chart

    Configure chart based on given options, including adding charts, axes, legend, and other properties

    @example
    ```javascript
    var chart = d3.select('#chart')
      .append('svg')
      .chart('Multi', {
        type: 'Values'
        charts: [
          {type: 'Bars', dataKey: 'participation', itemPadding: 20},
          {type: 'Line', dataKey: 'results', labels: {position: 'top'}}
        ],
        axes: {
          y: {scale: {domain: [0, 20000]}},
          secondaryY: {dataKey: 'results', scale: {domain: [0, 70]}}
        }
      })
      .width(600)
      .height(400)
      .chartMargins({top: 10});
    ```

    @param {Object} options
    - charts: {Array} of chart definitions
      - type: Matches Chart name (Line, LineValues, Bars)
      - dataKey: Key for extracting chart data from data object
      - other chart properties (e.g. xScale/yScale: {type, domain}, itemPadding, labelPosition, etc.)
    - axes: {Array} of axis definitions
      - type: [Axis] Matches Axis name (Axis, AxisValues)
      - dataKey: Key for extracting axis data from data object
      - other axis properties
    - legend: {Object} of legend properties
      - dataKey: Key for extracting legend data from data object
      - position: top, right, bottom, left
      - other legend properties
  */
  d3.chart('Container').extend('Multi', {
    initialize: function() {
      this.redrawFor('title', 'charts', 'axes', 'legend');
    },

    options: property('options', {
      defaultValue: {},
      set: function(options) {
        if (!options) return;
        
        this.type(options.type || 'XY', {silent: true});
        this.invertedXY(options.invertedXY || false, {silent: true});
        
        this.axes(options.axes, {silent: true});
        this.charts(options.charts, {silent: true});
        this.components(options.components, {silent: true});
        this.legend(options.legend, {silent: true});
        this.title(options.title, {silent: true});

        // To avoid changing underlying and then redraw failing due to no "change"
        // store cloned options
        return {
          override: _.clone(options)
        };
      }
    }),

    // General options
    type: property('type', {
      defaultValue: 'XY'
    }),
    invertedXY: property('invertedXY', {
      defaultValue: false
    }),

    title: property('title', {
      set: function(options, title) {
        var changed = false;
        
        if (!options || _.isEmpty(options)) {
          // Remove title if no options are given
          this.detachComponent('title');

          return {
            override: undefined
          };
        }

        // Title may be set directly
        if (_.isString(options))
          options = {text: options};

        // Load defaults
        options = _.defaults({}, options, d3.chart('Multi').defaults.title, {invertedXY: this.invertedXY()});
        
        if (!title) {
          // Create title
          var Title = helpers.resolveChart(options.type, 'Title', this.type());
          title = new Title(this.componentLayer({zIndex: helpers.zIndex.title}), options);

          this.attachComponent('title', title);
          changed = true;
        }
        else if (!_.isEqual(title.options(), options)) {
          // Update existing title options
          title.options(options/*, {silent: true} XY needs to know about update for scales*/);
          changed = true;
        }

        return {
          override: title,

          // Updating existing object causes change determination to always be false,
          // so keep track explicitly
          changed: changed
        };
      }
    }),

    charts: property('charts', {
      set: function(options, charts) {
        options = options || {};
        charts = charts || {};
        var removeIds = _.difference(_.keys(charts), _.keys(options));
        var changed = removeIds.length > 0;
                
        _.each(removeIds, function(removeId) {
          this.detachChart(removeId);
          delete charts[removeId];
        }, this);

        _.each(options, function(chartOptions, chartId) {
          var chart = charts[chartId];
          chartOptions = _.defaults({}, chartOptions, d3.chart('Multi').defaults.charts, {invertedXY: this.invertedXY()});

          if (!chart) {
            // Create chart
            var Chart = helpers.resolveChart(chartOptions.type, 'Chart', this.type());
            chart = new Chart(this.chartLayer(), chartOptions);

            this.attachChart(chartId, chart);
            charts[chartId] = chart;
            changed = true;
          }
          else if (!_.isEqual(chart.options(), chartOptions)) {
            // Update chart
            chart.options(chartOptions/*, {silent: true} XY needs to know about update for scales*/);
            changed = true;
          }
        }, this);

        return {
          override: charts,
          changed: changed,
          after: function() {
            this.bindChartScales();
          }
        };
      },
      defaultValue: {}
    }),

    axes: property('axes', {
      set: function(options, axes) {
        options = options || {};
        axes = axes || {};
        var axisIds = _.uniq(['x', 'y'].concat(_.keys(options)));
        var removeIds = _.difference(_.keys(axes), axisIds);
        var changed = removeIds.length > 0;

        _.each(removeIds, function(removeId) {
          this.detachComponent('axis.' + removeId);
          this.detachComponent('axis_title.' + removeId);
          delete axes[removeId];
        }, this);

        _.each(axisIds, function(axisId) {
          var axis = axes[axisId];
          var positionByInvertedAndId = {
            notInverted: {
              x: 'bottom',
              y: 'left',
              secondaryX: 'top',
              secondaryY: 'right'
            },
            inverted: {
              x: 'left',
              y: 'bottom',
              secondaryX: 'right',
              secondaryY: 'top'
            }
          };
          var axisOptions = {
            position: positionByInvertedAndId[this.invertedXY() ? 'inverted' : 'notInverted'][axisId],
            type: axisId == 'y' || axisId == 'secondaryY' ? 'y' : 'x'
          };

          if (options[axisId] === false)
            axisOptions = _.defaults({display: false}, axisOptions, d3.chart('Multi').defaults.axes, {invertedXY: this.invertedXY()});
          else
            axisOptions = _.defaults({}, options[axisId], axisOptions, d3.chart('Multi').defaults.axes, {invertedXY: this.invertedXY()});

          if (axisId != 'x' && axisId != 'y' && !axisOptions.dataKey)
            throw new Error('d3.chart.Multi: dataKey(s) are required for axes other than x and y');

          if (!axis) {
            // Create axis
            var Axis = helpers.resolveChart(axisOptions.type, 'Axis', this.type());
            axis = new Axis(this.chartLayer({zIndex: helpers.zIndex.axis}), axisOptions);

            this.attachComponent('axis.' + axisId, axis);
            axes[axisId] = axis;
            changed = true;
          }
          else {
            // Check for changed from options
            if (!_.isEqual(axis.options(), axisOptions))
              changed = true;

            axis.options(axisOptions/*, {silent: true} XY needs to know about update for scales*/);
          }

          // Create axis title
          if (axisOptions.title) {
            var id = 'axis_title.' + axisId;
            var title = this.componentsById[id];
            var titleOptions = _.isString(axisOptions.title) ? {text: axisOptions.title} : axisOptions.title;
            titleOptions = _.defaults({}, titleOptions, {position: axisOptions.position, 'class': 'chart-title-axis'});

            if (!title) {
              var Title = helpers.resolveChart(titleOptions.type, 'Title', this.type());  
              title = new Title(this.componentLayer({zIndex: helpers.zIndex.title}), titleOptions);

              this.attachComponent(id, title);
            }
            else {
              title.options(titleOptions/*, {silent: true} XY needs to know about update for scales*/);
            }
          }
        }, this);

        // Setup filter keys for x and y axes
        _.each(['x', 'y'], function(axisId) {
          var axis = axes[axisId];

          // Don't need to filter keys if dataKey already set
          if (axis.options().dataKey)
            return;  

          var filterKeys = [];
          _.each(axes, function(filterAxis, filterKey) {
            if ((axisId == 'x' && !filterAxis.isXAxis()) || (axisId == 'y' && !filterAxis.isYAxis()))
              return;

            var dataKey = filterAxis.options().dataKey;
            if (dataKey)
              filterKeys = filterKeys.concat(_.isArray(dataKey) ? dataKey : [dataKey]);
          }, this);

          if (!_.isEqual(axis.options().filterKeys, filterKeys))
            changed = true;

          // Set filterKeys "internally" to avoid change firing
          axis.options().filterKeys = filterKeys;
        }, this);

        return {
          override: axes,
          changed: changed,
          after: function() {
            this.bindChartScales();
          }
        };    
      },
      defaultValue: {}
    }),

    legend: property('legend', {
      set: function(options, legend) {
        options = options === false ? {display: false} : (options || {});
        options = _.defaults({}, options, d3.chart('Multi').defaults.legend);
        var changed = false;

        // Load chart information
        if (options.dataKey) {
          // Load only charts matching dataKey(s)
          var dataKeys = _.isArray(options.dataKey) ? options.dataKey : [options.dataKey];
          options.charts = _.filter(this.charts(), function(chart) {
            return _.contains(dataKeys, chart.options().dataKey);
          });
        }
        else {
          options.charts = this.charts();
        }

        // If switching from outside to inset, need to change legend base layer, so remove
        if (legend && legend.options().type != options.type) {
          // TODO Possible alternates for changing base of legend
          this.detachComponent('legend');
          legend = undefined;
        }

        if (!legend) {
          var Legend = helpers.resolveChart(options.type, 'Legend', this.type());
          var base = options.type == 'Inset' || options.type == 'InsetLegend' ? this.chartLayer({zIndex: helpers.zIndex.legend}) : this.componentLayer({zIndex: helpers.zIndex.legend});
          legend = new Legend(base, options);

          this.attachComponent('legend', legend);
          changed = true;
        }
        else {
          if (!_.isEqual(legend.options(), options))
            changed = true;

          legend.options(options);
        }

        return {
          override: legend,
          changed: changed
        };
      }
    }),

    components: property('components', {
      set: function(options, components) {
        options = options || {};
        components = components || {};
        var removeIds = _.difference(_.keys(components), _.keys(options));
        var changed = removeIds.length > 0;

        _.each(removeIds, function(removeId) {
          this.detachComponent(removeId);
          delete components[removeId];
        }, this);

        _.each(options, function(componentOptions, componentId) {
          var component = components[componentId];
          componentOptions = _.defaults({}, componentOptions);

          if (!component) {
            // Create component
            var Component = helpers.resolveChart(componentOptions.type, 'Component', this.type());
            var layer = Component.layer && Component.layer == 'chart' ? this.chartLayer() : this.componentLayer();

            component = new Component(layer, componentOptions);

            this.attachComponent(componentId, component);
            components[componentId] = component;
            changed = true;
          }
          else if (!_.isEqual(component.options(), componentOptions)) {
            component.options(componentOptions/*, {silent: true} XY needs to know about update for scales*/);
            charted = true;
          }
        }, this);

        return {
          override: components,
          changed: changed,
          after: function(components) {
            _.each(components, function(component) {
              if (_.isFunction(component.xScale) && _.isFunction(component.yScale)) {
                component.xScale = this.axes().x._xScale.bind(this.axes().x);
                component.yScale = this.axes().y._yScale.bind(this.axes().y);
              }
            }, this);
          }
        };
      }
    }),

    demux: function(name, data) {
      var item = this.chartsById[name] || this.componentsById[name];

      if (item)
        return this.extractData(item, data);
      else
        return data;
    },

    extractData: function(item, data) {
      var dataKey = item.options().dataKey;
      var filterKeys = item.options().filterKeys;

      // Legends need all data (filter by charts)
      if (item && item.isLegend)
        return data;

      // Use dataKey or filterKeys if specified, otherwise use all data
      if (dataKey || filterKeys) {
        var dataKeys = _.isArray(dataKey) ? dataKey : (dataKey ? [dataKey] : []);
        filterKeys = _.isArray(filterKeys) ? filterKeys : (filterKeys ? [filterKeys] : []);

        var filtered = _.reduce(data, function(memo, series, key) {
          var exclude = _.contains(filterKeys, key);
          var include = _.contains(dataKeys, key);
          var includeAll = !dataKeys.length;

          if ((include || includeAll) && !exclude)
            return memo.concat(series);
          else
            return memo;
        }, []);

        return filtered;
      }
      else {
        return data;
      }
    },

    bindChartScales: function() {
      _.each(this.charts(), function(chart) {
        // Get scales for chart
        chart.xScale = this.getScale(chart.options().dataKey, 'x');
        chart.yScale = this.getScale(chart.options().dataKey, 'y');
      }, this);
    },

    getScale: function(dataKey, type) {
      var match = _.find(this.axes(), function(axis) {
        if ((type == 'x' && !axis.isXAxis()) || (type == 'y' && !axis.isYAxis()))
          return false;

        var axisDataKey = axis.options().dataKey;
        return _.isArray(axisDataKey) ? _.contains(axisDataKey, dataKey) : axisDataKey == dataKey;
      });
      var axis = match || this.axes()[type];
      var scaleKey = type == 'x' ? '_xScale' : '_yScale';

      return axis[scaleKey].bind(axis);
    }
  }, {
    defaults: {
      charts: {
        type: 'Line'
      },
      axes: {
        display: true
      },
      legend: {
        display: true,
        position: 'right'
      },
      title: {
        position: 'top',
        'class': 'chart-title-main'
      }
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
