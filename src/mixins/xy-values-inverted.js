import {assign} from '../utils';
import {unsupportedScale} from './xy-values';

export function prepare(selection, props) {
  var xScale = props.xScale;
  var yScale = props.yScale;

  xScale = xScale.copy();
  if (xScale.rangeRoundBands) {
    xScale.rangeRoundBands([props.height, 0], props.xScalePadding, props.xScaleOuterPadding);
  } else {
    throw new Error(unsupportedScale);
  }

  yScale = yScale.copy()
    .range([0, props.width]);

  return assign({}, props, {xScale: xScale, yScale: yScale});
}

var xyValuesInverted = {
  prepare: prepare
}
export default xyValuesInverted;
