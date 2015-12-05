import d3 from 'd3';
import 'd3.chart';
import {
  difference,
  extend,
  inherits,
  isString,
  objectEach
} from './utils';
import {
  property,
  bindAllDi,
  dimensions
} from './helpers';
var d3Chart = d3.chart();

// TEMP Clear namespace from mixins
/**
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
function Base(selection, options) {
  // d3.chart() constructor without transform and initialize cascade
  this.base = selection;
  this._layers = {};
  this._attached = {};
  this._events = {};

  // Bind all di-functions to this chart
  bindAllDi(this);

  // Set options (and properties with set_from_options)
  if (options)
    this.options(options);

  // Initialize Chart (relies on explicitly calling super in initialize)
  this.initialize(options);
}

inherits(Base, d3Chart);

extend(Base.prototype, {
  initialize: function() {},
  transform: function(data) {
    return data;
  },
  demux: function(name, data) { return data; },

  // Add events to draw: "before:draw" and "draw"
  draw: function(data) {
    // Transform data (relies on explicitly calling super in transform)
    data = this.transform(data);

    // Store fully-transformed data for reference
    this.data(data);

    this.trigger('before:draw', data);

    objectEach(this._layers, function(layer) {
      layer.draw(data);
    });
    objectEach(this._attached, function(attachment, name) {
      attachment.draw(this.demux(name, data));
    }, this);

    this.trigger('draw', data);
  },

  // Explicitly load d3.chart prototype
  layer: d3Chart.prototype.layer,
  unlayer: d3Chart.prototype.unlayer,
  attach: d3Chart.prototype.attach,
  on: d3Chart.prototype.on,
  once: d3Chart.prototype.once,
  off: d3Chart.prototype.off,
  trigger: d3Chart.prototype.trigger,

  /**
    Store fully-transformed data for direct access from the chart

    @property data
    @type Any
  */
  data: property(),

  /**
    Overall options for chart/component, automatically setting any matching properties.

    @example
    ```js
    var property = d3.compose.helpers.property;

    d3.chart('Base').extend('HasProperties', {
      a: property(),
      b: property({
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
  options: property({
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
  }
});

Base.extend = function(proto_props, static_props) {
  // name may be first parameter for d3.chart usage
  var name;
  if (isString(proto_props)) {
    name = proto_props;
    proto_props = static_props;
    static_props = arguments[2];
  }

  var Parent = this;
  var Child;

  if (proto_props && proto_props.hasOwnProperty('constructor')) {
    Child = proto_props.constructor;

    // inherits sets constructor, remove from proto_props
    proto_props = extend({}, proto_props);
    delete proto_props.constructor;
  }
  else {
    Child = function() { return Parent.apply(this, arguments); };
  }

  inherits(Child, Parent);
  if (static_props)
    extend(Child, static_props);
  if (proto_props)
    extend(Child.prototype, proto_props);

  // If name is given, register with d3.chart
  if (name)
    d3Chart[name] = Child;

  return Child;
};

export default Base;
