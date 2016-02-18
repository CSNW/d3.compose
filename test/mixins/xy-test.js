const expect = require('expect');
const mockSelection = require('../_helpers/mock-selection');
const d3 = require('d3');
const d3c = require('../../');

const createSpy = expect.createSpy;
const getDimensions = d3c.helpers.getDimensions;
const scaleBandSeries = d3c.scaleBandSeries;
const xy = d3c.mixins.xy;
const prepare = xy.prepare;
const getValue = xy.getValue;
const getMinMaxDomain = xy.getMinMaxDomain;

describe('xy', () => {
  describe('properties', () => {
    // TODO
  });

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
      expect(xScale.range.calls[0].arguments).toEqual([[0, 200]]);
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

  describe('getValue', () => {
    it('should get value for given values and scale', () => {
      const scale = scaleBandSeries()
        .seriesCount(2)
        .domain([1, 2, 3, 4])
        .rangeRoundBands([0, 100], 0, 0);
      const value = d => d.x;
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
