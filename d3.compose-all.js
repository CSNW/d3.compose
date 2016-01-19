import d3 from 'd3';
import * as utils from './src/utils';
import * as helpers from './src/helpers';
import chart, {Chart} from './src/chart';
import component, {Component} from './src/component';

import bars, {Bars} from './src/charts/bars';
import title, {Title} from './src/components/title';

const d3c = d3.compose = {
  VERSION: '{version}',
  utils,
  helpers,
  chart,
  Chart,
  component,
  Component,

  bars,
  Bars,
  title,
  Title
};

export default d3c;
