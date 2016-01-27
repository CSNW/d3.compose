import expect from 'expect';
import {
  properties,
  createSeriesDraw,
  isSeriesData,
  getSeriesMax,
  getSeriesMin
} from '../../src/mixins/series';

describe('series', () => {
  const getValue = (d) => d;
  const series = [
    {key: 'a', values: [1, 5, 2, 3, 4]},
    {key: 'b', values: [10, 50, 20, 30, 40]}
  ];
  const nonSeries = [1, 5, 2, 3, 4]

  describe('properties', () => {
    // TODO
  });

  describe('createSeriesDraw', () => {
    // TODO
  });

  describe('isSeriesData', () => {
    it('should determine series data', () => {
      expect(isSeriesData(series)).toEqual(true);
      expect(isSeriesData(nonSeries)).toEqual(false);
    });
  });

  describe('getSeriesMax', () => {
    it('should calculate max for series data', () => {
      expect(getSeriesMax(series, getValue)).toEqual(50);
    });

    it('should calculate max for non-series data', () => {
      expect(getSeriesMax(nonSeries, getValue)).toEqual(5);
    });
  });

  describe('getSeriesMin', () => {
    it('should calculate min for series data', () => {
      expect(getSeriesMin(series, getValue)).toEqual(1);
    });

    it('should calculate min for non-series data', () => {
      expect(getSeriesMin(nonSeries, getValue)).toEqual(1);
    });
  });
});
