import d3 from 'd3';
import {assign} from '../utils';
import {getDimensions, types} from '../helpers';
import {properties as xyProperties, getX, getY, defaultXValue} from './xy';

const defaultXScale = ({data, xValue}) => {
  // TODO Use seriesOrdinal scale
  return d3.scale.ordinal()
    .domain(getOrdinalDomain(data, xValue || defaultXValue));
}

export const properties = assign({},
  xyProperties,
  {
    xScale: {
      type: types.fn,
      getDefault: defaultXScale
    },
    xScalePadding: {
      type: types.number,
      getDefault: () => 0.1
    },
    xScaleOuterPadding: {
      type: types.number,
      getDefault: () => 0.1
    }
  }
);

export const prepare = (selection, props) => {
  // TODO Get dimensions from props
  const {xScalePadding, xScaleOuterPadding} = props;
  var {xScale, yScale} = props;

  const dimensions = getDimensions(selection);
  xScale = xScale.copy()
    .rangeRoundBands([0, dimensions.width], xScalePadding, xScaleOuterPadding);
  yScale = yScale.copy()
    .range([dimensions.height, 0]);

  return assign({}, props, {xScale, yScale});
};

export {
  getX,
  getY
};

export function getWidth(xScale) {
  // TODO Handle linear scales
  return xScale.rangeBand ? xScale.rangeBand() : 1;
}

export function getOrdinalDomain(data, getValue) {
  // TODO
  return [0, 1, 2];
}

const xyValues = {
  defaultXScale,
  properties,
  prepare,
  getX,
  getY,
  getWidth,
  getOrdinalDomain
}
export default xyValues;
