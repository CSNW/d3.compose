(function (root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory(require('d3', 'underscore'));
  } else if (typeof define === 'function' && define.amd) {
    define(['d3', 'underscore'], factory);
  } else {
    factory(root.d3, root._);
  }
}(this, function (d3, _) {
  'use strict';
