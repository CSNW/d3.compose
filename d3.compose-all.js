import d3 from 'd3';
import utils from './src/utils';
import helpers from './src/helpers';
import chart, {Chart} from './src/chart';
import component, {Component} from './src/component';
import render from './src/render';

import bars, {Bars} from './src/charts/bars';
import lines, {Lines} from './src/charts/lines';
import horizontalBars, {HorizontalBars} from './src/charts/horizontal-bars';
import labels, {Labels} from './src/charts/labels';
import stackedBars, {StackedBars} from './src/charts/stacked-bars';
import horizontalStackedBars, {HorizontalStackedBars} from './src/charts/horizontal-stacked-bars';

import text, {Text} from './src/components/text';
import title, {Title} from './src/components/title';
import axis, {Axis} from './src/components/axis';
import gridlines, {Gridlines} from './src/components/gridlines';
import legend, {Legend} from './src/components/legend';

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
  horizontalBars,
  HorizontalBars,
  labels,
  Labels,
  stackedBars,
  StackedBars,
  horizontalStackedBars,
  HorizontalStackedBars,

  text,
  Text,
  title,
  Title,
  axis,
  Axis,
  gridlines,
  Gridlines,
  legend,
  Legend
};

export default d3c;
