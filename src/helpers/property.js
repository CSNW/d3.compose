import {
  isFunction,
  isUndefined,
  valueOrDefault
} from '../utils';

/**
  Helper for creating properties for charts/components

  @example
  ```javascript
  var Custom = d3.chart('Chart').extend('Custom', {
    // Create property that's stored internally as 'simple'
    simple: property('simple')
  });
  var custom; // = new Custom(...);

  // set
  custom.simple('Howdy');

  // get
  console.log(custom.simple()); // -> 'Howdy'

  // Advanced
  // --------
  // Default values:
  Custom.prototype.message = property('message', {
    default_value: 'Howdy!'
  });

  console.log(custom.message()); // -> 'Howdy!'
  custom.message('Goodbye');
  console.log(custom.message()); // -> 'Goodbye'

  // Set to undefined to reset to default value
  custom.message(undefined);
  console.log(custom.message()); // -> 'Howdy!'

  // Custom getter:
  Custom.prototype.exclaimed = property('exclaimed', {
    get: function(value) {
      // Value is the underlying set value
      return value + '!';
    }
  });

  custom.exclaimed('Howdy');
  console.log(custom.exclaimed()); // -> 'Howdy!'

  // Custom setter:
  Custom.prototype.feeling = property('feeling', {
    set: function(value, previous) {
      if (value == 'Hate') {
        // To override value, return Object with override specified
        return {
          override: 'Love',

          // To do something after override, use after callback
          after: function() {
            console.log('After: ' + this.feeling()); // -> 'After: Love'
          }
        };
      }
    }

    custom.feeling('Hate'); // -> 'After: Love'
    console.log(custom.feeling()); // -> 'Love'
  });
  ```
  @method property
  @for helpers
  @param {String} name of stored property
  @param {Object} [options]
  @param {Any} [options.default_value] default value for property (when set value is `undefined`)
  @param {Function} [options.get] `function(value) {return ...}` getter, where `value` is the stored value and return desired value
  @param {Function} [options.set] `function(value, previous) {return {override, after}}`. Return `override` to override stored value and `after()` to run after set
  @param {String} [options.type] `get` is evaluated by default, use `"Function"` to skip evaluation
  @param {Object} [options.context=this] context to evaluate get/set/after functions
  @param {String} [options.prop_key='__properties'] underlying key on object to store property
  @return {Function} `()`: get, `(value)`: set
*/
export default function property(name, options) {
  options = options || {};
  var prop_key = options.prop_key || '__properties';

  var property = function(value) {//eslint-disable-line no-shadow
    var properties = this[prop_key] = this[prop_key] || {};
    var context = valueOrDefault(property.context, this);

    if (arguments.length)
      return set.call(this);
    else
      return get.call(this);

    function get() {
      value = valueOrDefault(properties[name], property.default_value);

      // Unwrap value if its type is not a function
      if (isFunction(value) && options.type != 'Function')
        value = value.call(this);

      return isFunction(options.get) ? options.get.call(context, value) : value;
    }

    function set() {
      // Validate
      if (isFunction(options.validate) && !isUndefined(value) && !options.validate.call(this, value))
        throw new Error('Invalid value for ' + name + ': ' + JSON.stringify(value));

      property.previous = properties[name];
      properties[name] = value;

      if (isFunction(options.set) && !isUndefined(value)) {
        var response = options.set.call(context, value, property.previous);

        if (response && 'override' in response)
          properties[name] = response.override;
        if (response && isFunction(response.after))
          response.after.call(context, properties[name]);
      }

      return this;
    }
  };

  // For checking if function is a property
  property.is_property = true;
  property.set_from_options = valueOrDefault(options.set_from_options, true);
  property.default_value = options.default_value;
  property.context = options.context;

  return property;
}
