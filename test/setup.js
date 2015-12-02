import {jsdom} from 'jsdom';
import d3 from 'd3';

// Setup browser globals
global.document = jsdom('<!doctype html><html><body></body></html>');
global.window = document.defaultView;
global.navigator = global.window.navigator;

// d3.chart depends on global d3
global.d3 = d3;
