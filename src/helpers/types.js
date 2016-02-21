import {
  includes,
  toArray
} from '../utils';

var types = {
  boolean: {},
  number: {},
  string: {},
  any: {},
  array: {},
  object: {},
  enum: function() {
    var valid = toArray(arguments);
    return {
      validate: function(value) { return includes(valid, value); }
    };
  }
};
export default types;
