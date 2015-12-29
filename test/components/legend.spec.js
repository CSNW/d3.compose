import expect from 'expect';
import Legend from '../../src/components/legend';

describe('Legend', () => {
  var context = {};

  beforeEach(() => {
    const chart = d3.select('body').append('svg').attr('id', 'chart');
    const layer = chart.append('g');

    Object.assign(context, {
      chart,
      layer
    });
  });
  afterEach(() => {
    context.chart.remove();
    context = {};
  });

  describe('prototype properties (deprecated)', () => {
    it('should have charts', () => {
      const legend = new Legend(context.layer);
      expect(legend.charts).toExist();
    });

    it('should have swatchDimensions', () => {
      const legend = new Legend(context.layer);
      expect(legend.swatchDimensions).toExist();
    });

    it('should have stackDirection', () => {
      const legend = new Legend(context.layer);
      expect(legend.stackDirection).toExist();
    });
  });
});
