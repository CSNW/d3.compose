// Setup browser globals
var jsdom = require('jsdom').jsdom;
global.document = jsdom('<!doctype html><html><body></body></html>');
global.window = document.defaultView;
global.navigator = global.window.navigator;

// Load d3 after jsdom to attach to document
// d3.chart depends on global d3
var d3 = require('d3');
global.d3 = d3;
