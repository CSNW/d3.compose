import isChart from './is-chart';

export default function createChart(ChartFn, Type) {
  if (isChart(ChartFn)) {
    return ChartFn;
  }

  return Type.extend({
    render: function render() {
      ChartFn(this.base, this.props);
    }
  }, {
    properties: ChartFn.properties || {}
  });
}
