import expect, {createSpy} from 'expect';
import d3 from 'd3';
import scaleBandSeries from '../../src/helpers/scale-band-series';
import {mockSelection} from '../helpers/get-dimensions.spec';
import {
  properties,
  prepare,
  getValue,
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

  describe('getValue', () => {
    it('should get value for given values and scale', () => {
      const scale = scaleBandSeries()
        .seriesCount(2)
        .domain([1, 2, 3, 4])
        .rangeRoundBands([0, 100], 0, 0);
      const value = (d, i) => d.x;
      const bandWidth = 25/2;

      expect(getValue(value, scale, {x: 3}, 2, 1)).toEqual(50 + bandWidth + (bandWidth/2));
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
