import expect, {createSpy} from 'expect';
import d3 from 'd3';
import scaleBandSeries from '../../src/helpers/scale-band-series';
import {mockSelection} from '../helpers/get-dimensions.spec';
import {
  properties,
  prepare,
  getX,
  getY,
  getMinMaxDomain
} from '../../src/mixins/xy';

describe('xy', () => {
  describe('properties', () => {
    // TODO
  });

  describe('prepare', () => {
    function generateProps(props) {
      const defaultProps = {
        xScale: scaleBandSeries(),
        xScalePadding: 0,
        xScaleOuterPadding: 0,
        yScale: d3.scale.linear()
      };

      return Object.assign({}, defaultProps, props);
    }
  });

  describe('getX', () => {
    it('should get x for given values', () => {
      const xScale = scaleBandSeries()
        .seriesCount(2)
        .domain([1, 2, 3, 4])
        .rangeRoundBands([0, 100], 0, 0);
      const xValue = (d, i) => d.x;
      const bandWidth = 25/2;

      expect(getX(xValue, xScale, {x: 3}, 2, 1)).toEqual(50 + bandWidth + (bandWidth/2));
    });
  });

  describe('getY', () => {
    it('should get y for given values', () => {
      const yScale = scaleBandSeries()
        .seriesCount(2)
        .domain([1, 2, 3, 4])
        .rangeRoundBands([0, 200], 0, 0);
      const yValue = (d, i) => d.y;
      const bandWidth = 50/2;

      expect(getY(yValue, yScale, {y: 3}, 2, 1)).toEqual(100 + bandWidth + (bandWidth/2));
    });
  });

  describe('getMinMaxDomain', () => {
    it('should get series max and min', () => {
      const data = [
        {values: [100, 0, -100]},
        {values: [-50, 0, 50, 100, 150, 200]}
      ];
      const getValue = (d) => d;

      expect(getMinMaxDomain(data, getValue)).toEqual([-100, 200]);
    });
  });
});
