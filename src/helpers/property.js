import {
  deprecate,
  isFunction,
  isUndefined,
  valueOrDefault
} from '../utils';
var unique_index = 0;

/**
  Helper for creating properties for charts/components

  @example
  ```javascript
  var Custom = d3.chart('Chart').extend('Custom', {
    // Create property that's stored internally as 'simple'
    simple: property()
  });
  var custom; // = new Custom(...);

  // set
  custom.simple('Howdy');

  // get
  console.log(custom.simple()); // -> 'Howdy'

  // Advanced
  // --------
  // Default values:
  Custom.prototype.message = property({
    default_value: 'Howdy!'
  });

  console.log(custom.message()); // -> 'Howdy!'
  custom.message('Goodbye');
  console.log(custom.message()); // -> 'Goodbye'

  // Set to undefined to reset to default value
  custom.message(undefined);
  console.log(custom.message()); // -> 'Howdy!'

  // Computed default value:
  Custom.property.computed = property({
    default_value: function() {
      // "this" = Custom instance
      return this.message();
    }
  });

  // Function default value:
  // For function default_values, wrap in function to differentiate from computed
  Custom.property.fn = property({
    default_value: function() {
      return function defaultFn() {};
    }
    // The following would be incorrectly evaluated
    // default_value: function defaultFn() {}
  })

  // Custom getter:
  Custom.prototype.exclaimed = property({
    get: function(value) {
      // Value is the underlying set value
      return value + '!';
    }
  });

  custom.exclaimed('Howdy');
  console.log(custom.exclaimed()); // -> 'Howdy!'

  // Custom setter:
  Custom.prototype.feeling = property({
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
  @param {Object} [options]
  @param {Any} [options.default_value] default value for property (when set value is `undefined`). If default value is a function, wrap in another function as default_value is evaluated by default.
  @param {Function} [options.get] `function(value) {return ...}` getter, where `value` is the stored value and return desired value
  @param {Function} [options.set] `function(value, previous) {return {override, after}}`. Return `override` to override stored value and `after()` to run after set
  @param {Object} [options.context=this] context to evaluate get/set/after functions
  @return {Function} `()`: get, `(value)`: set
*/
export default function property(options) {
  // DEPRECATED: name as first argument
  if (arguments.length == 2) {
    deprecate('"name" as the first argument for property is no longer required/supported and will be removed in the next version of d3.compose.', 'v0.17.0');
    options = arguments[1];
  }

  options = options || {};
  var id = 'property_' + unique_index++;

  var property = function(value) {//eslint-disable-line no-shadow
    var properties = this.__properties = this.__properties || {};
    var context = valueOrDefault(property.context, this);

    if (arguments.length)
      return set.call(this);
    else
      return get.call(this);

    function get() {
      value = properties[id];

      if (isUndefined(value)) {
        // Use default value and unwrap if it's a function
        value = property.default_value;
        if (isFunction(value))
          value = value.call(context);
      }

      return isFunction(options.get) ? options.get.call(context, value) : value;
    }

    function set() {
      // Validate
      if (isFunction(options.validate) && !isUndefined(value) && !options.validate.call(context, value))
        throw new Error('Invalid value for property: ' + JSON.stringify(value));

      var previous = properties[id];
      properties[id] = value;

      if (isFunction(options.set) && !isUndefined(value)) {
        var response = options.set.call(context, value, previous);

        if (response && 'override' in response)
          properties[id] = response.override;
        if (response && isFunction(response.after))
          response.after.call(context, properties[id]);
      }

      return this;
    }
  };

  // For checking if function is a property
  property.is_property = true;
  property.id = id;
  property.set_from_options = valueOrDefault(options.set_from_options, true);
  property.default_value = options.default_value;
  property.context = options.context;
  property.options = options;

  return property;
}
