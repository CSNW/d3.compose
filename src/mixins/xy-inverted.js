import {assign} from '../utils';

export function prepare(selection, props) {
  const {width, height} = props;
  var {xScale, yScale} = props;

  xScale = xScale.copy()
    .range([height, 0]);
  yScale = yScale.copy()
    .range([0, width]);

  return assign({}, props, {xScale, yScale});
}

const xyInverted = {
  prepare
}
export default xyInverted;
