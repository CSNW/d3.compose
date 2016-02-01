import {assign} from '../utils';
import {getDimensions} from '../helpers';
import {unsupportedScale} from './xy-values';

export const prepare = (selection, props) => {
  const {xScalePadding, xScaleOuterPadding} = props;
  var {xScale, yScale} = props;

  const dimensions = getDimensions(selection);

  xScale = xScale.copy();
  if (xScale.rangeRoundBands) {
    xScale.rangeRoundBands([dimensions.height, 0], xScalePadding, xScaleOuterPadding);
  } else {
    throw new Error(unsupportedScale);
  }

  yScale = yScale.copy()
    .range([0, dimensions.width]);

  return assign({}, props, {xScale, yScale});
};

const xyValuesInverted = {
  prepare
}
export default xyValuesInverted;
