const expect = require('expect');
const d3c = require('../../');

const Chart = d3c.Chart;
const Component = d3c.Component;
const isChart = d3c.helpers.isChart;

describe('isChart', () => {
  it('should identify subclasses of Chart', () => {
    expect(isChart(Chart)).toEqual(true);
    expect(isChart(Component)).toEqual(true);
    expect(isChart(Chart.extend())).toEqual(true);
    expect(isChart(Component.extend())).toEqual(true);

    expect(isChart()).toEqual(false);
    expect(isChart(() => {})).toEqual(false);
    expect(isChart({})).toEqual(false);
  });
});
