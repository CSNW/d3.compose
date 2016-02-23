import d3 from 'd3';
import {
  assign,
  isUndefined} from '../utils';
import {
  types,
  seriesExtent
} from '../helpers';

// TODO Handle stacking differently so that this isn't needed
export var ORIGINAL_Y = '__original_y';

export function defaultKey(d, i) {
  return !isUndefined(d && d.key) ? d.key : i;
}
export function defaultXValue(d, i) {
  return !isUndefined(d) && !isUndefined(d.x) ? d.x : (Array.isArray(d) ? d[0] : i);
}
export function defaultYValue(d) {
  return !isUndefined(d) && !isUndefined(d.y) ? d.y : (Array.isArray(d) ? d[1] : d);
}
export function getDefaultXScale(props) {
  var domain = seriesExtent(props.data, props.xValue || defaultXValue);
  return d3.scale.linear().domain(domain);
}
export function getDefaultYScale(props) {
  var domain = seriesExtent(props.data, props.yValue || defaultYValue);
  return d3.scale.linear().domain(domain);
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
  },
  inverted: {
    type: types.boolean,
    getDefault: function() { return false; }
  }
};

export function prepare(selection, props) {
  var xScale = props.xScale.copy();
  var yScale = props.yScale.copy();

  if (props.inverted) {
    xScale.range([props.height, 0]);
    yScale.range([0, props.width]);
  } else {
    xScale.range([0, props.width]);
    yScale.range([props.height, 0]);
  }

  return assign({}, props, {xScale: xScale, yScale: yScale});
}

var xy = {
  properties: properties,
  prepare: prepare
}
export default xy;
