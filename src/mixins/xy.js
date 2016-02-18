import d3 from 'd3';
import {
  assign,
  isUndefined} from '../utils';
import {types} from '../helpers';
import {
  getSeriesMin,
  getSeriesMax
} from './series';

export var ORIGINAL_Y = '__original_y';

export var defaultKey = function(d, i) { return !isUndefined(d && d.key) ? d.key : i; };
export var defaultXValue = function(d, i) {
  return !isUndefined(d) && !isUndefined(d.x) ? d.x : (Array.isArray(d) ? d[0] : i);
}
export var defaultYValue = function(d) {
  return !isUndefined(d) && !isUndefined(d.y) ? d.y : (Array.isArray(d) ? d[1] : d);
}
export function getDefaultXScale(props) {
  return d3.scale.linear()
    .domain(getMinMaxDomain(props.data, props.xValue || defaultXValue));
}
export function getDefaultYScale(props) {
  return d3.scale.linear()
    .domain(getMinMaxDomain(props.data, props.yValue || defaultYValue));
}

export var properties = {
  key: {
    type: types.fn,
    getDefault: function() { return defaultKey; }
  },
  xValue: {
    type: types.fn,
    getDefault: function() { return defaultXValue; }
  },
  yValue: {
    type: types.fn,
    getDefault: function() { return defaultYValue; }
  },
  xScale: {
    type: types.fn,
    getDefault: getDefaultXScale
  },
  yScale: {
    type: types.fn,
    getDefault: getDefaultYScale
  }
};

export function prepare(selection, props) {
  var xScale = props.xScale;
  var yScale = props.yScale;

  xScale = xScale.copy()
    .range([0, props.width]);
  yScale = yScale.copy()
    .range([props.height, 0]);

  return assign({}, props, {xScale: xScale, yScale: yScale});
}

export function getValue(value, scale, d, i, j) {
  // TODO verify series index for all cases (enter, update, merge, exit)
  return scale(value(d, i, j), j);
}

export function getMinMaxDomain(data, getValue) {
  var min = getSeriesMin(data, getValue);
  var max = getSeriesMax(data, getValue);

  min = min < 0 ? min : 0;

  return [min, max];
}

var xy = {
  defaultKey: defaultKey,
  defaultXValue: defaultXValue,
  defaultYValue: defaultYValue,
  getDefaultXScale: getDefaultXScale,
  getDefaultYScale: getDefaultYScale,
  properties: properties,
  prepare: prepare,
  getValue: getValue,
  getMinMaxDomain: getMinMaxDomain
}
export default xy;
