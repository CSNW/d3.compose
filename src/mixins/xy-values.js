import {assign} from '../utils';
import {
  getUniqueValues,
  isSeriesData,
  scaleBandSeries,
  types
} from '../helpers';
import xy, {defaultXValue} from './xy';

export var unsupportedScale = 'Only d3.scale.ordinal(), d3.scaleBand(), and d3c.scaleBandSeries() are supported for xScale';

export function getDefaultXScale(props) {
  return scaleBandSeries()
    .domain(getUniqueValues(props.data, props.xValue || defaultXValue))
    .series(isSeriesData(props.data) ? props.data.length : 1);
}

export var properties = assign({},
  xy.properties,
  {
    xScale: {
      type: types.fn,
      getDefault: getDefaultXScale
    }
  }
);

export function prepare(selection, props) {
  var xScale = props.xScale.copy();
  var yScale = props.yScale.copy();

  if (!xScale.bandwidth && !xScale.rangeBand) {
    throw new Error(unsupportedScale);
  }

  if (props.inverted) {
    xScale.rangeRoundBands ? xScale.rangeRoundBands([props.height, 0]) : xScale.range([props.height, 0]);
    yScale.range([0, props.width]);
  } else {
    xScale.rangeRoundBands ? xScale.rangeRoundBands([0, props.width]) : xScale.range([0, props.width]);
    yScale.range([props.height, 0]);
  }

  return assign({}, props, {xScale: xScale, yScale: yScale});
}

var xyValues = {
  properties: properties,
  prepare: prepare
}
export default xyValues;
