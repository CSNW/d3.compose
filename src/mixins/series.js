import d3 from 'd3';
import {
  getParentData,
  style,
  isSeriesData,
  di
} from '../helpers';

/**
  Mixin for handling series data

  @class Series
  @namespace mixins
*/
var Series = {
  /**
    Get key for given series data

    @method seriesKey
    @param {Any} d Series object with `key`
    @return {Any}
  */
  seriesKey: di(function(chart, d) {
    return d.key;
  }),

  /**
    Get values for given series data

    @method seriesValues
    @param {Any} d Series object with `values` array
    @return {Array}
  */
  seriesValues: di(function(chart, d, i) {
    // Store seriesIndex on series
    d.seriesIndex = i;
    return d.values;
  }),

  /**
    Get class for given series data

    @method seriesClass
    @param {Any} d
    @param {Number} i
    @return {String}
  */
  seriesClass: di(function(chart, d, i) {
    return 'chart-series chart-index-' + i + (d['class'] ? ' ' + d['class'] : '');
  }),

  /**
    Get index for given data-point of series

    @method seriesIndex
    @param {Any} d
    @param {Number} i
  */
  seriesIndex: di(function(chart, d, i) {
    var series = chart.seriesData.call(this, d, i);
    return series && series.seriesIndex || 0;
  }),

  /**
    Get parent series data for given data-point

    @method seriesData
    @return {Any}
  */
  seriesData: di(function() {
    return getParentData(this);
  }),

  /**
    (di) Get style given series data or data-point
    (Uses "style" object on `d`, if defined)

    @method itemStyle
    @param {Any} d
    @param {Number} [i]
    @param {Number} [j]
    @return {String}
  */
  itemStyle: di(function(chart, d) {
    return style(d.style) || null;
  }),

  /**
    Get series count for chart

    @method seriesCount
    @return {Number}
  */
  seriesCount: function() {
    var data = this.data();
    return (data && isSeriesData(data)) ? data.length : 1;
  },

  /**
    Extension of layer() that handles data-binding and layering for series data.

    - Updates `dataBind` method to access underlying series values
    - Creates group layer for each series in chart
    - Should be used just like layer()

    @example
    ```js
    d3.chart('Chart').extend('Custom', helpers.mixin(mixins.Series, {
      initialize: function() {
        this.seriesLayer('Circles', this.base, {
          // Create group for each series on this.base
          // and calls the following for each series item
          // (entire layer is called twice: series-1 and series-2)

          dataBind: function(data) {
            // 1. data = [1, 2, 3]
            // 2. data = [4, 5, 6]
          },
          insert: function() {
            // Same as chart.layer
            // (where "this" is series group layer)
          },
          events: {
            // Same as chart.layer
          }
        });
      }
    }));

    // ...

    chart.draw([
      {key: 'series-1', values: [1, 2, 3]},
      {key: 'series-2', values: [4, 5, 6]}
    ]);
    ```
    @method seriesLayer
    @param {String} name
    @param {Selection} selection
    @param {Object} options (`dataBind` and `insert` required)
    @return {d3.chart.layer}
  */
  seriesLayer: function(name, selection, options) {
    if (options && options.dataBind) {
      var dataBind = options.dataBind;

      options.dataBind = function(data) {
        var chart = this.chart();
        var series = this.selectAll('g')
          .data(data, chart.seriesKey);

        series.enter()
          .append('g');

        series
          .attr('class', chart.seriesClass)
          .attr('style', chart.itemStyle);

        series.exit()
          .remove();

        series.chart = function() { return chart; };

        return dataBind.call(series, chart.seriesValues);
      };
    }

    return d3.chart().prototype.layer.call(this, name, selection, options);
  },

  // Ensure data is in series form
  transform: function(data) {
    return !isSeriesData(data) ? [{values: data}] : data;
  }
};

export default Series;
