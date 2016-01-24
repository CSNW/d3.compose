import expect from 'expect';
import {
  properties,
  createSeriesDraw,
  isSeriesData,
  getSeriesMax,
  getSeriesMin
} from '../../src/mixins/series';

describe('series', () => {
  var context = {};
  beforeEach(() => {
    Object.assign(context, {
      getValue: (d) => d,
      series: [
        {key: 'a', values: [1, 5, 2, 3, 4]},
        {key: 'b', values: [10, 50, 20, 30, 40]}
      ],
      nonSeries: [1, 5, 2, 3, 4]
    });
  });
  afterEach(() => {
    context = {};
  });

  describe('createSeriesDraw', () => {

  });

  describe('isSeriesData', () => {
    it('should determine series data', () => {
      expect(isSeriesData(context.series)).toEqual(true);
      expect(isSeriesData(context.nonSeries)).toEqual(false);
    });
  });

  describe('getSeriesMax', () => {
    it('should calculate max for series data', () => {
      expect(getSeriesMax(context.series, context.getValue)).toEqual(50);
    });

    it('should calculate max for non-series data', () => {
      expect(getSeriesMax(context.nonSeries, context.getValue)).toEqual(5);
    });
  });

  describe('getSeriesMin', () => {
    it('should calculate min for series data', () => {
      expect(getSeriesMin(context.series, context.getValue)).toEqual(1);
    });

    it('should calculate min for non-series data', () => {
      expect(getSeriesMin(context.nonSeries, context.getValue)).toEqual(1);
    });
  });
});
