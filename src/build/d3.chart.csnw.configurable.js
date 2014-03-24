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

// @include ../helpers.js
// @include ../extensions.js

// @include ../base.js
// @include ../chart.js
// @include ../component.js
// @include ../container.js

// @include ../charts/labels.js
// @include ../charts/line.js
// @include ../charts/bars.js
// @include ../components/axis.js

// @include ../charts/configurable.js

  return d3;
}));
