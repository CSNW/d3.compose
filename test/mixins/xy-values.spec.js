const expect = require('expect');
const mockSelection = require('../_helpers/mock-selection');
const d3 = require('d3');
const d3c = require('../../');

const createSpy = expect.createSpy;
const getDimensions = d3c.helpers.getDimensions;
const scaleBandSeries = d3c.helpers.scaleBandSeries;
const xyValues = d3c.mixins.xyValues;
const prepare = xyValues.prepare;
const getWidth = xyValues.getWidth;

describe('xyValues', () => {
  describe('properties', () => {
    // TODO
  });

  describe('prepare', () => {
    function generateProps(selection, props) {
      const dimensions = getDimensions(selection);
      const defaultProps = {
        xScale: scaleBandSeries(),
        xScalePadding: 0,
        xScaleOuterPadding: 0,
        yScale: d3.scale.linear()
      };

      return Object.assign({}, dimensions, defaultProps, props);
    }

    it('should set rangeRoundBands for xScale', () => {
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
      const props = generateProps(selection, {yScale});
      prepare(selection, props);

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
