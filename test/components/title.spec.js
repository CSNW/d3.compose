import d3 from 'd3';
// import expect from 'expect';
// import {Title} from '../../src/components/title';

describe('Title', () => {
  var context = {};

  beforeEach(() => {
    const chart = d3.select('body').append('svg').attr('id', 'chart');
    const layer = chart.append('g');

    context ={
      chart,
      layer
    };
  });
  afterEach(() => {
    context.chart.remove();
    context = {};
  });
});
