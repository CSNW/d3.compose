import expect, {spyOn, restoreSpies} from 'expect';
import Chart from '../src/Chart';
import {mixin} from '../src/helpers';
import {
  Series,
  XY,
  XYValues
} from '../src/mixins';

describe('mixins', () => {
  var context = {};

  const processData = (chart, unprocessed) => {
    return unprocessed.map((series, index) => {
      chart.seriesValues(series, index).forEach((value) => {
        value.series = series;
      });

      return series;
    });
  };

  beforeEach(() => {
    const data = [
      {key: 'A', values: [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 2}, {x: 3, y: 3}, {x: 4, y: 4}]},
      {key: 'B', values: [{x: 5, y: 5}, {x: 6, y: 6}, {x: 7, y: 7}, {x: 8, y: 8}]},
      {key: 'C', values: [{x: 9, y: 9}, {x: 10, y: 10}, {x: 11, y: 11}, {x: 12, y: 12}]}
    ];
    const values = [
      {key: 'A', values: [{x: 'A', y: 0}, {x: 'B', y: 1}, {x: 'C', y: 2}, {x: 'D', y: 3}, {x: 'E', y: 4}]},
      {key: 'B', values: [{x: 'A', y: 5}, {x: 'B', y: 6}, {x: 'C', y: 7}, {x: 'D', y: 8}, {x: 'E', y: 9}]}
    ];
    const width = 600;
    const height = 400;

    const Mixed = mixin(Chart, Series);
    const TestChart = Mixed.extend({
      initialize(options) {
        Mixed.prototype.initialize.call(this, options);

        this._layers = {
          mock: {
            draw(chart_data) {
              context.transformed = chart_data;
            }
          }
        };
      },
      data() {
        return context.data || [];
      },
      height() {
        return context.height;
      },
      width() {
        return context.width;
      }
    });

    Object.assign(context, {
      data,
      values,
      width,
      height,
      TestChart
    });
  });

  afterEach(() => {
    context = {};
    restoreSpies();
  });

  describe('Series', () => {
    beforeEach(() => {
      const chart = new context.TestChart();
      const processed = processData(chart, context.data);
      const element = (series_index, data_index) => {
        return {
          data() {
            return [processed[series_index][data_index]];
          },
          parentNode: {
            data() {
              return [processed[series_index]];
            }
          }
        };
      };

      spyOn(d3, 'select').andCall(selection => selection);

      Object.assign(context, {
        chart,
        processed,
        element
      });
    });

    it('should get series for element', () => {
      const chart = context.chart;
      const element = context.element;
      const processed = context.processed;
      const data = context.data;

      expect(chart.seriesData.call(element(1, 2), processed[1].values[2])).toEqual(data[1]);
      expect(chart.seriesData.call(element(2, 1), processed[2].values[1])).toEqual(data[2]);
    });

    it('should get series index for given series after passing through seriesValues', () => {
      const chart = context.chart;
      const element = context.element;
      const processed = context.processed;

      expect(chart.seriesIndex.call(element(1, 2), processed[1].values[2])).toEqual(1);
      expect(chart.seriesIndex.call(element(2, 1), processed[2].values[1])).toEqual(2);
    });

    it('should get item style and series style', () => {
      const element = context.element(1, 2);
      const series = context.processed[1];
      const d = context.processed[1].values[2];

      series.style = {fill: 'yellow', 'stroke-width': '1.5px'};
      expect(context.chart.itemStyle.call(element, series, 1)).toEqual('fill: yellow; stroke-width: 1.5px;');

      d.style = {fill: 'purple', 'font-size': '16px'};
      expect(context.chart.itemStyle.call(element, d, 2)).toEqual('fill: purple; font-size: 16px;');
    });

    it('should ensure data is in series form', () => {
      context.chart.draw([1, 2, 3]);
      expect(context.transformed).toEqual([{values: [1, 2, 3]}]);
    });
  });

  describe('XY', () => {
    beforeEach(() => {
      context.TestChart = mixin(context.TestChart, XY);
      context.chart = new context.TestChart();
    });

    it('should set x,y-scale range by width/height', function() {
      expect(context.chart.xScale().range()).toEqual([0, 600]);
      expect(context.chart.yScale().range()).toEqual([400, 0]);
    });

    it('should only set x,y-scale domains if scales are not defined', function() {
      expect(context.chart.xScale().domain()).toEqual([0, 12]);
      expect(context.chart.yScale().domain()).toEqual([0, 12]);

      context.chart.xScale(d3.scale.linear().domain([0, 100]));
      context.chart.yScale(d3.scale.linear().domain([0, 100]));
      context.chart.setScales();

      expect(context.chart.xScale().domain()).toEqual([0, 100]);
      expect(context.chart.yScale().domain()).toEqual([0, 100]);
    });

    it('should return scaled x-value', function() {
      expect(context.chart.x(context.data[0].values[0])).toEqual(0);
      expect(context.chart.x(context.data[2].values[3])).toEqual(600);
    });

    it('should return scaled y-value', function() {
      expect(context.chart.y(context.data[0].values[0])).toEqual(400);
      expect(context.chart.y(context.data[2].values[3])).toEqual(0);
    });

    it('should handle varying data formats', function() {
      [
        [0, 10, 20],
        [{y: 0}, {y: 10}, {y: 20}],
        [[0, 0], [1, 10], [2, 20]],
        [{x: 0, y: 0}, {x: 1, y: 10}, {x: 2, y: 20}]
      ].forEach(function(test_case) {
        test_case = XY.transform(test_case);

        expect(context.chart.xValue(test_case[1])).toEqual(1);
        expect(context.chart.yValue(test_case[1])).toEqual(10);
      });
    });

    it('should use xKey and yKey', function() {
      context.chart.xKey('_x').yKey('_y');
      expect(context.chart.xValue({_x: 1, _y: 10})).toEqual(1);
      expect(context.chart.yValue({_x: 1, _y: 10})).toEqual(10);
    });
  });

  describe('XYValues', () => {
    beforeEach(() => {
      context.TestChart = mixin(context.TestChart, XY, XYValues);
      context.chart = new context.TestChart();

      context.data = context.values;
      context.width = 100;
      context.chart.setScales();

      context.processed = processData(context.chart, context.data);
      spyOn(context.chart, 'seriesIndex').andCall(d => d.series.seriesIndex);
    });

    it('should set x-scale to ordinal with x-values', function() {
      expect(context.chart.xScale().domain()).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('should calculate adjacent width', function() {
      expect(context.chart.adjacentWidth()).toEqual(9);
    });

    it('should calculate layered width', function() {
      expect(context.chart.layeredWidth()).toEqual(18);
    });

    it('should calculate item width (from scale)', function() {
      expect(context.chart.itemWidth()).toEqual(18);

      context.chart.xScale({type: 'ordinal', domain: ['A', 'B', 'C', 'D', 'E'], series: 2, adjacent: true});
      expect(context.chart.itemWidth()).toEqual(9);
    });
  });
});
