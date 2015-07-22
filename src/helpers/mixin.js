import { extend } from '../utils';

/**
  Mix prototypes into single combined prototype for chart/component

  Designed specifically to work with d3.chart:

  - transform is called from last to first
  - initialize is called from first to last
  - remaining are overriden from first to last

  @example
  ```js
  var a = {transform: function() {}, a: 1};
  var b = {initialize: function() {}, b: 2};
  var c = {c: 3};

  d3.chart('Chart').extend('Custom', mixin(a, b, c, {
    initialize: function() {
      // d
    },
    transform: function() {
      // d
    }
  }));

  // initialize: Chart -> b -> d
  // transform: d -> a -> Chart
  ```
  @method mixin
  @for helpers
  @param {Array|Object...} mixins... Array of mixins or mixins as separate arguments
  @return {Object}
*/
export default function mixin(mixins) {
  mixins = Array.isArray(mixins) ? mixins : Array.prototype.slice.call(arguments);
  var mixed = extend.apply(null, [{}].concat(mixins));

  // Don't mixin constructor with prototype
  delete mixed.constructor;

  if (mixed.initialize) {
    mixed.initialize = function initialize() {
      var args = Array.prototype.slice.call(arguments);

      mixins.forEach(function(extension) {
        if (extension.initialize)
          extension.initialize.apply(this, args);
      }, this);
    };
  }
  if (mixed.transform) {
    mixed.transform = function transform(data) {
      return mixins.reduceRight(function(memo, extension) {
        if (extension && extension.transform)
          return extension.transform.call(this, memo);
        else
          return memo;
      }.bind(this), data);
    };
  }

  return mixed;
}
