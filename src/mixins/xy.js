import d3 from 'd3';
import {
  assign,
  isUndefined} from '../utils';
import {types} from '../helpers';
import {
  getSeriesMin,
  getSeriesMax
} from './series';

export const ORIGINAL_Y = '__original_y';

export const defaultKey = (d, i) => !isUndefined(d && d.key) ? d.key : i;
export const defaultXValue = (d, i) => {
  return !isUndefined(d) && !isUndefined(d.x) ? d.x : (Array.isArray(d) ? d[0] : i);
}
export const defaultYValue = (d) => {
  return !isUndefined(d) && !isUndefined(d.y) ? d.y : (Array.isArray(d) ? d[1] : d);
}
export function getDefaultXScale({data, xValue}) {
  return d3.scale.linear()
    .domain(getMinMaxDomain(data, xValue || defaultXValue));
}
export function getDefaultYScale({data, yValue}) {
  return d3.scale.linear()
    .domain(getMinMaxDomain(data, yValue || defaultYValue));
}

export const properties = {
  key: {
    type: types.fn,
    getDefault: () => defaultKey
  },
  xValue: {
    type: types.fn,
    getDefault: () => defaultXValue
  },
  yValue: {
    type: types.fn,
    getDefault: () => defaultYValue
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
  const {width, height} = props;
  var {xScale, yScale} = props;

  xScale = xScale.copy()
    .range([0, width]);
  yScale = yScale.copy()
    .range([height, 0]);

  return assign({}, props, {xScale, yScale});
}

export function getValue(value, scale, d, i, j) {
  // TODO verify series index for all cases (enter, update, merge, exit)
  return scale(value(d, i, j), j);
}

export function getMinMaxDomain(data, getValue) {
  var min = getSeriesMin(data, getValue);
  const max = getSeriesMax(data, getValue);

  min = min < 0 ? min : 0;

  return [min, max];
}

const xy = {
  defaultKey,
  defaultXValue,
  defaultYValue,
  getDefaultXScale,
  getDefaultYScale,
  properties,
  prepare,
  getValue,
  getMinMaxDomain
}
export default xy;
