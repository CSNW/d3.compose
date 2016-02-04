import expect, {createSpy} from 'expect';
import d3 from 'd3';
import mockSelection from '../_helpers/mock-selection';
import getDimensions from '../../src/helpers/get-dimensions';
import {prepare} from '../../src/mixins/xy-inverted';

describe('xyInverted', () => {
  describe('prepare', () => {
    function generateProps(selection, props) {
      const dimensions = getDimensions(selection);
      const defaultProps = {
        xScale: d3.scale.linear(),
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
        range: createSpy()
      };

      const selection = mockSelection({client: {width: 200, height: 100}});
      const props = generateProps(selection, {xScale});
      prepare(selection, props);

      expect(xScale.range).toHaveBeenCalled();
      expect(xScale.range.calls[0].arguments).toEqual([[100, 0]]);
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
