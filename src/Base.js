import d3 from 'd3';
import {
  difference,
  objectEach
} from './utils';
import {
  property,
  bindAllDi,
  dimensions
} from './helpers';

/**
  TEMP Clear namespace from mixins
  @namespace
*/

/**
  Shared functionality between all charts and components.

  - Set properties automatically from `options`,
  - Store fully transformed data
  - Adds `"before:draw"` and `"draw"` events
  - Standard `width` and `height` calculations

  @class Base
*/
export default d3.chart('Base', {
  initialize: function(options) {
    // Bind all di-functions to this chart
    bindAllDi(this);

    if (options)
      this.options(options);
  },

  /**
    Store fully-transformed data for direct access from the chart

    @property data
    @type Any
  */
  data: property('data'),

  /**
    Overall options for chart/component, automatically setting any matching properties.

    @example
    ```js
    var property = d3.compose.helpers.property;

    d3.chart('Base').extend('HasProperties', {
      a: property('a'),
      b: property('b', {
        set: function(value) {
          return {
            override: value + '!'
          };
        }
      })
    });

    var instance = d3.select('#chart')
      .chart('HasProperties', {
        a: 123,
        b: 'Howdy',
        c: true
      });

    // Equivalent to:
    // d3.select(...)
    //   .chart('HasProperties')
    //   .options({...});

    console.log(instance.a()); // -> 123
    console.log(instance.b()); // -> Howdy!
    console.log(instance.options().c); // -> true
    ```
    @property options
    @type Object
  */
  options: property('options', {
    default_value: {},
    set: function(options, previous) {
      // Clear all unset options, except for data and options
      if (previous) {
        var unset = difference(Object.keys(previous), Object.keys(options));
        unset.forEach(function(key) {
          if (key != 'data' && key != 'options' && isProperty(this, key))
            this[key](undefined);
        }, this);
      }

      objectEach(options, function setFromOptions(value, key) {
        if (isProperty(this, key))
          this[key](value);
      }, this);

      function isProperty(chart, key) {
        return chart[key] && chart[key].is_property && chart[key].set_from_options;
      }
    }
  }),

  /**
    Get width of `this.base`.
    (Does not include `set` for setting width of `this.base`)

    @method width
    @return {Number}
  */
  width: function width() {
    return dimensions(this.base).width;
  },

  /**
    Get height of `this.base`.
    (Does not include `set` for setting height of `this.base`)

    @method height
    @return {Number}
  */
  height: function height() {
    return dimensions(this.base).height;
  },

  // Store fully-transformed data for reference
  // (Base is last transform to be called, so stored data has been fully transformed)
  transform: function(data) {
    data = data || [];

    this.data(data);
    return data;
  },

  // Add events to draw: "before:draw" and "draw"
  draw: function(data) {
    this.trigger('before:draw', data);
    d3.chart().prototype.draw.apply(this, arguments);
    this.trigger('draw', data);
  }
});
