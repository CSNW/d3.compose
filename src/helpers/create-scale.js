import d3 from 'd3';
import {
  isFunction,
  extend,
  objectEach,
  uniq,
  contains,
  flatten
} from '../utils';
import {
  min,
  max,
  isSeriesData
} from './index';

/**
  Create scale from options

  @example
  ```javascript
  // Simple type, range, and domain
  var scale = createScale({
    type: 'linear',
    domain: [0, 100],
    range: [0, 500]
  });

  // Scale is passed through
  var original = d3.scale.linear();
  var scale = createScale(original);
  scale === original;

  // Set other properties by passing in "arguments" array
  var scale = createScale({
    type: 'ordinal',
    domain: ['a', 'b', 'c', 'd', 'e'],
    rangeRoundBands: [[0, 100], 0.1, 0.05]
  });
  ```
  @method createScale
  @for helpers
  @param {Object|Function} options (passing in `Function` returns original function with no changes)
  @param {String} [options.type='linear'] Any available `d3.scale` (`"linear"`, `"ordinal"`, `"log"`, etc.) or `"time"`
  @param {Array} [options.domain] Domain for scale
  @param {Array} [options.range] Range for scale
  @param {Any} [options.data] Used to dynamically set domain (with given value or key)
  @param {Function} [options.value] "di"-function for getting value for data
  @param {String} [options.key] Data key to extract value
  @param {Boolean} [options.centered] For "ordinal" scales, use centered x-values
  @param {Boolean} [options.adjacent] For "ordinal" + centered, set x-values for different series next to each other

  - Requires series-index as second argument to scale, otherwise centered x-value is used
  - Requires "data" or "series" options to determine number of series
  @param {Number} [options.series] Used with "adjacent" if no "data" is given to set series count
  @param {Number} [options.padding=0.1] For "ordinal" scales, set padding between different x-values
  @param {Array...} [options....] Set any other scale properties with array of arguments to pass to property
  @return {d3.Scale}
*/
export default function createScale(options) {
  options = options || {};

  // If function, scale was passed in as options
  if (isFunction(options))
    return options;

  // Create scale (using d3.time.scale() if type is 'time')
  var scale;
  if (options.type == 'time')
    scale = d3.time.scale();
  else if (d3.scale[options.type])
    scale = d3.scale[options.type]();
  else
    scale = d3.scale.linear();

  objectEach(options, function(value, key) {
    if (scale[key]) {
      // If option is standard property (domain or range), pass in directly
      // otherwise, pass in as arguments
      // (don't pass through internal options)
      if (key == 'range' || key == 'domain')
        scale[key](value);
      else if (!contains(['type', 'data', 'value', 'key', 'centered', 'adjacent', 'series', 'padding'], key))
        scale[key].apply(scale, value);
    }
  });

  if (!options.domain && options.data && (options.key || options.value))
    scale = setDomain(scale, options);

  // Add centered and adjacent extensions to ordinal
  // (centered by default for ordinal)
  var centered = options.centered || (options.type == 'ordinal' && options.centered == null);
  if (options.type == 'ordinal' && (centered || options.adjacent))
    scale = addCentered(scale, options);

  // Add padding extension to ordinal
  if (options.type == 'ordinal' && (options.padding != null || centered || options.adjacent))
    scale = addPadding(scale, options);

  return scale;
}

function setDomain(scale, options) {
  // Use value "di" or create for key
  var getValue = options.value || function(d) {
    return d[options.key];
  };

  // Enforce series data
  var data = options.data;
  if (!isSeriesData(data))
    data = [{values: data}];

  var domain;
  if (options.type == 'ordinal') {
    // Domain for ordinal is array of unique values
    domain = uniq(flatten(data.map(function(series) {
      if (series && series.values)
        return series.values.map(getValue);
    })));
  }
  else {
    var min_value = min(data, getValue);

    domain = [
      min_value < 0 ? min_value : 0,
      max(data, getValue)
    ];
  }

  scale.domain(domain);
  return scale;
}

function addCentered(original, options) {
  // Get series count for adjacent
  var series_count = options.series || (!isSeriesData(options.data) ? 1 : options.data.length);

  // TODO Look into removing closure
  var scale = (function(original, options, series_count) {//eslint-disable-line no-shadow
    var context = function(value, series_index) {
      var width = context.width();

      if (!options.adjacent)
        series_index = 0;

      return original(value) + (0.5 * width) + (width * (series_index || 0));
    };
    extend(context, original, {
      width: function() {
        var range_band = context.rangeBand && context.rangeBand();
        var width = isFinite(range_band) ? range_band : 0;

        if (options.adjacent)
          width = width / series_count;

        return width;
      }
    });

    // TODO test copy() behavior

    return context;
  })(original, options, series_count);

  return scale;
}

function addPadding(scale, options) {
  var padding = options.padding != null ? options.padding : 0.1;

  var original_range = scale.range;
  scale.range = function(range) {
    if (!arguments.length) return original_range();

    scale.rangeBands(
      range,
      padding,
      padding / 2
    );
  };

  if (options.range)
    scale.range(options.range);

  // TODO test copy() behavior
  return scale;
}
