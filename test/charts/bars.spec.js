import expect from 'expect';
import {Bars} from '../../src/charts/bars';

describe('Bars', () => {
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
});
