import expect, {createSpy} from 'expect';
import d3 from 'd3';
import scaleBandSeries from '../../src/helpers/scale-band-series';
import {mockSelection} from '../helpers/get-dimensions.spec';
import {
  properties,
  prepare,
  getWidth,
  getOrdinalDomain
} from '../../src/mixins/xy-values';

describe('xyValues', () => {
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

    it('should set rangeRoundBands for xScale', () => {
      const xScale = {
        copy() {
          return this;
        },
        rangeRoundBands: createSpy()
      };

      const selection = mockSelection({client: {width: 200, height: 100}});
      const props = generateProps({xScale});
      const result = prepare(selection, props);

      expect(xScale.rangeRoundBands).toHaveBeenCalled();
      expect(xScale.rangeRoundBands.calls[0].arguments).toEqual([[0, 200], 0, 0]);
    });

    it('should set range for yScale', () => {
      const yScale = {
        copy() {
          return this;
        },
        range: createSpy()
      };

      const selection = mockSelection({client: {width: 200, height: 100}});
      const props = generateProps({yScale});
      const result = prepare(selection, props);

      expect(yScale.range).toHaveBeenCalled();
      expect(yScale.range.calls[0].arguments).toEqual([[100, 0]]);
    });
  });

  describe('getWidth', () => {
    it('should use rangeBand, if available', () => {
      const xScale = {
        rangeBand: () => 50
      };
      expect(getWidth(xScale)).toEqual(50);
    });
  });

  describe('getOrdinalDomain', () => {
    // TODO
  });
});
