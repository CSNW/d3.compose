import {assign} from '../utils';
import component from '../component';
import {Text} from './text';

export const AxisTitle = (selection, props) => {
  selection.classed('d3c-axis-title', true);
  Text(selection, props);
};

AxisTitle.properties = assign({},
  Text.properties,
  {
    // TODO default margins
  }
);

const axisTitle = component(AxisTitle);
export default axisTitle;
