import d3 from 'd3';
import expect, {createSpy} from 'expect';
import mockSelection from '../_helpers/mock-selection';
import getDimensions from '../../src/helpers/get-dimensions';
import scaleBandSeries from '../../src/helpers/scale-band-series';
import {prepare} from '../../src/mixins/xy-values-inverted';

describe('xyValuesInverted', () => {
  describe('prepare', () => {
    function generateProps(selection, props) {
      const dimensions = getDimensions(selection);
      const defaultProps = {
        xScale:  scaleBandSeries(),
        xScalePadding: 0,
        xScaleOuterPadding: 0,
        yScale: d3.scale.linear()
      };

      return Object.assign({}, dimensions, defaultProps, props);
    }

    it('should set range for xScale', () => {
      const xScale = {
        copy() {
          return this;
        },
        rangeRoundBands: createSpy()
      };

      const selection = mockSelection({client: {width: 200, height: 100}});
      const props = generateProps(selection, {xScale});
      prepare(selection, props);

      expect(xScale.rangeRoundBands).toHaveBeenCalled();
      expect(xScale.rangeRoundBands.calls[0].arguments).toEqual([[100, 0], 0, 0]);
    });

    it('should set range for yScale', () => {
      const yScale = {
        copy() {
          return this;
        },
        range: createSpy()
      };

      const selection = mockSelection({client: {width: 200, height: 100}});
      const props = generateProps(selection, {yScale});
      prepare(selection, props);

      expect(yScale.range).toHaveBeenCalled();
      expect(yScale.range.calls[0].arguments).toEqual([[0, 200]]);
    });
  })
});
