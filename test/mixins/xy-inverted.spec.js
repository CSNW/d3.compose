const expect = require('expect');
const mockSelection = require('../_helpers/mock-selection');
const d3 = require('d3');
const d3c = require('../../');

const createSpy = expect.createSpy;
const getDimensions = d3c.helpers.getDimensions;
const prepare = d3c.mixins.xyInverted.prepare;

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
