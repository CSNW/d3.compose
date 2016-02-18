import {assign} from '../utils';

export function prepare(selection, props) {
  var xScale = props.xScale;
  var yScale = props.yScale;

  xScale = xScale.copy()
    .range([props.height, 0]);
  yScale = yScale.copy()
    .range([0, props.width]);

  return assign({}, props, {xScale: xScale, yScale: yScale});
}

var xyInverted = {
  prepare: prepare
}
export default xyInverted;
