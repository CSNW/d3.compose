import d3 from 'd3';
import utils from './src/utils';
import helpers from './src/helpers';
import chart, {Chart} from './src/chart';
import component, {Component} from './src/component';

var d3c = d3.compose = {
  VERSION: '{version}',
  utils: utils,
  helpers: helpers,
  chart: chart,
  Chart: Chart,
  component: component,
  Component: Component,

  scaleBandSeries: helpers.scaleBandSeries
};

export default d3c;
