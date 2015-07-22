import { createScale } from '../helpers';
import { extend } from '../utils';
import XY from './xy';

/**
  Mixin for charts of centered key,value data (x: index, y: value, key)

  @class XYValues
  @namespace mixins
  @extends XY
*/
var XYValues = extend({}, XY, {
  /**
    Determine width of data-point when displayed adjacent

    @method adjacentWidth
    @return {Number}
  */
  adjacentWidth: function() {
    var series_count = this.seriesCount ? this.seriesCount() : 1;
    return this.layeredWidth() / series_count;
  },

  /**
    Determine layered width (width of group for adjacent)

    @method layeredWidth
    @return {Number}
  */
  layeredWidth: function() {
    var range_band = this.xScale() && this.xScale().rangeBand && this.xScale().rangeBand();
    var width = isFinite(range_band) ? range_band : 0;

    return width;
  },

  /**
    Determine item width based on series display type (adjacent or layered)

    @method itemWidth
    @return {Number}
  */
  itemWidth: function() {
    var scale = this.xScale();
    return scale && scale.width ? scale.width() : this.layeredWidth();
  },

  // Override default x-scale to use ordinal type
  /**
    Override default x-scale to use ordinal type: `{type: 'ordinal', data: this.data(), key: 'y', centered: true}`

    @method getDefaultYScale
    @return {d3.scale}
  */
  getDefaultXScale: function() {
    return createScale({
      type: 'ordinal',
      data: this.data(),
      key: 'x',
      centered: true
    });
  }
});

export default XYValues;
