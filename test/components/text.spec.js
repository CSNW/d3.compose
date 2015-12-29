import expect from 'expect';
import Text from '../../src/components/text';

describe('Text', () => {
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
    it('should have text', () => {
      const text = new Text(context.layer);
      expect(text.text).toExist();
    });

    it('should have rotation', () => {
      const text = new Text(context.layer);
      expect(text.rotation).toExist();
    });

    it('should have textAlign', () => {
      const text = new Text(context.layer);
      expect(text.textAlign).toExist();
    });

    it('should have anchor', () => {
      const text = new Text(context.layer);
      expect(text.anchor).toExist();
    });

    it('should have verticalAlign', () => {
      const text = new Text(context.layer);
      expect(text.verticalAlign).toExist();
    });

    it('should have style', () => {
      const text = new Text(context.layer);
      expect(text.style).toExist();
    });
  });
});
