import d3 from 'd3';
import {
  defaults,
  extend,
  first,
  isNumber,
  isObject,
  objectEach
} from '../utils';

/**
  `d3.compose.helpers` includes general purpose helpers that are used throughout d3.compose.
  Includes convenience functions for create charts/components (`property`, `di`, and `mixin`),
  helpful calculations (`dimensions`, `max`, and `min`) and other common behavior.

  @class helpers
*/

import property from './property';
import dimensions from './dimensions';
import createScale from './create-scale';
import mixin from './mixin';
import stack from './stack';

/**
  Translate by (x, y) distance

  @example
  ```javascript
  translate(10, 15) == 'translate(10, 15)'
  translate({x: 10, y: 15}) == 'translate(10, 15)'
  ```
  @method translate
  @param {Number|Object} [x] value or `{x, y}`
  @param {Number} [y]
  @return {String}
*/
export function translate(x, y) {
  if (isObject(x)) {
    y = x.y;
    x = x.x;
  }

  return 'translate(' + (x || 0) + ', ' + (y || 0) + ')';
}

/**
  Rotate by degrees, with optional center

  @method rotate
  @param {Number} degrees
  @param {Object} [center = {x: 0, y: 0}]
  @return {String}
*/
export function rotate(degrees, center) {
  var rotation = 'rotate(' + (degrees || 0);
  if (center)
    rotation += ' ' + (center.x || 0) + ',' + (center.y || 0);
  rotation += ')';

  return rotation;
}

/**
  Find vertical offset to vertically align text
  (needed due to lack of `alignment-baseline` support in Firefox)

  @example
  ```js
  var label = d3.select('text');

  // Place label vertically so that origin is top-left
  var offset = alignText(label);
  label.attr('transform', translate(0, offset));

  // Center label for line-height of 20px
  var offset = alignText(label, 20);
  label.attr('transform', translate(0, offset));
  ```
  @method alignText
  @param {element} element
  @param {Number} [line_height]
  @return {Number} offset
*/
export function alignText(element, line_height) {
  var offset = 0;
  try {
    var height = element.getBBox().height;

    var element_style = window.getComputedStyle(element);
    var css_font_size = parseFloat(element_style['font-size']);
    var css_line_height = parseFloat(element_style['line-height']);

    // If line-height: normal, use estimate 1.14em
    // (actual line-height depends on browser and font)
    if (isNaN(css_line_height))
      css_line_height = 1.15 * css_font_size;

    var css_adjustment = -(css_line_height - css_font_size) / 2;

    // Add additional line-height, if specified
    var height_adjustment = 0;
    if (line_height && line_height > 0)
      height_adjustment = (line_height - height) / 2;

    offset = height + (css_adjustment || 0) + (height_adjustment || 0);
  }
  catch (ex) {
    // Errors can occur from getBBox and getComputedStyle
    // No useful information for offset, do nothing
  }

  return offset;
}

/**
  Determine if given data is likely series data

  @method isSeriesData
  @param {Array} data
  @return {Boolean}
*/
export function isSeriesData(data) {
  var first_item = first(data);
  return first_item && isObject(first_item) && Array.isArray(first_item.values);
}

/**
  Get max for array/series by value di

  @example
  ```js
  var data = [
    {values: [{y: 1}, {y: 2}, {y: 3}]},
    {values: [{y: 4}, {y: 2}, {y: 0}]}
  ];
  max(data, function(d, i) { return d.y; }); // -> 4
  ```
  @method max
  @param {Array} data
  @param {Function} getValue di function that returns value for given (d, i)
  @return {Number}
*/
export function max(data, getValue) {
  var getMax = function(series_data) {
    return series_data && d3.extent(series_data, getValue)[1];
  };

  if (isSeriesData(data)) {
    return data.reduce(function(memo, series) {
      if (series && Array.isArray(series.values)) {
        var series_max = getMax(series.values);
        return series_max > memo ? series_max : memo;
      }
      else {
        return memo;
      }
    }, -Infinity);
  }
  else {
    return getMax(data);
  }
}

/**
  Get min for array/series by value di

  @example
  ```js
  var data = [
    {values: [{x: 1}, {x: 2}, {x: 3}]},
    {values: [{x: 4}, {x: 2}, {x: 0}]}
  ];
  min(data, function(d, i) { return d.x; }); // -> 0
  ```
  @method min
  @param {Array} data
  @param {Function} getValue di function that returns value for given (d, i)
  @return {Number}
*/
export function min(data, getValue) {
  var getMin = function(series_data) {
    return series_data && d3.extent(series_data, getValue)[0];
  };

  if (isSeriesData(data)) {
    return data.reduce(function(memo, series) {
      if (series && Array.isArray(series.values)) {
        var series_min = getMin(series.values);
        return series_min < memo ? series_min : memo;
      }
      else {
        return memo;
      }
    }, Infinity);
  }
  else {
    return getMin(data);
  }
}

// TODO Look into converting to d3's internal style handling
// Convert key,values to style string
//
// @example
// ```js
// style({color: 'red', display: 'block'}) -> color: red; display: block;
// ```
// @method style
// @param {Object} styles
// @return {String}
export function style(styles) {
  if (!styles)
    return '';

  var keyValues = [];
  objectEach(styles, function(value, key) {
    keyValues.push(key + ': ' + value);
  });
  styles = keyValues.join('; ');

  return styles ? styles + ';' : '';
}

/**
  Get formatted margins for varying input

  @method getMargins
  @example
  ```js
  getMargins(4);
  // -> {top: 4, right: 4, bottom: 4, left: 4}

  getMargins({top: 20}, {top: 8, bottom: 8});
  // -> {top: 20, right: 0, bottom: 8, left: 0}
  ```
  @param {Number|Object} margins
  @param {Object} default_margins
  @return {Object}
*/
export function getMargins(margins, default_margins) {
  if (isNumber(margins))
    return {top: margins, right: margins, bottom: margins, left: margins};
  else
    return defaults({}, margins, default_margins, {top: 0, right: 0, bottom: 0, left: 0});
}

/**
  Create wrapped `(d, i)` function that adds chart instance as first argument.
  Wrapped function uses standard d3 arguments and context.

  Note: in order to pass proper context to di-functions called within di-function
  use `.call(this, d, i)` (where "this" is d3 context)

  @example
  ```javascript
  d3.chart('Base').extend('Custom', {
    initialize: function() {
      this.base.select('point')
        .attr('cx', this.x);
      // -> (d, i) and "this" used from d3, "chart" injected automatically
    },

    x: di(function(chart, d, i) {
      // "this" is standard d3 context: node
      return chart.xScale()(chart.xValue.call(this, d, i));
    })

    // xScale, xValue...
  });
  ```
  @method di
  @param {Function} callback with `(chart, d, i)` arguments
  @return {Function}
*/
export function di(callback) {
  // Create intermediate wrapping in case it's called without binding
  var wrapped = function wrapped(d, i, j) {
    return callback.call(this, undefined, d, i, j);
  };
  wrapped._is_di = true;
  wrapped.original = callback;

  return wrapped;
}

export function bindDi(diFn, chart) {
  return function wrapped(d, i, j) {
    return (diFn.original || diFn).call(this, chart, d, i, j);
  };
}

// Bind all di-functions found in chart
export function bindAllDi(chart) {
  for (var key in chart) {
    if (chart[key] && chart[key]._is_di)
      chart[key] = bindDi(chart[key], chart);
  }
}


/**
  Get parent data for element (used to get parent series for data point)

  @example
  ```js
  var data = [{
    name: 'Input',
    values: [1, 2, 3]
  }];

  d3.selectAll('g')
    .data(data)
    .enter().append('g')
      .selectAll('text')
        .data(function(d) { return d.values; })
        .enter().append('text')
          .text(function(d) {
            var series_data = getParentData(this);
            return series_data.name + ': ' + d;
          });

  // Input: 1, Input: 2, Input: 3
  ```
  @method getParentData
  @param {Element} element
  @return {Any}
*/
export function getParentData(element) {
  // @internal Shortcut if element + parentData needs to be mocked
  if (element._parent_data)
    return element._parent_data;

  var parent = element && element.parentNode;
  if (parent) {
    var data = d3.select(parent).data();
    return data && data[0];
  }
}

export function createHelper(type) {
  return function(id, options) {
    if (!options) {
      options = id;
      id = undefined;
    }

    return extend({id: id, type: type}, options);
  };
}

var helpers = {
  property: property,
  dimensions: dimensions,
  translate: translate,
  rotate: rotate,
  alignText: alignText,
  isSeriesData: isSeriesData,
  max: max,
  min: min,
  createScale: createScale,
  style: style,
  getMargins: getMargins,
  stack: stack,
  di: di,
  bindDi: bindDi,
  bindAllDi: bindAllDi,
  getParentData: getParentData,
  mixin: mixin,
  createHelper: createHelper
};

export {
  helpers as default,
  property,
  dimensions,
  createScale,
  mixin,
  stack
};
