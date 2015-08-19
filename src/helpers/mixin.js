import {
  objectEach,
  slice
} from '../utils';

/**
  Combine mixins with Parent super class for extension

  @example
  ```js
  var a = {transform: function() {}, a: 1};
  var b = {initialize: function() {}, b: 2};
  var c = {c: 3};

  var Custom = mixin(Chart, a, b, c).extend({
    initialize: function(options) {
      this._super.initialize.call(this, options);
      // d
    },
    transform: function(data) {
      data = this._super.transform.call(this, data);
      // d
    }
  });

  // initialize: Chart, b, d
  // transform: Chart, a, d
  ```
  @method mixin
  @for helpers
  @param {Function} Parent
  @param {...Object} ...mixins
  @return {Function}
*/
export default function mixin(Parent/*, ...mixins*/) {
  var mixins = slice.call(arguments, 1);
  var initializes = [];
  var transforms = [];
  var mixed = {};

  mixins.forEach(function(mix) {
    objectEach(mix, function(value, key) {
      if (key == 'initialize')
        initializes.push(value);
      else if (key == 'transform')
        transforms.push(value);
      else
        mixed[key] = value;
    });
  });

  if (initializes.length) {
    mixed.initialize = function initialize() {
      var args = slice.call(arguments);
      Parent.prototype.initialize.apply(this, args);
      initializes.forEach(function(init) {
        init.apply(this, args);
      }, this);
    };
  }

  if (transforms.length) {
    mixed.transform = function transform(data) {
      data = Parent.prototype.transform.call(this, data);
      return transforms.reduce(function(memo, trans) {
        return trans.call(this, memo);
      }.bind(this), data);
    };
  }

  return Parent.extend(mixed);
}
