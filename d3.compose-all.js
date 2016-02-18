import d3 from 'd3';
import utils from './src/utils';
import helpers from './src/helpers';
import chart, {Chart} from './src/chart';
import component, {Component} from './src/component';
import overlay, {Overlay} from './src/overlay';
import Compose from './src/compose';
import mixins from './src/mixins';

import bars, {Bars} from './src/charts/bars';
import lines, {Lines} from './src/charts/lines';
import scatter, {Scatter} from './src/charts/scatter';
import labels, {Labels} from './src/charts/labels';

import text, {Text} from './src/components/text';
import title, {Title} from './src/components/title';
import axisTitle, {AxisTitle} from './src/components/axis-title';
import axis, {Axis} from './src/components/axis';
import gridlines, {Gridlines} from './src/components/gridlines';
import legend, {Legend} from './src/components/legend';

import layered from './src/layouts/layered';

var d3c = d3.compose = {
  VERSION: '{version}',
  utils: utils,
  helpers: helpers,
  chart: chart,
  Chart: Chart,
  component: component,
  Component: Component,
  overlay: overlay,
  Overlay: Overlay,
  Compose: Compose,

  scaleBandSeries: helpers.scaleBandSeries,
  mixins: mixins,

  bars: bars,
  Bars: Bars,
  lines: lines,
  Lines: Lines,
  scatter: scatter,
  Scatter: Scatter,
  labels: labels,
  Labels: Labels,

  text: text,
  Text: Text,
  title: title,
  Title: Title,
  axisTitle: axisTitle,
  AxisTitle: AxisTitle,
  axis: axis,
  Axis: Axis,
  gridlines: gridlines,
  Gridlines: Gridlines,
  legend: legend,
  Legend: Legend,

  layered: layered
};

export default d3c;
