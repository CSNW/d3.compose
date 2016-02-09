import {assign} from '../utils';
import {unsupportedScale} from './xy-values';

export function prepare(selection, props) {
  const {xScalePadding, xScaleOuterPadding, width, height} = props;
  var {xScale, yScale} = props;

  xScale = xScale.copy();
  if (xScale.rangeRoundBands) {
    xScale.rangeRoundBands([height, 0], xScalePadding, xScaleOuterPadding);
  } else {
    throw new Error(unsupportedScale);
  }

  yScale = yScale.copy()
    .range([0, width]);

  return assign({}, props, {xScale, yScale});
}

const xyValuesInverted = {
  prepare
}
export default xyValuesInverted;
