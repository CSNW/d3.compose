/*! d3.chart.multi - v0.10.0
 * https://github.com/CSNW/d3.chart.multi
 * License: MIT
 */
(function(d3, _) {

  utils = {
    chain: _.chain,
    clone: _.clone,
    contains: _.contains,
    compact: _.compact,
    difference: _.difference,
    defaults: _.defaults,
    each: _.each,
    extend: _.extend,
    flatten: _.flatten,
    first: _.first,
    has: _.has,
    isArray: _.isArray,
    isBoolean: _.isBoolean,
    isFunction: _.isFunction,
    isObject: _.isObject,
    isNumber: _.isNumber,
    isString: _.isString,
    isUndefined: _.isUndefined,
    keys: _.keys,
    map: _.map,
    max: _.max,
    reduce: _.reduce,
    reduceRight: _.reduceRight,
    reverse: _.reverse,
    sortBy: _.sortBy,
    throttle: _.throttle,
    toArray: _.toArray,
    uniq: _.uniq,
    value: _.value,
  };

  /**
    Property helper

    @example
    ```javascript
    var obj = {};

    // Create property that's stored internally as 'simple'
    obj.simple = property('simple');

    // set
    obj.simple('Howdy');

    // get
    console.log(obj.simple()); // -> 'Howdy'
    
    // Advanced
    // --------
    // Default values:
    obj.advanced = property('advanced', {
      default_value: 'Howdy!'
    });
  
    console.log(obj.advanced()); // -> 'Howdy!'
    obj.advanced('Goodbye');
    console.log(obj.advanced()); // -> 'Goodbye'

    // Set to undefined to reset to default value
    obj.advanced(undefined);
    console.log(obj.advanced()); // -> 'Howdy!'

    // Custom getter:
    obj.advanced = property('advanced', {
      get: function(value) {
        // Value is the underlying set value
        return value + '!';
      }
    });

    obj.advanced('Howdy');
    console.log(obj.advanced()); // -> 'Howdy!'

    // Custom setter:
    obj.advanced = property('advanced', {
      set: function(value, previous) {
        if (value == 'Hate') {
          // To override value, return obj with override specified
          return {
            override: 'Love',

            // To do something after override, use after callback
            after: function() {
              console.log('After: ' + this.advanced()); // -> 'After: Love'
            }
          };
        }
      }

      obj.advanced('Hate'); // -> 'After: Love'
      console.log(obj.advanced()); // -> 'Love'
    });
    ```

    @param {String} name of stored property
    @param {Object} options
    - default_value: default value for property (when set value is undefined)
    - get: function(value) {return ...} getter, where value is the stored value, return desired value
    - set: function(value, previous) {return {override, after}} 
      - return override to set stored value and after() to run after set
    - type: {String} ['Function']
      - 'Object' gets object extensions: extend({...})
      - 'Array' gets array extensions: push(...)
      - 'Function' don't evaluate in get/set
    - context: {Object} [this] context to evaluate get/set/after functions
    - prop_key: {String} ['__properties'] underlying key on object to store properties on

    @return {Function}
    - (): get
    - (value): set
  */ 
  function property(name, options) {
    options = options || {};
    var prop_key = options.prop_key || '__properties';

    var getSet = function(value) {
      var properties = this[prop_key] = this[prop_key] || {};
      var existing = properties[name];
      var context = valueOrDefault(getSet.context, this);
      
      if (arguments.length)
        return set.call(this, value);
      else
        return get.call(this);

      function get() {
        var value = valueOrDefault(properties[name], getSet.default_value);

        // Unwrap value if its type is not a function
        if (utils.isFunction(value) && options.type != 'Function')
          value = value.call(this);

        return utils.isFunction(options.get) ? options.get.call(context, value) : value;
      }

      function set(value) {
        // Validate
        if (utils.isFunction(options.validate) && !options.validate.call(this, value))
          throw new Error('Invalid value for ' + name + ': ' + JSON.stringify(value));

        getSet.previous = properties[name];
        properties[name] = value;

        if (utils.isFunction(options.set)) {
          var response = options.set.call(context, value, getSet.previous);
          
          if (response && utils.has(response, 'override'))
            properties[name] = response.override;
          if (response && utils.isFunction(response.after))
            response.after.call(context, properties[name]);
        }

        return this;
      }
    };

    // For checking if function is a property
    getSet.is_property = true;
    getSet.set_from_options = valueOrDefault(options.set_from_options, true);
    getSet.default_value = options.default_value;
    getSet.context = options.context;

    return getSet;
  }

  /**
    If value isn't undefined, return value, otherwise use default_value
  
    @param {Varies} [value]
    @param {Varies} default_value
    @return {Varies}
  */
  function valueOrDefault(value, default_value) {
    return !utils.isUndefined(value) ? value : default_value;
  }

  /**
    Dimensions
    Helper for robustly determining width/height of given selector

    @param {d3 Selection} selection
    @return {Object} {width, height}
  */
  function dimensions(selection) {
    var element = selection && selection.length && selection[0] && selection[0].length && selection[0][0];
    var is_SVG = element ? element.nodeName == 'svg' : false;

    // 1. Get width/height set via css (only valid for svg and some other elements)
    var client = {
      width: element && element.clientWidth, 
      height: element && element.clientHeight
    };

    // Issue: Firefox does not correctly calculate clientWidth/clientHeight for svg
    //        calculate from css
    //        http://stackoverflow.com/questions/13122790/how-to-get-svg-element-dimensions-in-firefox
    //        Note: This makes assumptions about the box model in use and that width/height are not percent values
    if (is_SVG && (!element.clientWidth || !element.clientHeight) && typeof window !== 'undefined' && window.getComputedStyle) {
      var styles = window.getComputedStyle(element);
      client.height = parseFloat(styles.height) - parseFloat(styles.borderTopWidth) - parseFloat(styles.borderBottomWidth);
      client.width = parseFloat(styles.width) - parseFloat(styles.borderLeftWidth) - parseFloat(styles.borderRightWidth);
    }

    if (client.width && client.height)
      return client;

    // 2. Get width/height set via attribute
    var attr = {
      width: selection && selection.attr && parseFloat(selection.attr('width')),
      height: selection && selection.attr && parseFloat(selection.attr('height'))
    };
    
    if (is_SVG) {
      return {
        width: client.width != null ? client.width : attr.width || 0,
        height: client.height != null ? client.height : attr.height || 0
      };
    }
    else {
      // Firefox throws error when calling getBBox when svg hasn't been displayed
      // ignore error and set to empty
      var bbox = {width: 0, height: 0};
      try {
        bbox = element && typeof element.getBBox == 'function' && element.getBBox();
      }
      catch(ex) {}

      // Size set by css -> client (only valid for svg and some other elements)
      // Size set by svg -> attr override or bounding_box
      // -> Take maximum
      return {
        width: utils.max([client.width, attr.width || bbox.width]) || 0,
        height: utils.max([client.height, attr.height || bbox.height]) || 0
      };
    }
  }

  /**
    Translate by (x, y) distance
    
    @example
    ```javascript
    transform.translate(10, 15) == 'translate(10, 15)'
    transform.translate({x: 10, y: 15}) == 'translate(10, 15)'
    ```

    @param {Number|Object} [x] value or object with x and y
    @param {Number} [y]
    @return {String}
  */
  function translate(x, y) {
    if (utils.isObject(x)) {
      y = x.y;
      x = x.x;
    }
      
    return 'translate(' + (x || 0) + ', ' + (y || 0) + ')';
  }

  /**
    Rotate by degrees, with optional center

    @param {Number} degrees
    @param {Object} [center = {x: 0, y: 0}]
    @return {String}
  */
  function rotate(degrees, center) {
    var rotation = 'rotate(' + (degrees || 0);
    if (center)
      rotation += ' ' + (center.x || 0) + ',' + (center.y || 0);

    return rotation += ')';
  }

  /**
    Determine if given data is likely series data
  */
  function isSeriesData(data) {
    var first = utils.first(data);
    return first && utils.isObject(first) && utils.isArray(first.values);
  }

  /**
    Get max for array/series by value di
  */
  function max(data, getValue) {
    var getMax = function(data) {
      return data && d3.extent(data, getValue)[1];
    };

    if (isSeriesData(data)) {
      return utils.reduce(data, function(memo, series, index) {
        if (series && utils.isArray(series.values)) {
          var series_max = getMax(series.values);
          return series_max > memo ? series_max : memo;
        }
        else {
          return memo;
        }
      }, -Infinity);
    }
    else {
      return getMax(data);
    }
  }

  /**
    Get min for array/series by value di
  */
  function min(data, getValue) {
    var getMin = function(data) {
      return data && d3.extent(data, getValue)[0];
    };

    if (isSeriesData(data)) {
      return utils.reduce(data, function(memo, series, index) {
        if (series && utils.isArray(series.values)) {
          var series_min = getMin(series.values);
          return series_min < memo ? series_min : memo;
        }
        else {
          return memo;
        }
      }, Infinity);
    }
    else {
      return getMin(data);
    }
  }

  /**
    Create scale from options
    
    @example
    ```javascript
    // Simple type, range, and domain
    var scale = createScale({
      type: 'linear', 
      domain: [0, 100], 
      range: [0, 500]
    });

    // Scale is passed through
    var original = d3.scale.linear();
    var scale = createScale(original);
    scale === original;

    // Set other properties by passing in "arguments" array
    var scale = createScale({
      type: 'ordinal',
      domain: ['a', 'b', 'c', 'd', 'e'],
      rangeRoundBands: [[0, 100], 0.1, 0.05]
    });
    ```

    @param {Object|function} options
    - (passing in function returns original function with no changes)
    - type: {String} Any available d3 scale (linear, ordinal, log, etc.) or time
    - domain: {Array} Domain for scale
    - range: {Array} Range for scale
    - ...: {Arguments Array} Set any other scale properties by passing in "arguments" array
    @return {d3.scale}
  */
  function createScale(options) {
    options = options || {};

    // If function, scale was passed in as options
    if (utils.isFunction(options))
      return options;

    // Create scale (using d3.time.scale() if type is 'time')
    var scale;
    if (options.type && options.type == 'time')
      scale = d3.time.scale();
    else if (options.type && d3.scale[options.type])
      scale = d3.scale[options.type]();
    else
      scale = d3.scale.linear();

    utils.each(options, function(value, key) {
      if (scale[key]) {
        // If option is standard property (domain or range), pass in directly
        // otherwise, pass in as arguments
        // (don't pass through type, data, or key)
        if (key == 'range' || key == 'domain')
          scale[key](value);
        else if (key != 'type' && key != 'data' && key != 'key')
          scale[key].apply(scale, value);  
      }
    });

    if (!options.domain && options.data && options.key) {
      var getValue = function(d, i) {
        return d[options.key];
      };

      if (options.type == 'ordinal') {
        // Extract unique values from series
        var getValues = function(data) {
          return utils.map(data, getValue);
        };

        var all_values;
        if (isSeriesData(options.data)) {
          all_values = utils.flatten(utils.map(options.data, function(series) {
            if (series && utils.isArray(series.values)) {
              return getValues(series.values);
            }
          }));
        }
        else {
          all_values = getValues(options.data);
        }

        scale.domain(utils.uniq(all_values));
      }
      else {
        // By default, domain starts at 0 unless min is less than 0
        var min_value = min(options.data, getValue);

        scale.domain([
          min_value < 0 ? min_value : 0, 
          max(options.data, getValue)
        ]);
      }      
    }

    return scale;
  }

  /**
    Convert key,values to style string

    @example
    style({color: 'red', display: 'block'}) -> color: red; display: block;

    @param {Object} styles
    @return {String}
  */
  function style(styles) {
    if (!styles)
      return '';

    styles = utils.map(styles, function(value, key) {
      return key + ': ' + value;
    });
    styles = styles.join('; ');

    return styles ? styles + ';' : '';
  }

  /**
    Create wrapped (d, i) function that adds chart instance as first argument
    Wrapped function uses standard d3 arguments and context
  
    Note: in order to pass proper context to di-functions called within di-function
          use `.call(this, d, i)` (where "this" is d3 context)

    @example
    ```javascript
    Chart.prototype.x = helpers.di(function(chart, d, i) {
      // "this" is traditional d3 context: node
      return chart._xScale()(chart.xValue.call(this, d, i));
    });
  
    // In order for chart to be specified, bind to chart
    chart.x = helpers.bindDi(chart.x, chart);
    // or
    helpers.bindAllDi(chart);

    this.select('point').attr('cx', chart.x);
    // (d, i) and "this" used from d3, "chart" injected automatically
    ```

    @param {Function} callback with (chart, d, i) arguments
    @return {Function}
  */
  function di(callback) {
    // Create intermediate wrapping in case it's called without binding
    var wrapped = function wrapped(d, i, j) {
      return callback.call(this, undefined, d, i, j);
    };
    wrapped._is_di = true;
    wrapped.original = callback;

    return wrapped;
  }

  function bindDi(di, chart) {
    return function wrapped(d, i, j) {
      return (di.original || di).call(this, chart, d, i, j);
    };
  }

  // Bind all di-functions found in chart
  function bindAllDi(chart) {
    for (var key in chart) {
      if (chart[key] && chart[key]._is_di)
        chart[key] = bindDi(chart[key], chart);
    }
  }


  /**
    Get parent data for element

    @param {Element} element
    @return {Varies}
  */
  function getParentData(element) {
    // @internal Shortcut if element + parentData needs to be mocked
    if (element._parent_data)
      return element._parent_data;

    var parent = element && element.parentNode;
    if (parent) {
      var data = d3.select(parent).data();
      return data && data[0];
    }
  }

  /**
    Mixin mixins into prototype

    Designed specifically to work with d3-chart
    - transform is called from last to first
    - initialize is called from first to last
    - remaining are overriden from first to last  

    @param {Array or Object...} mixins Array of mixins or separate extension arguments
    @return {Object}
  */
  function mixin(mixins) {
    mixins = utils.isArray(mixins) ? mixins : utils.toArray(arguments);
    var mixed = utils.extend.apply(null, [{}].concat(mixins));

    // Don't mixin constructor with prototype
    delete mixed.constructor;

    if (mixed.initialize) {
      mixed.initialize = function initialize() {
        var args = utils.toArray(arguments);

        utils.each(mixins, function(extension) {
          if (extension.initialize)
            extension.initialize.apply(this, args);
        }, this);
      };
    }
    if (mixed.transform) {
      mixed.transform = function transform(data) {
        return utils.reduceRight(mixins, function(data, extension) {
          if (extension && extension.transform)
            return extension.transform.call(this, data);
          else
            return data;
        }, data, this);
      };
    }
    
    return mixed;
  }

  // Add helpers to d3.chart (static)
  d3.chart.helpers = utils.extend({}, d3.chart.helpers, {
    utils: utils,
    property: property,
    valueOrDefault: valueOrDefault,
    dimensions: dimensions,
    translate: translate,
    rotate: rotate,
    isSeriesData: isSeriesData,
    max: max,
    min: min,
    createScale: createScale,
    style: style,
    di: di,
    bindDi: bindDi,
    bindAllDi: bindAllDi,
    getParentData: getParentData,
    mixin: mixin
  });
})(d3, _);
(function(d3, helpers) {
  var each = helpers.utils.each;
  var property = helpers.property;
  
  /**
    Base
    Shared functionality between all charts, components, and containers

    Properties:
    - data
    - options
    - style
  */
  d3.chart('Base', {
    initialize: function() {
      // Bind all di-functions to this chart
      helpers.bindAllDi(this);
    },

    /**
      Store fully-transformed data

      @param {Object|Array} value
    */
    data: property('data'),

    /**
      General options for chart/component

      @param {Object} value
    */
    options: property('options', {
      default_value: {},
      set: function(options) {
        each(options, function(value, key) {
          if (this[key] && this[key].is_property && this[key].set_from_options)
            this[key](value);
        }, this);
      }
    }),

    /**
      General style for chart/component

      @param {Object} value
    */
    style: property('style', {
      get: function(value) {
        return helpers.style(value) || null;
      }
    }),
    

    /**
      Get width/height of base
    */
    width: function width() {
      return helpers.dimensions(this.base).width;
    },
    height: function height() {
      return helpers.dimensions(this.base).height;
    },

    /**
      Base is last transform to be called,
      so stored data has been fully transformed
    */
    transform: function(data) {
      data = data || [];

      this.data(data);
      return data;
    },

    /**
      Add events to draw: before:draw and draw
    */
    draw: function(data) {
      this.trigger('before:draw', data);
      d3.chart().prototype.draw.apply(this, arguments);
      this.trigger('draw', data);
    }
  });

})(d3, d3.chart.helpers);

(function(d3, helpers) {
  
  /**
    Chart
    Foundation for building charts with series data
  */
  d3.chart('Base').extend('Chart', {
    initialize: function(options) {
      this.options(options || {});
    }
  }, {
    z_index: 100
  });

})(d3, d3.chart.helpers);

(function(d3, helpers) {
  var utils = helpers.utils;
  var property = helpers.property;
  
  /**
    Component
    Common component functionality / base for creating components

    Properties
    - {String} [position = top] (top, right, bottom, left)
    - {Number} [width = base width]
    - {Number} [height = base height]
    - {Object} [margins] % margins relative to component dimensions
      - top {Number} % of height
      - right {Number} % of width
      - bottom {Number} % of height
      - left {Number} % of width

    Customization
    - skip_layout: Don't use this component type during layout (e.g. inset within chart)
    - layoutWidth: Adjust with more precise sizing calculations
    - layoutHeight: Adjust with more precise sizing calculations
    - layoutPosition: Adjust layout positioning
    - setLayout: Override if layout needs to be customized
  */
  d3.chart('Base').extend('Component', {
    initialize: function(options) {
      this.options(options || {});
    },

    position: property('position', {
      default_value: 'top',
      validate: function(value) {
        return utils.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),
    width: property('width', {
      default_value: function() {
        return helpers.dimensions(this.base).width;
      }
    }),
    height: property('height', {
      default_value: function() {
        return helpers.dimensions(this.base).height;
      }
    }),

    margins: property('margins', {
      get: function(values) {
        var percentages = utils.defaults({}, values, {top: 0.0, right: 0.0, bottom: 0.0, left: 0.0});
        var width = this.width();
        var height = this.height();

        return {
          top: percentages.top * height,
          right: percentages.right * width,
          bottom: percentages.bottom * height,
          left: percentages.left * width
        };
      }
    }),

    /**
      Height/width/position to use in layout calculations
      (Override for more specific sizing in layout calculations)

      - skip_layout: Skip component during layout calculations and positioning
      - prepareLayout: perform any layout preparation required (default is draw)
      - getLayout: return position, width, and height for layout
      - setLayout: use x, y, and options {height, width} for layout
    */
    skip_layout: false,

    prepareLayout: function(data) {
      // Note: By default, components are double-drawn
      //       this may cause issues with transitions
      //       override prepareLayout to adjust this behavior
      this.draw(data);
    },

    getLayout: function(data) {
      this.prepareLayout(data);
      
      var margins = this.margins();
      return {
        position: this.position(),
        width: this.width() + margins.left + margins.right,
        height: this.height() + margins.top + margins.bottom
      };
    },

    /**
      Set layout of underlying base
      (Override for elements placed within chart)
    */
    setLayout: function(x, y, options) {
      // TODO margins depends on height/width
      //      -> setting them changes margins and would change layout calcs
      //      => switch to pixel margins to match rest of d3.chart.multi
      var margins = this.margins();
      this.base.attr('transform', helpers.translate(x + margins.left, y + margins.top));
      this.height(options && options.height);
      this.width(options && options.width);
    }
  }, {
    z_index: 50
  });

})(d3, d3.chart.helpers);

(function(d3, helpers) {
  var utils = helpers.utils;
  var property = helpers.property;

  /**
    Multi chart

    Configure chart based on given options, including adding charts, axes, legend, and other properties

    @example
    ```javascript
    var chart = d3.select('#chart')
      .append('svg')
      .chart('Multi', function(data) {
        // Process data...
        var participation = data...;
        var results = data...;
        var scales = {
          x: {data: results or participation or join..., key: 'x'},
          y: {data: participation, key: 'y'},
          secondaryY: {data: results, key: 'y'}
        };

        return d3.chart.xy({
          charts: {
            participation: {type: 'Bars', data: participation, xScale: scales.x, yScale: scales.y, itemPadding: 20},
            results: {type: 'Line', data: results, xScale: scales.x, yScale: scales.secondaryY, labels: {position: 'top'}}
          },
          axes: {
            x: {scale: scales.x}
            y: {scale: scales.y},
            secondaryY: {scale: scales.secondaryY}
          },
          legend: true,
          title: 'd3.chart.multi'
        });
      })
    ```

    @param {Function|Object} options
  */
  d3.chart('Base').extend('Multi', {
    initialize: function(options) {
      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      };

      if (options)
        this.options(options);

      this.base.classed('chart-multi', true);
      this.attachHoverListeners();
    },

    options: property('options', {
      default_value: function(data) { return {}; },
      type: 'Function',
      set: function(options) {
        this._config = null;

        // If options is plain object,
        // return from generic options function
        if (!utils.isFunction(options)) {
          return {
            override: function(data) {
              return options;
            }
          };
        }
      }
    }),

    /**
      Store raw data for container before it has been transformed

      @param {Object|Array} value
    */
    rawData: property('rawData'),

    /**
      Margins between edge of container and components/chart

      @param {Object} value {top, right, bottom, left}
    */
    margins: property('margins', {
      default_value: {top: 0, right: 0, bottom: 0, left: 0},
      set: function(values) {
        return {
          override: utils.defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0})
        };
      }
    }),

    /**
      Chart position (generally used internally)

      @param {Object} value {top, right, bottom, left}
    */
    chartPosition: property('chartPosition', {
      default_value: {top: 0, right: 0, bottom: 0, left: 0},
      set: function(values) {
        return {
          override: utils.defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0})
        };
      },
      get: function(values) {
        values.width = this._width() - values.right - values.left;
        values.height = this._height() - values.bottom - values.top;

        return values;
      }
    }),

    /**
      Get/set overall width/height of Container
    */
    width: property('width'),
    height: property('height'),

    _width: function() {
      var width = this.width();
      return width != null ? width : d3.chart('Base').prototype.width.call(this);
    },
    _height: function() {
      var height = this.height();
      return height != null ? height : d3.chart('Base').prototype.height.call(this);
    },

    charts: property('charts', {
      set: function(chart_options, charts) {
        chart_options = chart_options || {};
        charts = charts || {};
        
        // Remove charts that are no longer needed
        var remove_ids = utils.difference(utils.keys(charts), utils.keys(chart_options));
        utils.each(remove_ids, function(remove_id) {
          this.detach(remove_id, charts[remove_id]);
          delete charts[remove_id];
        }, this);

        // Create or update charts
        utils.each(chart_options, function(options, id) {
          var chart = charts[id];

          if (options instanceof d3.chart()) {
            // If chart instance, replace with instance
            if (chart)
              this.detach(id, chart);

            this.attach(id, options);
            charts[id] = options;
          }
          else {
            if (chart && chart.type != options.type) {
              // If chart type has changed, detach and re-create
              this.detach(id, chart);
              chart = undefined;
            }

            if (!chart) {
              var Chart = d3.chart(options.type);
              
              if (!Chart)
                throw new Error('No registered d3.chart found for ' + options.type);

              var base = this.chartLayer();

              chart = new Chart(base, options);
              chart.type = options.type;

              this.attach(id, chart);
              charts[id] = chart;
            }
            else {
              chart.options(options);
            }
          }
        }, this);

        // Store actual charts rather than options
        return {
          override: charts
        };
      },
      default_value: {}
    }),

    components: property('components', {
      set: function(component_options, components) {
        component_options = component_options || {};
        components = components || {};

        // Remove components that are no longer needed
        var remove_ids = utils.difference(utils.keys(components), utils.keys(component_options));
        utils.each(remove_ids, function(remove_id) {
          this.detach(remove_id, components[remove_id]);
          delete components[remove_id];
        }, this);

        // Create or update components
        utils.each(component_options, function(options, id) {
          var component = components[id];

          if (options instanceof d3.chart()) {
            // If component instance, replace with component
            if (component)
              this.detach(id, component);

            this.attach(id, options);
            components[id] = options;
          }
          else {
            // If component type has changed, detach and recreate
            if (component && component.type != options.type) {
              this.detach(id, component);
              component = undefined;
            }

            if (!component) {
              var Component = d3.chart(options.type);

              if (!Component)
                throw new Error('No registered d3.chart found for ' + options.type);

              var layer_options = {z_index: Component.z_index};
              var base = Component.layer_type == 'chart' ? this.chartLayer(layer_options) : this.componentLayer(layer_options);

              component = new Component(base, options);
              component.type = options.type;

              this.attach(id, component);
              components[id] = component;
            }
            else {
              component.options(options);
            }
          }

          
        }, this);

        // Store actual components rather than options
        return {
          override: components
        };
      },
      default_value: {}
    }),
  
    draw: function(data) {
      if (!this._config) {
        data = data.original || data;
        this._config = this._prepareConfig(data);

        // Set charts and components from config
        utils.each(this._config, function(value, key) {
          if (this[key] && this[key].is_property && this[key].set_from_options)
            this[key](value);
        }, this);
      }

      // Add config data
      data = {
        original: data,
        config: this._config.data
      };

      // Explicitly set width and height of container if width/height is defined
      this.base
        .attr('width', this.width() || null)
        .attr('height', this.height() || null);

      // Layout components
      this.layout(data);

      // Full draw now that everything has been laid out
      d3.chart().prototype.draw.call(this, data);
    },

    redraw: function() {
      if (this.rawData())
        this.draw(this.rawData().original);
    },

    demux: function(name, data) {
      if (!data || !data.config || !data.original)
        return data;

      if (this.charts()[name] && data.config.charts[name])
        return data.config.charts[name];
      else if (this.components()[name] && data.config.components[name])
        return data.config.components[name];
      else
        return data.original;
    },

    /**
      Get chart layer (for laying out with charts)

      @param {Object} options
      - z_index
    */
    chartLayer: function(options) {
      options = utils.defaults({}, options, {
        z_index: d3.chart('Chart').z_index
      });

      return this.base.append('g')
        .attr('class', 'chart-layer')
        .attr('data-zIndex', options.z_index);
    },

    /**
      Get component layer

      @param {Object} options
      - z_index
    */
    componentLayer: function(options) {
      options = utils.defaults({}, options, {
        z_index: d3.chart('Component').z_index
      });

      return this.base.append('g')
        .attr('class', 'chart-component-layer')
        .attr('data-zIndex', options.z_index);
    },

    /**
      Layout components and charts
    */
    layout: function(data) {
      // 1. Place chart layers
      this._positionChartLayers();

      // 2. Extract layout from components
      var layout = this._extractLayout(data);

      // 3. Set chart position from layout
      var chart_position = utils.extend({}, this.margins());
      utils.each(layout, function(parts, key) {
        utils.each(parts, function(part) {
          chart_position[key] += part.offset || 0;
        });
      });
      this.chartPosition(chart_position);

      // 4. Position layers with layout
      this._positionLayers(layout);
    },

    attachHoverListeners: function() {
      var trigger = this.trigger.bind(this);
      var chartPosition = this.chartPosition.bind(this);
      var inside, chart_position;
      
      var throttledMouseMove = utils.throttle(function(coordinates) {
        if (inside)
          trigger('move:mouse', coordinates);
      }, 50);

      this.base.on('mouseenter', function() {
        inside = true;
        chart_position = chartPosition();
        trigger('enter:mouse', translateToXY(d3.mouse(this), chart_position));
      });
      this.base.on('mousemove', function() {
        throttledMouseMove(translateToXY(d3.mouse(this), chart_position));
      });
      this.base.on('mouseleave', function() {
        inside = false;
        trigger('leave:mouse');
      });

      function translateToXY(coordinates, chart_position) {
        var x = coordinates[0];
        var y = coordinates[1];
        var chart_x = x - chart_position.left;
        var chart_y = y - chart_position.top;
        
        // Set at chart bounds if outside of chart
        if (x > (chart_position.left + chart_position.width))
          chart_x = chart_position.left + chart_position.width;
        else if (x < chart_position.left)
          chart_x = 0;

        if (y > (chart_position.top + chart_position.height))
          chart_y = chart_position.top + chart_position.height;
        else if (y < chart_position.top)
          chart_y = 0;

        return {
          container: {x: x, y: y},
          chart: {x: chart_x, y: chart_y}
        };
      }
    },

    _prepareConfig: function(data) {
      // Load config from options fn
      var config = this.options()(data);

      config = utils.defaults({}, config, {
        charts: {},
        components: {}
      });

      config.data = {
        charts: {},
        components: {}
      };

      utils.each(config.charts, function(options, id) {
        if (options.data) {
          // Store data for draw later
          config.data.charts[id] = options.data;

          // Remove data from options
          options = utils.clone(options);
          delete options.data;
          config.charts[id] = options;
        }
      });

      utils.each(config.components, function(options, id) {
        if (options.data) {
          // Store data for draw later
          config.data.components[id] = options.data;

          // Remove data from options
          options = utils.clone(options);
          delete options.data;
          config.components[id] = options;
        }
      });

      return config;
    },

    attach: function(id, item) {
      item.id = id;
      item.base.attr('data-id', id);
      item.container = this;

      d3.chart('Base').prototype.attach.call(this, id, item);

      if (item && utils.isFunction(item.trigger))
        item.trigger('attach');
    },

    detach: function(id, item) {
      item.base.remove();

      delete this._attached[id];

      if (item && utils.isFunction(item.trigger))
        item.trigger('detach');
    },

    _positionLayers: function(layout) {
      this._positionChartLayers();
      this._positionComponents(layout);
      this._positionByZIndex();      
    },

    _positionChartLayers: function() {
      var position = this.chartPosition();
      
      this.base.selectAll('.chart-layer')
        .attr('transform', helpers.translate(position.left, position.top))
        .attr('width', position.width)
        .attr('height', position.height);
    },

    _positionComponents: function(layout) {
      var chart = this.chartPosition();
      var width = this._width();
      var height = this._height();
      
      utils.reduce(layout.top, function(previous, part, index, parts) {
        var y = previous - part.offset;
        setLayout(part.component, chart.left, y, {width: chart.width});
        
        return y;
      }, chart.top);

      utils.reduce(layout.right, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var x = previous + previousPart.offset;
        setLayout(part.component, x, chart.top, {height: chart.height});

        return x;
      }, width - chart.right);

      utils.reduce(layout.bottom, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var y = previous + previousPart.offset;
        setLayout(part.component, chart.left, y, {width: chart.width});

        return y;
      }, height - chart.bottom);

      utils.reduce(layout.left, function(previous, part, index, parts) {
        var x = previous - part.offset;
        setLayout(part.component, x, chart.top, {height: chart.height});

        return x;
      }, chart.left);

      function setLayout(component, x, y, options) {
        if (component && utils.isFunction(component.setLayout))
          component.setLayout(x, y, options);
      }
    },

    _positionByZIndex: function() {
      // Get layers
      var elements = this.base.selectAll('.chart-layer, .chart-component-layer')[0];

      // Sort by z-index
      elements = utils.sortBy(elements, function(element) {
        return parseInt(d3.select(element).attr('data-zIndex')) || 0;
      });

      // Move layers to z-index order
      utils.each(elements, function(element) {
        element.parentNode.appendChild(element);
      }, this);
    },

    // Extract layout from components
    _extractLayout: function(data) {
      var overall_layout = {top: [], right: [], bottom: [], left: []};
      utils.each(this.components(), function(component, id) {
        if (component.skip_layout)
          return;

        var layout = component.getLayout(this.demux(id, data));
        var position = layout && layout.position;

        if (!utils.contains(['top', 'right', 'bottom', 'left'], position))
          return;

        overall_layout[position].push({
          offset: position == 'top' || position == 'bottom' ? layout.height : layout.width,
          component: component
        });
      }, this);
      
      return overall_layout;
    }
  });

})(d3, d3.chart.helpers);

(function(d3, helpers) {
  var property = helpers.property;
  var valueOrDefault = helpers.valueOrDefault;
  var di = helpers.di;

  /**
    mixins for handling series data
  */
  var Series = {
    seriesKey: di(function(chart, d, i) {
      return d.key;
    }),
    seriesValues: di(function(chart, d, i) {
      // Store seriesIndex on series
      d.seriesIndex = i;
      return d.values;
    }),
    seriesClass: di(function(chart, d, i) {
      return 'chart-series chart-index-' + i + (d['class'] ? ' ' + d['class'] : '');
    }),
    seriesIndex: di(function(chart, d, i) {
      var series = chart.seriesData.call(this, d, i);
      return series && series.seriesIndex || 0;
    }),
    seriesCount: di(function(chart, d, i) {
      return chart.data() ? chart.data().length : 1;
    }),
    seriesData: di(function(chart, d, i) {
      return helpers.getParentData(this);
    }),
    itemStyle: di(function(chart, d, i) {
      // Get style for data item in the following progression
      // data.style -> series.style -> chart.style
      var series = chart.seriesData.call(this, d, i) || {};
      var styles = utils.defaults({}, d.style, series.style, chart.options().style);
      
      return helpers.style(styles) || null;
    }),

    /**
      seriesLayer

      extension of layer()
      - updates dataBind method to access underlying series values
      - handles appending series groups to chart
      -> should be used just like layer() would be used without series
      
      @param {String} name
      @param {Selection} selection
      @param {Object} options (`dataBind` and `insert` required)
    */
    seriesLayer: function(name, selection, options) {
      if (options && options.dataBind) {
        var dataBind = options.dataBind;

        options.dataBind = function(data) {
          var chart = this.chart();
          var series = this.selectAll('g')
            .data(data, chart.seriesKey);

          series.enter()
            .append('g')
            .attr('class', chart.seriesClass);
          
          series.exit()
            .remove();
          
          series.chart = function() { return chart; };

          return dataBind.call(series, chart.seriesValues);
        };
      }
      
      return d3.chart().prototype.layer.call(this, name, selection, options);
    }
  };

  /**
    mixins for handling XY data

    Properties:
    - xKey {String}
    - yKey {String}
    - xScale {Object|d3.scale}
    - yScale {Object|d3.scale}
    - xMin {Number}
    - xMax {Number}
    - yMin {Number}
    - yMax {Number}
  */
  var XY = {
    initialize: function() {
      // Set scale ranges once chart is ready to be rendered
      this.on('before:draw', this.setScales.bind(this));
    },

    xKey: property('xKey', {default_value: 'x'}),
    yKey: property('yKey', {default_value: 'y'}),

    xScale: property('xScale', {
      type: 'Function',
      set: function(value) {
        var scale = helpers.createScale(value);
        this.setXScaleRange(scale);

        return {
          override: scale
        };
      },
      get: function(scale) {
        if (!scale) {
          scale = this.getDefaultXScale();
          this.setXScaleRange(scale);
        }

        return scale;
      }
    }),
    yScale: property('yScale', {
      type: 'Function',
      set: function(value) {
        var scale = helpers.createScale(value);
        this.setYScaleRange(scale);

        return {
          override: scale
        };
      },
      get: function(scale) {
        if (!scale) {
          scale = this.getDefaultYScale();
          this.setYScaleRange(scale);
        }
 
        return scale;
      }
    }),

    xMin: property('xMin', {
      get: function(value) {
        var min = helpers.min(this.data(), this.xValue);

        // Default behavior: if min is less than zero, use min, otherwise use 0
        return parseFloat(valueOrDefault(value, (min < 0 ? min : 0)));
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        var max = helpers.max(this.data(), this.xValue);
        return parseFloat(valueOrDefault(value, max));
      }
    }),
    yMin: property('yMin', {
      get: function(value) {
        var min = helpers.min(this.data(), this.yValue);

        // Default behavior: if min is less than zero, use min, otherwise use 0
        return parseFloat(valueOrDefault(value, (min < 0 ? min : 0)));
      }
    }),
    yMax: property('yMax', {
      get: function(value) {
        var max = helpers.max(this.data(), this.yValue);
        return parseFloat(valueOrDefault(value, max));
      }
    }),

    x: di(function(chart, d, i) {
      return parseFloat(chart.xScale()(chart.xValue.call(this, d, i)));
    }),
    y: di(function(chart, d, i) {
      return parseFloat(chart.yScale()(chart.yValue.call(this, d, i)));
    }),
    x0: di(function(chart, d, i) {
      return parseFloat(chart.xScale()(0));
    }),
    y0: di(function(chart, d, i) {
      return parseFloat(chart.yScale()(0));
    }),

    xValue: di(function(chart, d, i) {
      return d[chart.xKey()];
    }),
    yValue: di(function(chart, d, i) {
      return d[chart.yKey()];
    }),
    keyValue: di(function(chart, d, i) {
      return !utils.isUndefined(d.key) ? d.key : chart.xValue.call(this, d, i);
    }),

    setScales: function() {
      this.setXScaleRange(this.xScale());
      this.setYScaleRange(this.yScale());
    },

    setXScaleRange: function(x_scale) {
      x_scale.range([0, this.width()]);
    },
    setYScaleRange: function(y_scale) {
      y_scale.range([this.height(), 0]);
    },

    getDefaultXScale: function() {
      return helpers.createScale({
        data: this.data(),
        key: this.xKey()
      });
    },
    getDefaultYScale: function() {
      return helpers.createScale({
        data: this.data(),
        key: this.yKey()
      });
    }
  };

  /**
    mixins for charts of centered key,value data (x: index, y: value, key)
  
    Properties:
    - [itemPadding = 0.1] {Number} % padding between each item (for ValuesSeries, padding is just around group, not individual series items)
    Dependencies: XY
  */
  var XYValues = utils.extend({}, XY, {
    transform: function(data) {
      // Transform series data from values to x,y
      if (helpers.isSeriesData(data)) {
        utils.each(data, function(series) {
          series.values = utils.map(series.values, normalizeData);
        }, this);
      }
      else {
        data = utils.map(data, normalizeData);
      }

      return data;

      function normalizeData(point, index) {
        point = utils.isObject(point) ? point : {y: point};
        point.x = valueOrDefault(point.x, point.key);

        return point;
      }
    },

    // Define % padding between each item
    // (If series is displayed adjacent, padding is just around group, not individual series)
    itemPadding: property('itemPadding', {default_value: 0.1}),

    // If series data, display points at same index for different series adjacent
    displayAdjacent: property('displayAdjacent', {default_value: false}),

    // determine centered-x based on series display type (adjacent or layered)
    x: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentX.call(this, d, i) : chart.layeredX.call(this, d, i);
    }),

    // AdjacentX/Width is used in cases where series are presented next to each other at each value
    adjacentX: di(function(chart, d, i) {
      var adjacent_width = chart.adjacentWidth.call(this, d, i);
      var left = chart.layeredX.call(this, d, i) - chart.layeredWidth.call(this, d, i) / 2 + adjacent_width / 2;
      var series_index = chart.seriesIndex ? chart.seriesIndex.call(this, d, i) : 1;
      
      return left + adjacent_width * series_index;
    }),
    adjacentWidth: di(function(chart, d, i) {
      var series_count = chart.seriesCount ? chart.seriesCount.call(this) : 1;

      if (series_count > 0)
        return chart.layeredWidth.call(this, d, i) / series_count;
      else
        return 0;
    }),

    // LayeredX/Width is used in cases where sereis are presented on top of each other at each value
    layeredX: di(function(chart, d, i) {
      return chart.xScale()(chart.xValue.call(this, d, i)) + 0.5 * chart.layeredWidth.call(this) || 0;
    }),
    layeredWidth: di(function(chart, d, i) {
      var range_band = chart.xScale().rangeBand();
      return isFinite(range_band) ? range_band : 0;
    }),

    // determine item width based on series display type (adjacent or layered)
    itemWidth: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentWidth.call(this, d, i) : chart.layeredWidth.call(this, d, i);
    }),

    setXScaleRange: function(x_scale) {
      if (utils.isFunction(x_scale.rangeBands)) {
        x_scale.rangeBands(
          [0, this.width()], 
          this.itemPadding(), 
          this.itemPadding() / 2
        );
      }
      else {
        XY.setXScaleRange.call(this, x_scale);
      }
    },

    getDefaultXScale: function() {
      return helpers.createScale({
        type: 'ordinal',
        data: this.data(),
        key: this.xKey()
      });
    }
  });

  /**
    mixin for handling labels in charts
  
    - attachLabels: call during chart initialization to add labels to chart
    - labels: properties passed directly to labels chart
  */
  var XYLabels = {
    attachLabels: function() {
      var options = this.labels();
      options.parent = this;

      var Labels = d3.chart(options.type);
      var base = this.base.append('g').attr('class', 'chart-labels');
      var labels = this._labels = new Labels(base, options);

      // Proxy x and y to parent chart
      labels.x = this.x;
      labels.y = this.y;

      this.on('draw', function(data) {
        labels.options(this.labels());
        labels.draw(options.data || data);
      }.bind(this));
    },

    labels: property('labels', {
      get: function(value) {
        if (utils.isBoolean(value))
          value = {display: value};

        return utils.defaults({}, value, {
          display: false,
          type: 'XYLabels'
        });
      }
    })
  };

  var Hover = {
    initialize: function() {
      this.on('attach', function() {
        if (this.container) {
          this.container.on('enter:mouse', this.onMouseEnter.bind(this));
          this.container.on('move:mouse', this.onMouseMove.bind(this));
          this.container.on('leave:mouse', this.onMouseLeave.bind(this));
        }
      }.bind(this));
    },

    // Override with hover implementation
    onMouseEnter: function(position) {},
    onMouseMove: function(position) {},
    onMouseLeave: function() {}
  };

  var XYHover = utils.extend({}, Hover, {
    initialize: function() {
      Hover.initialize.apply(this, arguments);
      this.on('before:draw', function() {
        // Reset points on draw
        this._points = undefined;
      });
    },

    getPoint: di(function(chart, d, i, j) {
      return {
        x: chart.x.call(this, d, i, j),
        y: chart.y.call(this, d, i, j),
        d: d, i: i, j: j
      };
    }),

    getPoints: function() {
      var data = this.data();
      if (!this._points && data) {
        if (helpers.isSeriesData(data)) {
          // Get all points for each series
          this._points = utils.map(data, function(series, j) {
            return getPointsForValues.call(this, series.values, j, {_parent_data: series});
          }, this);
        }
        else {
          this._points = getPointsForValues.call(this, data, 0);
        }
      }

      return this._points;

      function getPointsForValues(values, seriesIndex, element) {
        var points = utils.map(values, function(d, i) {
          return this.getPoint.call(element, d, i, seriesIndex);
        }, this);

        // Sort by x
        points.sort(function(a, b) {
          return a.x - b.x;
        });

        return points;
      }
    },

    getClosestPoints: function(position) {
      var points = this.getPoints();
      var closest = [];

      if (points.length && utils.isArray(points[0])) {
        // Series data
        utils.each(points, function(series) {
          closest.push(sortByDistance(series, position));
        });
      }
      else {
        closest.push(sortByDistance(points, position));
      }
      
      return closest;

      function sortByDistance(values, position) {
        var byDistance = utils.map(values, function(point) {
          point.distance = getDistance(point, position);
          return point;
        });

        return utils.sortBy(byDistance, 'distance'); 
      }

      function getDistance(a, b) {
        return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
      }
    }    
  });

  // Expose mixins
  d3.chart.mixins = utils.extend(d3.chart.mixins || {}, {
    Series: Series,
    XY: XY,
    XYValues: XYValues,
    XYLabels: XYLabels,
    Hover: Hover,
    XYHover: XYHover
  });

})(d3, d3.chart.helpers);
