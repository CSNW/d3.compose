import d3 from 'd3'; //eslint-disable-line no-unused-vars
import utils from './src/utils';
import helpers from './src/helpers';
import Base from './src/Base';
import Chart from './src/Chart';
import Component from './src/Component';
import Overlay from './src/Overlay';
import Compose, { layered } from './src/Compose';

var d3c = d3.compose = {
  VERSION: '{version}',
  utils: utils,
  helpers: helpers,
  Base: Base,
  Chart: Chart,
  Component: Component,
  Overlay: Overlay,
  Compose: Compose,
  layered: layered
}

export default d3c;
