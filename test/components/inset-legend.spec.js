import expect from 'expect';
import InsetLegend from '../../src/components/InsetLegend';

describe('InsetLegend', () => {
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
    it('should have translation', () => {
      const legend = new InsetLegend(context.layer);
      expect(legend.translation).toExist();
    });
  });
});
