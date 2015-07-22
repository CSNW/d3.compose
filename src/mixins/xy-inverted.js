import { di } from '../helpers';

/**
  Mixin for inverting XY calculations with x vertical, increasing bottom-to-top and y horizontal, increasing left-to-right

  @class XYInverted
  @namespace mixins
*/
var XYInverted = {
  /**
    Get x-value for plotting (scaled y-value)

    @method x
    @param {Any} d
    @param {Number} i
    @return {Number}
  */
  x: di(function(chart, d, i) {
    var value = chart.yValue.call(this, d, i);
    var series_index = chart.seriesIndex && chart.seriesIndex.call(this, d, i) || 0;

    return parseFloat(chart.yScale()(value, series_index));
  }),

  /**
    Get y-value for plotting (scaled x-value)

    @method y
    @param {Any} d
    @param {Number} i
    @return {Number}
  */
  y: di(function(chart, d, i) {
    var value = chart.xValue.call(this, d, i);
    var series_index = chart.seriesIndex && chart.seriesIndex.call(this, d, i) || 0;

    return parseFloat(chart.xScale()(value, series_index));
  }),

  /**
    Get scaled y = 0 value (along x-axis)

    @method x0
    @return {Number}
  */
  x0: function() {
    return parseFloat(this.yScale()(0));
  },

  /**
    Get scaled x = 0 value (along y-axis)

    @method x0
    @return {Number}
  */
  y0: function() {
    return parseFloat(this.xScale()(0));
  },

  /**
    Set range (height, 0) for given x-scale

    @method setXScaleRange
    @param {d3.scale} x_scale
  */
  setXScaleRange: function(x_scale) {
    x_scale.range([this.height(), 0]);
  },

  /**
    Set range (0, width) for given y-scale

    @method setYScaleRange
    @param {d3.scale} y_scale
  */
  setYScaleRange: function(y_scale) {
    y_scale.range([0, this.width()]);
  }
};

export default XYInverted;
