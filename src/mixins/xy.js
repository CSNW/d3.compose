import {
  extend,
  isUndefined,
  isObject,
  valueOrDefault
} from '../utils';
import {
  property,
  isSeriesData,
  createScale,
  di
} from '../helpers';

/**
  Mixin for handling XY data

  @class XY
  @namespace mixins
*/
var XY = {
  initialize: function() {
    // Set scale ranges once chart is ready to be rendered
    this.on('before:draw', this.setScales.bind(this));
  },

  transform: function(data) {
    data = data || [];

    // Transform series data from values to x,y
    if (isSeriesData(data)) {
      data = data.map(function(series) {
        return extend({}, series, {
          values: series.values.map(normalizeData)
        });
      });
    }
    else if (Array.isArray(data)) {
      data = data.map(normalizeData);
    }

    return data;

    function normalizeData(point, index) {
      if (!isObject(point))
        point = {x: index, y: point};
      else if (!Array.isArray(point) && isUndefined(point.x))
        point.x = index;

      return point;
    }
  },

  /**
    Get/set x-scale with `d3.scale` or with object (uses `helpers.createScale`)

    @property xScale
    @type Object|d3.scale
  */
  xScale: property('xScale', {
    type: 'Function',
    set: function(value) {
      var scale = createScale(value);
      this.setXScaleRange(scale);

      return {
        override: scale
      };
    },
    get: function(scale) {
      if (!scale) {
        scale = this.getDefaultXScale();
        this.setXScaleRange(scale);
      }

      return scale;
    }
  }),

  /**
    Get/set yscale with `d3.scale` or with object (uses `helpers.createScale`)

    @property xScale
    @type Object|d3.scale
  */
  yScale: property('yScale', {
    type: 'Function',
    set: function(value) {
      var scale = createScale(value);
      this.setYScaleRange(scale);

      return {
        override: scale
      };
    },
    get: function(scale) {
      if (!scale) {
        scale = this.getDefaultYScale();
        this.setYScaleRange(scale);
      }

      return scale;
    }
  }),

  /**
    Key on data object for x-value

    @property xKey
    @type String
    @default 'x'
  */
  xKey: property('xKey', {
    default_value: 'x'
  }),

  /**
    Key on data object for y-value

    @property yKey
    @type String
    @default 'y'
  */
  yKey: property('yKey', {
    default_value: 'y'
  }),

  /**
    Get scaled x-value for given data-point

    @method x
    @param {Any} d
    @param {Number} i
    @return {Number}
  */
  x: di(function(chart, d, i) {
    var value = chart.xValue.call(this, d, i);
    var series_index = chart.seriesIndex && chart.seriesIndex.call(this, d, i) || 0;

    return parseFloat(chart.xScale()(value, series_index));
  }),

  /**
    Get scaled y-value for given data-point

    @method y
    @param {Any} d
    @param {Number} i
    @return {Number}
  */
  y: di(function(chart, d, i) {
    var value = chart.yValue.call(this, d, i);
    var series_index = chart.seriesIndex && chart.seriesIndex.call(this, d, i) || 0;

    return parseFloat(chart.yScale()(value, series_index));
  }),

  /**
    Get key for data-point. Looks for "key" on `d` first, otherwise uses x-value.

    @method key
    @param {Any} d
    @param {Number} i
    @return {Any}
  */
  key: di(function(chart, d, i) {
    return valueOrDefault(d.key, chart.xValue.call(this, d, i));
  }),

  /**
    Get scaled `x = 0` value

    @method x0
    @return {Number}
  */
  x0: function() {
    return parseFloat(this.xScale()(0));
  },

  /**
    Get scaled `y = 0` value

    @method x0
    @return {Number}
  */
  y0: function() {
    return parseFloat(this.yScale()(0));
  },

  /**
    Get x-value for data-point. Checks for `xKey()` on `d` first, otherwise uses `d[0]`.

    @example
    ```js
    xValue({x: 10, y: 20}); // -> 10
    xValue([10, 20]); // -> 10
    ```
    @method xValue
    @param {Any} d
    @return {Any}
  */
  xValue: di(function(chart, d) {
    var key = chart.xKey();
    if (d)
      return key in d ? d[key] : d[0];
  }),

  /**
    Get y-value for data-point. Checks for `yKey()` on `d` first, otherwise uses `d[1]`.

    @example
    ```js
    yValue({x: 10, y: 20}); // -> 20
    yValue([10, 20]); // -> 20
    ```
    @method yValue
    @param {Any} d
    @return {Any}
  */
  yValue: di(function(chart, d) {
    var key = chart.yKey();
    if (d)
      return key in d ? d[key] : d[1];
  }),

  /**
    Set x- and y-scale ranges (using `setXScaleRange` and `setYScaleRange`)

    @method setScales
  */
  setScales: function() {
    this.setXScaleRange(this.xScale());
    this.setYScaleRange(this.yScale());
  },

  /**
    Set range (0, width) for given x-scale

    @method setXScaleRange
    @param {d3.scale} x_scale
  */
  setXScaleRange: function(x_scale) {
    x_scale.range([0, this.width()]);
  },

  /**
    Set range(height, 0) for given y-scale

    @method setYScaleRange
    @param {d3.scale} y_scale
  */
  setYScaleRange: function(y_scale) {
    y_scale.range([this.height(), 0]);
  },

  /**
    Get default x-scale: `{data: this.data(), key: 'x'}`

    @method getDefaultXScale
    @return {d3.scale}
  */
  getDefaultXScale: function() {
    return createScale({
      data: this.data(),
      key: 'x'
    });
  },

  /**
    Get default y-scale: `{data: this.data(), key: 'y'}`

    @method getDefaultYScale
    @return {d3.scale}
  */
  getDefaultYScale: function() {
    return createScale({
      data: this.data(),
      key: 'y'
    });
  }
};

export default XY;
