import d3 from 'd3';
import utils from './src/utils';
import helpers from './src/helpers';
import chart, {Chart} from './src/chart';
import component, {Component} from './src/component';
import render from './src/render';

import bars, {Bars} from './src/charts/bars';
import lines, {Lines} from './src/charts/lines';
import title, {Title} from './src/components/title';

const d3c = d3.compose = {
  VERSION: '{version}',
  utils,
  helpers,
  render,
  chart,
  Chart,
  component,
  Component,

  bars,
  Bars,
  lines,
  Lines,
  title,
  Title
};

export default d3c;
