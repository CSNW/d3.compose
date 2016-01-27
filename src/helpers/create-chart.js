import isChart from './is-chart';
import {Chart} from '../chart';

export default function createChart(ChartFn) {
  if (isChart(ChartFn)) {
    return ChartFn;
  }

  return Chart.extend({
    render() {
      ChartFn(this.base, this.props);
    }
  }, {
    properties: ChartFn.properties || {}
  });
}
