import expect from 'expect';
import d3 from 'd3';
import {Lines} from '../../src/charts/lines';

describe('Lines', () => {
  var context = {};

  beforeEach(() => {
    const chart = d3.select('body').append('svg').attr('id', 'chart');
    const layer = chart.append('g');

    context = {
      chart,
      layer
    };
  });
  afterEach(() => {
    context.chart.remove();
    context = {};
  });
});
