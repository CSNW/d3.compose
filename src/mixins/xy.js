import d3 from 'd3';
import {assign, isUndefined} from '../utils';
import {getDimensions, types} from '../helpers';
import {getSeriesMin, getSeriesMax} from './series';

export const defaultKey = (d, i) => !isUndefined(d && d.key) ? d.key : i;
export const defaultXValue = (d, i) => !isUndefined(d && d.x) ? d.x : Array.isArray(d) ? d[0] : i;
export const defaultYValue = (d) => !isUndefined(d && d.y) ? d.y : Array.isArray(d) ? d[1] : d;
export const getDefaultXScale = ({data, xValue}) => {
  return d3.scale.linear()
    .domain(getMinMaxDomain(data, xValue || defaultXValue));
};
export const getDefaultYScale = ({data, yValue}) => {
  return d3.scale.linear()
    .domain(getMinMaxDomain(data, yValue || defaultYValue));
};

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

export const prepare = (selection, props) => {
  // TODO Get dimensions from props
  const dimensions = getDimensions(selection);
  const xScale = props.xScale.copy()
    .range([0, dimensions.width]);
  const yScale = props.yScale.copy()
    .range([dimensions.height, 0]);

  return assign({}, props, {xScale, yScale});
};

export function getX(xValue, xScale, d, i, j) {
  // TODO verify series index
  return xScale(xValue(d, i), j);
}

export function getY(yValue, yScale, d, i, j) {
  return yScale(yValue(d, i), j);
}

export function getMinMaxDomain(data, getValue) {
  var min = getSeriesMin(data, getValue);
  const max = getSeriesMax(data, getValue);

  min = min < 0 ? min : 0;

  return [min, max];
}
