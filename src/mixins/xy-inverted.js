import {assign} from '../utils';

export const prepare = (selection, props) => {
  // TODO Get dimensions from props
  const dimensions = getDimensions(selection);
  const xScale = props.xScale.copy()
    .range([dimensions.height, 0]);
  const yScale = props.yScale.copy()
    .range([0, dimensions.width]);

  return assign({}, props, {xScale, yScale});
};

const xyInverted = {
  prepare
}
export default xyInverted;
