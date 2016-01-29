import expect from 'expect';
import {Text} from '../../src/components/text';

describe('Text', () => {
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
