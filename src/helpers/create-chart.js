import isChart from './is-chart';
import {Chart} from '../chart';

export default function createChart(ChartFn, Type = Chart) {
  if (isChart(ChartFn)) {
    return ChartFn;
  }

  return Type.extend({
    render() {
      ChartFn(this.base, this.props);
    }
  }, {
    properties: ChartFn.properties || {}
  });
}
