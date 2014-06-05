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
      this.type = this.options().type || 'XY';
      this.setupAxes(this.options().axes);
      this.setupCharts(this.options().charts);

      // TODO Look into placing axes layers below charts

      this.setupLegend(this.options().legend);
      this.setupTitle(this.options().title);
    },

    // options: property('options', {
    //   defaultValue: {},
    //   set: function(values) {
    //     // Set any properties from options
    //     _.each(values, function(value, key) {
    //       // Only update subcomponents if Container has been initialized
    //       if (this.status.containerInitialized && _.contains(['axes', 'charts', 'legend', 'title'], key)) {
    //         if (key == 'axes') {
    //           _.each(value, function(axisOptions, axisKey) {
    //             console.log('set axis options', axisKey, axisOptions);
    //           }, this);
    //         }
    //         else if (key == 'charts') {
    //           _.each(value, function(chartOptions, chartIndex) {
    //             console.log('set chart options', chartIndex, chartOptions);
    //           }, this);
    //         }
    //         else if (key == 'legend') {
    //           var legend = this.componentsById['legend'];
    //           if (legend) {
    //             legend.options(value);
    //           }
    //         }
    //         else if (key == 'title') {
    //           var title = this.componentsById['title'];
    //           if (title) {
    //             if (_.isString(value)) {
    //               title.title(value);
    //             }
    //             else {
    //               title.options(value);
    //             }
    //           }
    //         }
    //       }
    //       else {
    //         // Not for any subcomponent, set option directly
    //         if (this[key] && this[key].isProperty && this[key].setFromOptions)
    //           this[key](value);  
    //       }
    //     }, this);
    //   }
    // }),

    setupAxes: function(options) {
      options = options || {};
      this.axes = {};

      var axisKeys = _.uniq(['x', 'y'].concat(_.keys(options)));
      _.each(axisKeys, function(axisKey) {
        positionByKey = {
          x: 'bottom',
          y: 'left',
          secondaryX: 'top',
          secondaryY: 'right'
        };
        var defaultOptions = {
          display: true,
          position: positionByKey[axisKey]
        };

        var axisOptions;
        if (options[axisKey] === false)
          axisOptions = _.defaults({display: false}, defaultOptions, d3.chart('Configurable').defaultAxisOptions);
        else
          axisOptions = _.defaults({}, options[axisKey], defaultOptions, d3.chart('Configurable').defaultAxisOptions);

        if (axisKey != 'x' && axisKey != 'y' && !axisOptions.dataKey)
          throw new Error('d3.chart.csnw.configurable: dataKey(s) are required for axes other than x and y');

        var Axis = helpers.resolveChart(axisOptions.type, 'Axis', this.type);
        var axis = new Axis(this.chartBase(), axisOptions);
        var id = 'axis_' + axisKey;

        this.attachComponent(id, axis);
        this.axes[axisKey] = axis;

        if (axisOptions.title) {
          var titleOptions = _.isString(axisOptions.title) ? {title: axisOptions.title} : axisOptions.title;
          titleOptions = _.defaults({}, titleOptions, {position: axisOptions.position, 'class': 'chart-title-axis'});
          
          var Title = helpers.resolveChart(titleOptions.type, 'Title', this.type);
          var title = new Title(this.componentBase(), titleOptions);
          id = id + '_title';

          this.attachComponent(id, title);
        }
      }, this);

      // Setup filter keys for x and y axes
      _.each(['x', 'y'], function(axisKey) {
        var axis = this.axes[axisKey];

        // Don't need to filter keys if dataKey already set
        if (axis.options().dataKey)
          return;  

        var filterKeys = [];
        _.each(this.axes, function(filterAxis, filterKey) {
          if ((axisKey == 'x' && !filterAxis.isXAxis()) || (axisKey == 'y' && !filterAxis.isYAxis()))
            return;

          var dataKey = filterAxis.options().dataKey;
          if (dataKey)
            filterKeys = filterKeys.concat(_.isArray(dataKey) ? dataKey : [dataKey]);
        }, this);

        axis.options(_.extend(axis.options(), {filterKeys: filterKeys}));
      }, this);
    },

    setupCharts: function(charts) {
      charts = charts || [];

      _.each(charts, function(chartOptions, i) {
        chartOptions = _.defaults({}, chartOptions, d3.chart('Configurable').defaultChartOptions);

        var Chart = helpers.resolveChart(chartOptions.type, 'Chart', this.type);
        var chart = new Chart(this.chartBase(), chartOptions);
        var id = 'chart_' + i;

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

        this.attachChart(id, chart);
      }, this);
    },

    setupLegend: function(options) {
      options = options === false ? {display: false}: (options || {});
      options = _.defaults({}, options, d3.chart('Configurable').defaultLegendOptions);

      // Load chart information
      if (options.dataKey) {
        // Load only charts matching dataKey(s)
        var dataKeys = _.isArray(options.dataKey) ? options.dataKey : [options.dataKey];
        options.charts = _.filter(this.charts, function(chart) {
          return _.contains(dataKeys, chart.options().dataKey);
        });
      }
      else {
        options.charts = this.charts;  
      }

      var Legend = helpers.resolveChart(options.type, 'Legend', this.type);
      var base = options.type == 'Inset' || options.type == 'InsetLegend' ? this.chartBase() : this.componentBase();
      var legend = new Legend(base, options);

      this.attachComponent('legend', legend);
    },

    setupTitle: function(options) {
      if (!options)
        return;

      // Title may be set directly
      if (_.isString(options))
        options = {title: options};

      options = _.defaults({}, options, d3.chart('Configurable').defaultTitleOptions);

      var Title = helpers.resolveChart(options.type, 'Title', this.type);
      var title = new Title(this.componentBase(), options);

      this.attachComponent('title', title);
    },

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
      var match = _.find(this.axes, function(axis) {
        if ((type == 'x' && !axis.isXAxis()) || (type == 'y' && !axis.isYAxis()))
          return false;

        var axisDataKey = axis.options().dataKey;
        return _.isArray(axisDataKey) ? _.contains(axisDataKey, dataKey) : axisDataKey == dataKey;
      });

      var scaleKey = type == 'x' ? '_xScale' : '_yScale';
      var axis = match || this.axes[type];

      return property(type + 'Scale', {
        get: function () {
          return axis[scaleKey]();
        }
      });
    }
  }, {
    defaultChartOptions: {
      type: 'Line'
    },
    defaultAxisOptions: {
      display: true
    },
    defaultLegendOptions: {
      position: 'right'
    },
    defaultTitleOptions: {
      position: 'top',
      'class': 'chart-title-main'
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
