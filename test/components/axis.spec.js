import expect from 'expect';
import Axis from '../../src/components/axis';

describe('Axis', () => {
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
    it('should have scale', () => {
      const axis = new Axis(context.layer);
      expect(axis.scale).toExist();
    });

    it('should have xScale', () => {
      const axis = new Axis(context.layer);
      expect(axis.xScale).toExist();
    });

    it('should have yScale', () => {
      const axis = new Axis(context.layer);
      expect(axis.yScale).toExist();
    });

    it('should have translation', () => {
      const axis = new Axis(context.layer);
      expect(axis.translation).toExist();
    });

    it('should have orient', () => {
      const axis = new Axis(context.layer);
      expect(axis.orient).toExist();
    });

    it('should have orientation', () => {
      const axis = new Axis(context.layer);
      expect(axis.orientation).toExist();
    });

    it('should have gridlines', () => {
      const axis = new Axis(context.layer);
      expect(axis.gridlines).toExist();
    });

    it('should have ticks', () => {
      const axis = new Axis(context.layer);
      expect(axis.ticks).toExist();
    });

    it('should have tickValues', () => {
      const axis = new Axis(context.layer);
      expect(axis.tickValues).toExist();
    });

    it('should have tickSize', () => {
      const axis = new Axis(context.layer);
      expect(axis.tickSize).toExist();
    });

    it('should have innerTickSize', () => {
      const axis = new Axis(context.layer);
      expect(axis.innerTickSize).toExist();
    });

    it('should have outerTickSize', () => {
      const axis = new Axis(context.layer);
      expect(axis.outerTickSize).toExist();
    });

    it('should have tickPadding', () => {
      const axis = new Axis(context.layer);
      expect(axis.tickPadding).toExist();
    });

    it('should have tickFormat', () => {
      const axis = new Axis(context.layer);
      expect(axis.tickFormat).toExist();
    });
  });
});
