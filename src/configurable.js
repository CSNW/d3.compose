(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  /**
    Configurable chart

    Configure chart based on given options, including adding charts, axes, legend, and other properties

    @example
    ```javascript
    var chart = d3.select('#chart')
      .append('svg')
      .chart('Configurable', {
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
  d3.chart('Container').extend('Configurable', {
    initialize: function() {
      this.redrawFor('title', 'charts', 'axes', 'legend');
    },

    options: property('options', {
      defaultValue: {},
      set: function(options) {
        this.type(options.type, {silent: true});
        
        this.axes(options.axes, {silent: true});
        this.charts(options.charts, {silent: true});
        this.legend(options.legend, {silent: true});
        this.title(options.title, {silent: true});

        // To avoid changing underlying and then redraw failing due to no "change"
        // store cloned options
        return {
          override: _.clone(options)
        };
      }
    }),

    type: property('type', {
      defaultValue: 'XY'
    }),

    title: property('title', {
      set: function(options) {
        // Get title (if exists)
        var title = this.componentsById.title;
        var changed = false;

        if (!options || _.isEmpty(options)) {
          // Remove title if no options are given
          if (title) {
            console.log('REMOVE TITLE...');
          }

          return {
            override: undefined
          };
        }
        else if (_.isString(options)) {
          // Title may be set directly
          options = {title: options};
        }

        // Load defaults
        options = _.defaults({}, options, d3.chart('Configurable').defaults.title);
        
        if (!title) {
          // Create title
          var Title = helpers.resolveChart(options.type, 'Title', this.type());
          title = new Title(this.componentBase(), options);

          this.attachComponent('title', title);
          changed = true;
        }
        else {
          // Check for changed from options
          if (!_.isEqual(title.options(), options))
            changed = true;

          // Update options
          title.options(options, {silent: true});
        }

        return {
          override: title,

          // While the title may not have changed,
          // updating existing object causes change determination to always be false,
          // so set explicitly
          changed: changed
        };
      }
    }),

    charts: property('charts', {
      set: function(options, charts) {
        charts = charts || {};
        var removeIds = _.difference(_.pluck(charts, 'id'), _.keys(options));
        var changed = removeIds.length > 0;
                
        _.each(removeIds, function(removeId) {
          console.log('REMOVE CHART ' + removeId);

          delete charts[removeId];
        });

        _.each(options, function(chartOptions, chartId) {
          var chart = charts[chartId];
          chartOptions = _.defaults({}, chartOptions, d3.chart('Configurable').defaults.charts);

          if (!chart) {
            // Create chart
            var Chart = helpers.resolveChart(chartOptions.type, 'Chart', this.type());
            chart = new Chart(this.chartBase(), chartOptions);

            // Load matching axis scales (if necessary)
            var scale;
            if (!chartOptions.xScale) {
              scale = this.getMatchingAxisScale(chartOptions.dataKey, 'x');
              if (scale)
                chart.xScale = scale;
            }
            if (!chartOptions.yScale) {
              scale = this.getMatchingAxisScale(chartOptions.dataKey, 'y');
              if (scale)
                chart.yScale = scale;
            }

            this.attachChart(chartId, chart);
            charts[chartId] = chart;
            changed = true;
          }
          else {
            // Check for changes in options
            if (_.isEqual(chart.options(), chartOptions))
              changed = true;

            // Update chart
            chart.options(chartOptions, {silent: true});
          }
        }, this);

        return {
          override: charts,
          changed: changed
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
          console.log('REMOVE AXIS ' + removeId);
          // TODO Be sure to remove axis title's too

          delete axes[removeId];
        });

        _.each(axisIds, function(axisId) {
          var axis = axes[axisId];
          var positionById = {
            x: 'bottom',
            y: 'left',
            secondaryX: 'top',
            secondaryY: 'right'
          };
          var axisOptions = {
            position: positionById[axisId]
          };

          if (options[axisId] === false)
            axisOptions = _.defaults({display: false}, axisOptions, d3.chart('Configurable').defaults.axes);
          else
            axisOptions = _.defaults({}, options[axisId], axisOptions, d3.chart('Configurable').defaults.axes);

          if (axisId != 'x' && axisId != 'y' && !axisOptions.dataKey)
            throw new Error('d3.chart.csnw.configurable: dataKey(s) are required for axes other than x and y');

          if (!axis) {
            // Create axis
            var Axis = helpers.resolveChart(axisOptions.type, 'Axis', this.type());
            axis = new Axis(this.chartBase(), axisOptions);

            this.attachComponent('axis.' + axisId, axis);
            axes[axisId] = axis;
            changed = true;
          }
          else {
            // Check for changed from options
            if (!_.isEqual(axis.options(), axisOptions))
              changed = true;

            axis.options(axisOptions, {silent: true});
          }

          // Create axis title
          if (axisOptions.title) {
            var id = 'axis_title.' + axisId;
            var title = this.componentsById[id];
            var titleOptions = _.isString(axisOptions.title) ? {title: axisOptions.title} : axisOptions.title;
            titleOptions = _.defaults({}, titleOptions, {position: axisOptions.position, 'class': 'chart-title-axis'});

            if (!title) {
              var Title = helpers.resolveChart(titleOptions.type, 'Title', this.type());  
              title = new Title(this.componentBase(), titleOptions);

              this.attachComponent(id, title);
            }
            else {
              title.options(titleOptions, {silent: true});
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
          changed: changed
        };    
      },
      defaultValue: {}
    }),

    legend: property('legend', {
      set: function(options, legend) {
        options = options === false ? {display: false} : (options || {});
        options = _.defaults({}, options, d3.chart('Configurable').defaults.legend);
        var changed = false;

        // Load chart information
        if (options.dataKey) {
          // Load only charts matching dataKey(s)
          var dataKeys = _.isArray(options.dataKey) ? options.dataKey : [options.dataKey];
          options.charts = _.filter(this.charts(), function(chart) {
            return _.contains(dataKeys, chart.options().dataKey);
          });
        }

        // If switching from outside to inset, need to change legend base layer, so remove
        if (legend && legend.options().type != options.type) {
          // TODO Possible alternates for changing base of legend
          console.log('REMOVE LEGEND');
          legend = undefined;
        }

        if (!legend) {
          var Legend = helpers.resolveChart(options.type, 'Legend', this.type());
          var base = options.type == 'Inset' || options.type == 'InsetLegend' ? this.chartBase() : this.componentBase();
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

    getMatchingAxisScale: function(dataKey, type) {
      var match = _.find(this.axes(), function(axis) {
        if ((type == 'x' && !axis.isXAxis()) || (type == 'y' && !axis.isYAxis()))
          return false;

        var axisDataKey = axis.options().dataKey;
        return _.isArray(axisDataKey) ? _.contains(axisDataKey, dataKey) : axisDataKey == dataKey;
      });

      var scaleKey = type == 'x' ? '_xScale' : '_yScale';
      var axis = match || this.axes()[type];

      return property(type + 'Scale', {
        get: function () {
          return axis[scaleKey]();
        }
      });
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
        position: 'right'
      },
      title: {
        position: 'top',
        'class': 'chart-title-main'
      }
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
