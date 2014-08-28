/*! d3.chart.multi - v0.7.3
 * https://github.com/CSNW/d3.chart.multi
 * License: MIT
 */
(function(d3, _) {

  /**
    Setup global z-index values
  */
  var zIndex = {
    component: 50,
    axis: 51,
    title: 52,
    chart: 100,
    // labels: 150,
    legend: 200
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
      defaultValue: 'Howdy!'
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

    // Extensions:
    obj.advanced = property('advanced', {type: 'Object'})
    obj.advanced({a: 1, b: 2});
    obj.advanced.extend({b: 'two', c: 'three'});
    console.log(obj.advanced()); // -> {a: 1, b: 'two', c: 'three'}
    ```

    @param {String} name of stored property
    @param {Object} options
    - defaultValue: default value for property (when set value is undefined)
    - get: function(value) {return ...} getter, where value is the stored value, return desired value
    - set: function(value, previous) {return {override, after}} 
      - return override to set stored value and after() to run after set
    - type: {String} ['Function']
      - 'Object' gets object extensions: extend({...})
      - 'Array' gets array extensions: push(...)
      - 'Function' don't evaluate in get/set
    - context: {Object} [this] context to evaluate get/set/after functions
    - propKey: {String} ['__properties'] underlying key on object to store properties on

    @return {Function}
    - (): get
    - (value): set
    - (value, setOptions): set with options (silent: [false] for change notifications)
  */ 
  function property(name, options) {
    options = options || {};
    var propKey = options.propKey || '__properties';

    var getSet = function(value, setOptions) {
      setOptions = setOptions || {};
      var properties = this[propKey] = this[propKey] || {};
      var existing = properties[name];
      var context = !_.isUndefined(getSet.context) ? getSet.context : this;
      
      if (!arguments.length)
        return get.call(this);
      else
        return set.call(this);

      function get() {
        value = !_.isUndefined(existing) ? existing : getSet.defaultValue;

        // Unwrap value if its type is not a function
        if (_.isFunction(value) && options.type != 'Function')
          value = value.call(this);

        return _.isFunction(options.get) ? options.get.call(context, value) : value;
      }

      function set() {
        var changed;

        // Validate
        if (_.isFunction(options.validate) && !options.validate.call(this, value)) {
          if (_.isFunction(this.trigger)) {
            this.trigger('invalid:' + name, value);
            this.trigger('invalid', name, value);
          }

          // Assumption: Previous value already had set called, so don't call set for previous value
          //             Default value has not had set called, so call set for default value
          //             Neither previous nor default, don't set value and don't call set
          if (!_.isUndefined(existing)) {
            properties[name] = existing;
            return this;
          }
          else if (!_.isUndefined(getSet.defaultValue)) {
            value = getSet.defaultValue;
          }
          else {
            return this;
          }
        }

        properties[name] = value;

        if (_.isFunction(options.set)) {
          var response = options.set.call(context, value, existing, setOptions);
          
          if (response && _.has(response, 'override'))
            properties[name] = response.override;
          if (response && _.isFunction(response.after))
            response.after.call(context, properties[name]);
          if (response && _.has(response, 'changed'))
            changed = response.changed;
        }

        if (_.isUndefined(changed))
          changed = !_.isEqual(properties[name], existing);

        if (changed && _.isFunction(this.trigger) && !setOptions.silent) {
          this.trigger('change:' + name, properties[name]);
          this.trigger('change', name, properties[name]);
        }

        return this;
      }
    };

    // For checking if function is a property
    getSet.isProperty = true;
    getSet.setFromOptions = valueOrDefault(options.setFromOptions, true);
    getSet.defaultValue = options.defaultValue;
    getSet.context = options.context;

    return getSet;
  }

  /**
    Property extensions
    Helpers for doing "native" operations on properties

    @example
    ```js
    var instance = {};
    instance.options = property('optionsProperty', {});
    instance.options({a: 1, b: 2});

    property.extend(instance, 'options', {b: 'two', c: 'three'});
    console.log(instance.options()); // -> {a: 1, b: 'two', c: 'three'}
    ```

    Object:
    - Extend

    Array:
    - Push
  */
  // Object extensions: extend
  _.each([
    'extend'
  ], function(options) {
    var name = _.isObject(options) ? options.name : options;
    var set = (options && options.set) || 'cloned';
    var method = _[name];

    property[name] = function(parent, key) {
      if (!parent[key] || !method) return;

      var args = _.toArray(arguments).slice(2);
      var cloned = _.clone(parent[key]());
      args.unshift(cloned);
      var result = method.apply(_, args);

      // Set either result or cloned back to property
      parent[key](set == 'result' ? result : cloned);

      return result;
    };
  });

  // Array extensions: push, concat
  _.each([
    'push',
    'pop',
    {name: 'concat', set: 'result'},
    'splice',
    'shift',
    'unshift',
    'reverse',
    'sort'
  ], function(options) {
    var name = _.isObject(options) ? options.name : options;
    var set = (options && options.set) || 'cloned';
    var method = Array.prototype[name];

    property[name] = function(parent, key) {
      if (!parent[key] || !method) return;

      var args = _.toArray(arguments).slice(2);
      var cloned = _.toArray(parent[key]());
      var result = method.apply(cloned, args);

      // Set either result or cloned back to property
      parent[key](set == 'result' ? result : cloned);

      return result;
    };
  });

  /**
    If value isn't undefined, return value, otherwise use defaultValue
  
    @param {Varies} [value]
    @param {Varies} defaultValue
    @return {Varies}
  */
  function valueOrDefault(value, defaultValue) {
    return !_.isUndefined(value) ? value : defaultValue;
  }

  /**
    Dimensions
    Helper for robustly determining width/height of given selector

    @param {d3 Selection} selection
    @return {Object} {width, height}
  */
  function dimensions(selection) {
    var element = selection && selection.length && selection[0] && selection[0].length && selection[0][0];
    var boundingBox = element && typeof element.getBBox == 'function' && element.getBBox() || {width: 0, height: 0};
    var isSVG = element ? element.nodeName == 'svg' : false;

    var clientDimensions = {
      width: (element && element.clientWidth) || 0, 
      height: (element && element.clientHeight) || 0
    };

    // Issue: Firefox does not correctly calculate clientWidth/clientHeight for svg
    //        calculate from css
    //        http://stackoverflow.com/questions/13122790/how-to-get-svg-element-dimensions-in-firefox
    //        Note: This makes assumptions about the box model in use and that width/height are not percent values
    if (element && isSVG && (!element.clientWidth || !element.clientHeight) && window && window.getComputedStyle) {
      var styles = window.getComputedStyle(element);
      clientDimensions.height = parseFloat(styles['height']) - parseFloat(styles['borderTopWidth']) - parseFloat(styles['borderBottomWidth']);
      clientDimensions.width = parseFloat(styles['width']) - parseFloat(styles['borderLeftWidth']) - parseFloat(styles['borderRightWidth']);
    }

    var attrDimensions = {width: 0, height: 0};
    if (selection) {
      attrDimensions = {
        width: selection.attr('width') || 0,
        height: selection.attr('height') || 0
      };
    }

    // Size set by css -> client (only valid for svg and some other elements)
    // Size set by svg -> attr override or boundingBox
    // -> Take maximum
    return {
      width: _.max([clientDimensions.width, attrDimensions.width || boundingBox.width]) || 0,
      height: _.max([clientDimensions.height, attrDimensions.height || boundingBox.height]) || 0
    };
  }

  // Set of helpers for creating transforms
  var transform = {
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
    translate: function translate(x, y) {
      if (_.isObject(x)) {
        y = x.y;
        x = x.x;
      }
        
      return 'translate(' + (x || 0) + ', ' + (y || 0) + ')';
    },

    /**
      Rotate by degrees, with optional center

      @param {Number} degrees
      @param {Object} [center = {x: 0, y: 0}]
      @return {String}
    */
    rotate: function rotate(degrees, center) {
      var rotation = 'rotate(' + (degrees || 0);
      if (center)
        rotation += ' ' + (center.x || 0) + ',' + (center.y || 0);

      return rotation += ')';
    }
  };

  /**
    Create scale from options
    
    @example
    ```javascript
    // Simple type, range, and domain
    var scale = createScaleFromOptions({
      type: 'linear', 
      domain: [0, 100], 
      range: [0, 500]
    });

    // Scale is passed through
    var original = d3.scale.linear();
    var scale = createScaleFromOptions(original);
    scale === original;

    // Set other properties by passing in "arguments" array
    var scale = createScaleFromOptions({
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
  function createScaleFromOptions(options) {
    options = options || {};

    // If function, scale was passed in as options
    if (_.isFunction(options))
      return options;

    // Create scale (using d3.time.scale() if type is 'time')
    var scale;
    if (options.type && options.type == 'time')
      scale = d3.time.scale();
    else if (options.type && d3.scale[options.type])
      scale = d3.scale[options.type]();
    else
      scale = d3.scale.linear();

    _.each(options, function(value, key) {
      if (scale[key]) {
        // If option is standard property (domain or range), pass in directly
        // otherwise, pass in as arguments
        // (don't pass through type)
        if (key == 'range' || key == 'domain')
          scale[key](value);
        else if (key != 'type')
          scale[key].apply(scale, value);  
      }
    });

    return scale;
  }

  /**
    Stack given array of elements using options

    @example
    this.call(helpers.stack)
    this.call(helpers.stack.bind(this, {direction: 'horizontal', origin: 'left'}))
  
    @param {Object} [options]
    - {String} [direction=vertical] vertical or horizontal
    - {String} [origin=top] top/bottom for vertical and left/right for horizontal
  */
  function stack(options, elements) {
    if (options && !elements) {
      elements = options;
      options = {
        direction: 'vertical',
        origin: 'top',
        padding: 0
      };
    }

    function padding(d, i) {
      return i > 0 && options.padding ? options.padding : 0;
    }

    if (elements && elements.attr) {
      var previous = 0;
      elements
        .attr('transform', function(d, i) {
          var dimensions = this.getBBox();
          var x = 0;
          var y = 0;

          if (options.direction == 'horizontal') {
            if (!(options.origin == 'left' || options.origin == 'right'))
              options.origin = 'left';

            if (options.origin == 'left')
              x = previous + padding(d, i);
            else
              x = previous + dimensions.width + padding(d, i);

            previous = previous + dimensions.width + padding(d, i);
          }
          else {
            if (!(options.origin == 'top' || options.origin == 'bottom'))
              options.origin = 'top';

            if (options.origin == 'top')
              y = previous + padding(d, i);
            else
              y = previous + dimensions.height + padding(d, i);

            previous = previous + dimensions.height + padding(d, i);
          }

          return transform.translate(x, y);
        });
    }
  }

  /**
    Convert key,values to style string

    @example
    style({color: 'red', display: 'block'}) -> color: red; display: block;

    @param {Object} styles
    @return {String}
  */
  function style(styles) {
    if (!styles) return '';

    styles = _.map(styles, function(value, key) {
      return key + ': ' + value;
    });
    styles = styles.join('; ');

    return styles ? styles + ';' : '';
  }

  /**
    Get value for key(s) from search objects
    searching from first to last keys and objects
    
    @example
    ```javascript
    var obj1 = {a: 'b', c: 'd'};
    var obj2 = {c: 4, e: 6};

    getValue('c', obj1) == 'd'
    getValue(['a', 'b'], obj1, obj2) == 'b'
    getValue(['b', 'c'], obj1, obj2) == 'd'
    getValue(['e', 'f'], obj1, obj2) == 6
    getValue(['y', 'z'], obj1, obj2) === undefined
    ```

    @param {String or Array} key
    @param {Objects...}
    @return {Varies}
  */
  function getValue(key, objects) {
    var keys = _.isArray(key) ? key : [key];
    objects = _.toArray(arguments).slice(1);

    var value;
    _.find(objects, function(object) {
      return _.isObject(object) && _.find(keys, function(key) {
        value = object[key];
        return !_.isUndefined(value);
      });
    });

    return value;
  }

  /**
    Capitalize first letter in string

    @param {String} string
    @return {String}
  */
  function capitalize(string) {
    if (!string || !_.isFunction(string.charAt) || !_.isFunction(string.slice)) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
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
    wrapped._isDi = true;
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
      if (chart[key] && chart[key]._isDi)
        chart[key] = bindDi(chart[key], chart);
    }
  }

  /**
    Logging helpers
  */
  var log = function log() {
    if (log.enable) {
      var args = _.toArray(arguments);
      args.unshift('d3.chart.multi:');
      console.log.apply(console, args);
    }
  };
  log.enable = false;
  log.time = function(id) {
    if (log.enable && _.isFunction(console.time))
      console.time('d3.chart.multi: ' + id);
  };
  log.timeEnd = function(id) {
    if (log.enable && _.isFunction(console.timeEnd))
      console.timeEnd('d3.chart.multi: ' + id);
  };


  /**
    Get parent data for element

    @param {Element} element
    @return {Varies}
  */
  function getParentData(element) {
    // @internal Shortcut if element + parentData needs to be mocked
    if (element._parentData)
      return element._parentData;

    var parent = element && element.parentNode;
    if (parent) {
      var data = d3.select(parent).data();
      return data && data[0];
    }
  }

  /**
    Resolve chart by type, component, and chart type

    What to look for:
    1. chart type + container type (e.g. Line + Values = LineValues)
    2. chart type
    3. component type + container type (e.g. Axis + Values = AxisValues)
    4. component type + chart type (e.g. Axis + '' = Axis)
    5. chart type + component type (e.g. Inset + Legend = InsetLegend) 
    6. component type (e.g. '', Labels, XY = Labels)

    @param {String} chartType type of chart
    @param {String} componentType type of component
    @param {String} containerType type of container
    @return {d3.chart}
  */
  function resolveChart(chartType, componentType, containerType) {
    chartType = chartType || '';
    componentType = componentType || '';
    containerType = containerType || '';

    var Chart = d3.chart(chartType + containerType) || 
      d3.chart(chartType) || 
      d3.chart(componentType + containerType) ||
      d3.chart(componentType + chartType) || 
      d3.chart(chartType + componentType) ||
      d3.chart(componentType);

    if (!Chart)
      throw new Error('d3.chart.multi: Unable to resolve chart for type ' + chartType + ' and component ' + componentType + ' and container ' + containerType);

    return Chart;
  }

  /**
    Mixin extensions into prototype

    Designed specifically to work with d3-chart
    - transform is called from last to first
    - initialize is called from first to last
    - remaining are overriden from first to last  

    @param {Array or Object...} extensions Array of extensions or separate extension arguments
    @return {Object}
  */
  function mixin(extensions) {
    extensions = _.isArray(extensions) ? extensions : _.toArray(arguments);
    var mixed = _.extend.apply(this, [{}].concat(extensions));

    // Don't mixin constructor with prototype
    delete mixed.constructor;

    if (mixed.initialize) {
      mixed.initialize = function initialize() {
        var args = _.toArray(arguments);

        _.each(extensions, function(extension) {
          if (extension.initialize)
            extension.initialize.apply(this, args);
        }, this);
      };
    }
    if (mixed.transform) {
      mixed.transform = function transform(data) {
        return _.reduceRight(extensions, function(data, extension) {
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
  d3.chart.helpers = _.extend({}, d3.chart.helpers, {
    zIndex: zIndex,
    property: property,
    valueOrDefault: valueOrDefault,
    dimensions: dimensions,
    transform: transform,
    translate: transform.translate,
    createScaleFromOptions: createScaleFromOptions,
    stack: stack,
    style: style,
    getValue: getValue,
    capitalize: capitalize,
    di: di,
    bindDi: bindDi,
    bindAllDi: bindAllDi,
    log: log,
    getParentData: getParentData,
    resolveChart: resolveChart,
    mixin: mixin
  });
})(d3, _);
(function(d3, _, helpers) {
  var property = helpers.property;
  var valueOrDefault = helpers.valueOrDefault;
  var di = helpers.di;

  /**
    Extensions for handling series data
  */
  var Series = {
    isSeries: true,

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
      var styles = _.defaults({}, d.style, series.style, chart.options().style);
      
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
          series.chart = function() { return chart; };

          return dataBind.call(series, chart.seriesValues);
        };
      }
      
      return d3.chart().prototype.layer.call(this, name, selection, options);
    }
  };

  /**
    Extensions for handling XY data

    Properties:
    - xScale {d3.scale}
    - yScale {d3.scale}
    - xMin {Number}
    - xMax {Number}
    - yMin {Number}
    - yMax {Number}
    - [invertedXY = false] {Boolean} invert x and y axes

    Notes:
      Inverted XY
      - (x, y) position is updated to properly place point in inverted space
      - To invert, change range for scale (from width to height or vice-versa) and swap x and y coordinates
  */
  var XY = {
    isXY: true,

    xScale: property('xScale', {type: 'Function', setFromOptions: false}),
    yScale: property('yScale', {type: 'Function', setFromOptions: false}),

    xMin: property('xMin', {
      get: function(value) {
        var min = this.data() && d3.extent(this.data(), this.xValue)[0];

        // Default behavior: if min is less than zero, use min, otherwise use 0
        return valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        var max = this.data() && d3.extent(this.data(), this.xValue)[1];
        return valueOrDefault(value, max);
      }
    }),
    yMin: property('yMin', {
      get: function(value) {
        var min = this.data() && d3.extent(this.data(), this.yValue)[0];

        // Default behavior: if min is less than zero, use min, otherwise use 0
        return valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    yMax: property('yMax', {
      get: function(value) {
        var max = this.data() && d3.extent(this.data(), this.yValue)[1];
        return valueOrDefault(value, max);
      }
    }),

    invertedXY: property('invertedXY', {
      defaultValue: false
    }),

    initialize: function() {
      this.on('change:data', this.setScales);
      this.on('change:options', createScalesFromOptions.bind(this));

      createScalesFromOptions.call(this);

      function createScalesFromOptions() {
        if (this.options().xScale)
          this.xScale(helpers.createScaleFromOptions(this.options().xScale));
        if (this.options().yScale)
          this.yScale(helpers.createScaleFromOptions(this.options().yScale));

        this.setScales(); 
      }
    },

    x: di(function(chart, d, i) {
      if (chart.invertedXY())
        return chart._yScale()(chart.yValue.call(this, d, i));
      else
        return chart._xScale()(chart.xValue.call(this, d, i));
    }),
    y: di(function(chart, d, i) {
      if (chart.invertedXY())
        return chart._xScale()(chart.xValue.call(this, d, i));
      else
        return chart._yScale()(chart.yValue.call(this, d, i));
    }),
    x0: di(function(chart, d, i) {
      if (chart.invertedXY())
        return chart._yScale()(0);
      else
        return chart._xScale()(0);
    }),
    y0: di(function(chart, d, i) {
      if (chart.invertedXY())
        return chart._xScale()(0);
      else
        return chart._yScale()(0);
    }),

    xValue: di(function(chart, d, i) {
      return d.x;
    }),
    yValue: di(function(chart, d, i) {
      return d.y;
    }),
    keyValue: di(function(chart, d, i) {
      return !_.isUndefined(d.key) ? d.key : chart.xValue.call(this, d, i) + ',' + chart.yValue.call(this, d, i);
    }),

    setScales: function() {
      var xScale = this.xScale();
      var yScale = this.yScale();

      // If no user-defined scales, create default and set domain
      if (!xScale)
        xScale = this.setXScaleDomain(this.defaultXScale(), this.data() || [], this);
      if (!yScale)
        yScale = this.setYScaleDomain(this.defaultYScale(), this.data() || [], this);

      // Range is dependent on chart dimensions, set separately even if scale is user-defined
      xScale = this.setXScaleRange(xScale, this.data() || [], this);
      yScale = this.setYScaleRange(yScale, this.data() || [], this);

      this._xScale(xScale)._yScale(yScale);
    },

    setXScaleDomain: function(xScale, data, chart) {
      return xScale.domain([this.xMin(), this.xMax()]);
    },
    setYScaleDomain: function(yScale, data, chart) {
      return yScale.domain([this.yMin(), this.yMax()]);
    },

    setXScaleRange: function(xScale, data, chart) {
      if (this.invertedXY())
        return xScale.range([chart.height(), 0]);
      else
        return xScale.range([0, chart.width()]);
    },
    setYScaleRange: function(yScale, data, chart) {
      if (this.invertedXY())
        return yScale.range([0, chart.width()]);
      else
        return yScale.range([chart.height(), 0]);
    },

    defaultXScale: function() {
      return d3.scale.linear();
    },
    defaultYScale: function() {
      return d3.scale.linear();
    },

    // _xScale and _yScale used to differentiate between user- and internally-set values
    _xScale: property('_xScale', {type: 'Function'}),
    _yScale: property('_yScale', {type: 'Function'}),
    
    _translateCoordinatesToPoints: function(coordinates, options) {
      var points = [];
      var result = {
        distance: Infinity,
        coordinates: {
          x: 0,
          y: 0
        }
      };

      _.each(this.data(), function(point, index) {
        var calculated = this._distance(point, index, coordinates, options);

        if (calculated.distance < result.distance) {
          result.distance = calculated.distance;
          result.coordinates.x = calculated.x;
          result.coordinates.y = calculated.y;
          result.values = point;
          result.index = index;
        }
      }, this);

      if (result.distance < Infinity) {
        points.push({
          // Leave series information blank (points only)
          points: [result]
        });
      }

      return points;
    },
    _distance: function(point, index, coordinates, options) {
      var x = this.x(point, index);
      var y = this.y(point, index);

      var distance;
      if (options.measurement == 'x')
        distance = Math.abs(x - coordinates.x);
      else if (options.measurement == 'y')
        distance = Math.abs(y - coordinates.y);
      else
        distance = Math.sqrt(Math.pow(x - coordinates.x, 2) + Math.pow(y - coordinates.y, 2));

      return {
        x: x,
        y: y,
        distance: distance
      };
    }
  };

  /**
    Extensions for handling series XY data
  
    Properties:
    - xMin {Number}
    - xMax {Number}
    - yMin {Number}
    - yMax {Number}
    Dependencies: Series, XY
  */
  var XYSeries = {
    xMin: property('xMin', {
      get: function(value) {
        // Calculate minimum from series data
        var min = _.reduce(this.data(), function(memo, series, index) {
          var seriesValues = this.seriesValues(series, index);
          if (_.isArray(seriesValues)) {
            var seriesMin = d3.extent(seriesValues, this.xValue)[0];
            return seriesMin < memo ? seriesMin : memo;  
          }
          else {
            return memo;
          }          
        }, Infinity, this);

        // Default behavior: if min is less than zero, use min, otherwise use 0
        return valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        // Calculate maximum from series data
        var max = _.reduce(this.data(), function(memo, series, index) {
          var seriesValues = this.seriesValues(series, index);
          if (_.isArray(seriesValues)) {
            var seriesMax = d3.extent(seriesValues, this.xValue)[1];
            return seriesMax > memo ? seriesMax : memo;
          }
          else {
            return memo;
          }
        }, -Infinity, this);

        return valueOrDefault(value, max);
      }
    }),
    yMin: property('yMin', {
      get: function(value) {
        // Calculate minimum from series data
        var min = _.reduce(this.data(), function(memo, series, index) {
          var seriesValues = this.seriesValues(series, index);
          if (_.isArray(seriesValues)) {
            var seriesMin = d3.extent(seriesValues, this.yValue)[0];
            return seriesMin < memo ? seriesMin : memo;
          }
          else {
            return memo;
          }
        }, Infinity, this);
        
        // Default behavior: if min is less than zero, use min, otherwise use 0
        return valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    yMax: property('yMax', {
      get: function(value) {
        // Calculate maximum from series data
        var max = _.reduce(this.data(), function(memo, series, index) {
          var seriesValues = this.seriesValues(series, index);
          if (_.isArray(seriesValues)) {
            var seriesMax = d3.extent(seriesValues, this.yValue)[1];
            return seriesMax > memo ? seriesMax : memo;
          }
          else {
            return memo;
          }
        }, -Infinity, this);

        return valueOrDefault(value, max);
      }
    }),

    _translateCoordinatesToPoints: function(coordinates, options) {
      var seriesPoints = [];

      _.each(this.data(), function(series, seriesIndex) {
        var result = {
          distance: Infinity,
          coordinates: {x: 0, y: 0},
          series: {
            key: series.key,
            name: series.name,
            index: seriesIndex
          }
        };

        _.each(series.values, function(point, pointIndex) {
          var calculated = this._distance(point, pointIndex, coordinates, series, options);

          if (calculated.distance < result.distance) {
            result.distance = calculated.distance;
            result.coordinates.x = calculated.x;
            result.coordinates.y = calculated.y;
            result.values = point;
            result.index = pointIndex;
          }
        }, this);

        if (result.distance < Infinity) {
          seriesPoints.push({
            key: series.key,
            name: series.name,
            'class': series['class'],
            index: seriesIndex,
            points: [result]
          });
        }
      }, this);

      return seriesPoints;
    },
    _distance: function(point, index, coordinates, series, options) {
      var x = this.x.call({_parentData: series}, point, index);
      var y = this.y.call({_parentData: series}, point, index);

      var distance;
      if (options.measurement == 'x')
        distance = Math.abs(x - coordinates.x);
      else if (options.measurement == 'y')
        distance = Math.abs(y - coordinates.y);
      else
        distance = Math.sqrt(Math.pow(x - coordinates.x, 2) + Math.pow(y - coordinates.y, 2));

      return {
        x: x,
        y: y,
        distance: distance
      };
    }
  };

  /**
    Extensions for charts of centered key,value data (x: index, y: value, key)
  
    Properties:
    - [itemPadding = 0.1] {Number} % padding between each item (for ValuesSeries, padding is just around group, not individual series items)
    Dependencies: XY
  */
  var Values = {
    isValues: true,

    // Define % padding between each item
    // (If series is displayed adjacent, padding is just around group, not individual series)
    itemPadding: property('itemPadding', {defaultValue: 0.1}),

    transform: function(data) {
      // Transform series data from values to x,y
      return _.map(data, function(item, index) {
        item = _.isObject(item) ? item : {y: item};
        item.x = valueOrDefault(item.x, item.key);

        return item;
      }, this);
    },

    defaultXScale: function() {
      return d3.scale.ordinal();
    },

    setXScaleDomain: function(xScale, data, chart) {
      // Extract keys from all series
      var allKeys = _.map(this.data(), this.xValue);
      var uniqueKeys = _.uniq(_.flatten(allKeys));

      return xScale.domain(uniqueKeys);
    },

    setXScaleRange: function(xScale, data, chart) {
      if (_.isFunction(xScale.rangeBands)) {
        if (this.invertedXY())
          return xScale.rangeBands([chart.height(), 0], chart.itemPadding(), chart.itemPadding() / 2);
        else
          return xScale.rangeBands([0, chart.width()], chart.itemPadding(), chart.itemPadding() / 2);
      }
      else {
        return XY.setXScaleRange.call(this, xScale, data, chart);
      }
    }
  };

  /**
    Extensions for charts of centered key,value series data (x: index, y: value, key)

    Properties:
    - [displayAdjacent = false] {Boolean} Display series next to each other (default is stacked)
    Dependencies: Series, XY, XYSeries, Values
  */
  var ValuesSeries = {
    displayAdjacent: property('displayAdjacent', {defaultValue: false}),

    transform: function(data) {
      // Transform series data from values to x,y
      _.each(data, function(series) {
        series.values = _.map(series.values, function(item, index) {
          item = _.isObject(item) ? item : {y: item};
          item.x = valueOrDefault(item.x, item.key);

          return item;
        }, this);
      }, this);

      return data;
    },

    // determine centered-x based on series display type (adjacent or layered)
    x: di(function(chart, d, i) {
      if (chart.invertedXY())
        return XY.x.original.call(this, chart, d, i);
      else
        return chart.displayAdjacent() ? chart.adjacentX.call(this, d, i) : chart.layeredX.call(this, d, i);
    }),
    y: di(function(chart, d, i) {
      if (chart.invertedXY())
        return chart.displayAdjacent() ? chart.adjacentX.call(this, d, i) : chart.layeredX.call(this, d, i);
      else
        return XY.y.original.call(this, chart, d, i);
    }),

    setXScaleDomain: function(xScale, data, chart) {
      // Extract keys from all series
      var allKeys = _.map(data, function(series, index) {
        return _.map(this.seriesValues(series, index), this.xValue);
      }, this);
      var uniqueKeys = _.uniq(_.flatten(allKeys));

      return xScale.domain(uniqueKeys);
    },

    // AdjacentX/Width is used in cases where series are presented next to each other at each value
    adjacentX: di(function(chart, d, i) {
      var adjacentWidth = chart.adjacentWidth.call(this, d, i);
      var left = chart.layeredX.call(this, d, i) - chart.layeredWidth.call(this, d, i) / 2 + adjacentWidth / 2;
      
      return left + adjacentWidth * chart.seriesIndex.call(this, d, i) || 0;
    }),
    adjacentWidth: di(function(chart, d, i) {
      var seriesCount = chart.seriesCount.call(this);

      if (seriesCount > 0)
        return chart.layeredWidth.call(this, d, i) / seriesCount;
      else
        return 0;
    }),

    // LayeredX/Width is used in cases where sereis are presented on top of each other at each value
    layeredX: di(function(chart, d, i) {
      return chart._xScale()(chart.xValue.call(this, d, i)) + 0.5 * chart.layeredWidth.call(this) || 0;
    }),
    layeredWidth: di(function(chart, d, i) {
      var rangeBand = chart._xScale().rangeBand();
      return isFinite(rangeBand) ? rangeBand : 0;
    }),

    // determine item width based on series display type (adjacent or layered)
    itemWidth: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentWidth.call(this, d, i) : chart.layeredWidth.call(this, d, i);
    })
  };

  /**
    Extensions for handling labels in charts

    Properties:
    - [labels] {Object}
    - [labelFormat] {String|Function}
    - [labelPosition = 'top'] {String} Label position (top, right, bottom, left)
    - [labelOffset = 0] {Number|Object} Label offset (distance or {x, y})
  */
  var Labels = {
    labels: property('labels', {
      defaultValue: {},
      set: function(options) {
        if (_.isBoolean(options))
          options = {display: options};
        else if (_.isString(options))
          options = {display: options == 'display' || options == 'show'}; 
        else if (options && _.isUndefined(options.display))
          options.display = true;

        _.each(options, function(value, key) {
          // Capitalize and append "label" and then set option
          var labelOption = 'label' + helpers.capitalize(key);

          if (this[labelOption] && this[labelOption].isProperty && this[labelOption].setFromOptions)
            this[labelOption](value, {silent: true});
        }, this);
      }
    }),

    labelDisplay: property('labelDisplay', {defaultValue: false}),
    labelFormat: property('labelFormat', {
      type: 'Function',
      set: function(value) {
        if (_.isString(value)) {
          return {
            override: d3.format(value)
          };
        }
      }
    }),
    labelPosition: property('labelPosition', {
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),
    labelOffset: property('labelOffset', {
      get: function(offset) {
        if (_.isNumber(offset)) {
          offset = {
            top: {x: 0, y: -offset},
            right: {x: offset, y: 0},
            bottom: {x: 0, y: offset},
            left: {x: -offset, y: 0}
          }[this.labelPosition()];

          if (!offset) {
            offset = {x: 0, y: 0};
          }
        }

        return offset;
      }
    }),
    labelPadding: property('labelPadding'),
    labelAnchor: property('labelAnchor', {
      defaultValue: function() {
        var position = this.labelPosition();
        if (!_.isUndefined(position)) {
          if (position == 'right')
            return 'start';
          else if (position == 'left')
            return 'end';
          else
            return 'middle';
        }
      },
      validate: function(value) {
        return _.contains(['start', 'middle', 'end'], value);
      }
    }),
    labelAlignment: property('labelAlignment', {
      defaultValue: function() {
        var position = this.labelPosition();
        if (!_.isUndefined(position)) {
          var alignmentByPosition = {
            'top': 'bottom',
            'right': 'middle',
            'bottom': 'top',
            'left': 'middle'
          };

          return alignmentByPosition[position];
        }        
      },
      validate: function(value) {
        return _.contains(['top', 'middle', 'bottom'], value);
      }
    }),
    labelStyle: property('labelStyle', {defaultValue: {}}),

    labelText: di(function(chart, d, i) {
      var value = chart.yValue.call(this, d, i);
      return chart.labelFormat() ? chart.labelFormat()(value) : value;
    }),

    _getLabels: function() {
      var labels = [];

      if (this.labelDisplay()) {
        labels.push({
          // Leave series information blank (labels only)
          labels: _.map(this.data(), function(point, index) {
            return {
              key: this.keyValue(point, index),
              coordinates: {
                x: this.x(point, index),
                y: this.y(point, index)
              },
              text: this.labelText(point, index),
              offset: this.labelOffset(),
              padding: this.labelPadding(),
              anchor: this.labelAnchor(),
              alignment: this.labelAlignment(),
              'class': point['class'],
              style: this.labelStyle(),
              values: point,
              index: index,
            };
          }, this)
        });
      }      

      return labels;
    },

    _convertPointToLabel: function(point) {
      return {
        key: this.keyValue(point.values, point.index),
        coordinates: point.coordinates,
        text: this.labelText(point.values, point.index),
        offset: this.labelOffset(),
        padding: this.labelPadding(),
        anchor: this.labelAnchor(),
        alignment: this.labelAlignment(),
        'class': point.values['class'],
        style: this.labelStyle(),
        values: point.values,
        index: point.index
      };
    }
  };

  /**
    Extensions for handling labels in series charts

    Dependencies: Labels
  */
  var LabelsSeries = {
    _getLabels: function() {
      var seriesLabels = [];

      if (this.labelDisplay()) {
        seriesLabels = _.map(this.data(), function(series, seriesIndex) {
          return {
            key: series.key,
            name: series.name,
            'class': series['class'],
            index: seriesIndex,
            labels: _.map(series.values, function(point, pointIndex) {
              return {
                key: this.keyValue.call({_parentData: series}, point, pointIndex),
                coordinates: {
                  x: this.x.call({_parentData: series}, point, pointIndex),
                  y: this.y.call({_parentData: series}, point, pointIndex)
                },
                text: this.labelText.call({_parentData: series}, point, pointIndex),
                offset: this.labelOffset(),
                padding: this.labelPadding(),
                anchor: this.labelAnchor(),
                alignment: this.labelAlignment(),
                'class': point['class'],
                style: this.labelStyle(),
                values: point,
                index: pointIndex,
              };
            }, this)
          };
        }, this);
      }
      
      return seriesLabels;
    }
  };

  // Expose extensions
  d3.chart.extensions = _.extend(d3.chart.extensions || {}, {
    Series: Series,
    XY: XY,
    XYSeries: _.extend({}, Series, XY, XYSeries),
    Values: _.extend({}, XY, Values),
    ValuesSeries: _.extend({}, Series, XY, XYSeries, Values, ValuesSeries),
    Labels: Labels,
    LabelsSeries: _.extend({}, Labels, LabelsSeries)
  });

})(d3, _, d3.chart.helpers);

(function(d3, _, helpers, extensions) {
  var property = helpers.property;
  
  /**
    Base
    Shared functionality between all charts, components, and containers

    Properties:
    - {Object|Array} data Store fully-transformed data
    - {Object} style Overall style of chart/component
  */
  d3.chart('Base', {
    initialize: function() {
      // Bind all di-functions to this chart
      helpers.bindAllDi(this);
    },

    data: property('data', {
      set: function(data) {
        // BUG This is triggered automatically, but it needs to be re-triggered
        // Has something to do with how scales are sent to components (e.g. axes)
        this.trigger('change:data', 'BUG');
      }
    }),
    style: property('style', {
      get: function(value) {
        return helpers.style(value) || null;
      }
    }),
    options: property('options', {
      defaultValue: {},
      set: function(options) {
        this.setFromOptions(options);
      }
    }),

    width: function width() {
      return helpers.dimensions(this.base).width;
    },
    height: function height() {
      return helpers.dimensions(this.base).height;
    },

    /**
      Trigger redraw on property changes

      @example
      ```js
      this.redrawFor('title', 'style')
      // -> on change:title, redraw()
      ```

      @param {String...} properties
    */
    redrawFor: function(property) {
      var properties = _.toArray(arguments);
      var events = _.map(properties, function(property) {
        return 'change:' + property;
      });

      // d3.chart doesn't handle events with spaces, register individual handlers
      _.each(events, function(event) {
        this.on(event, function() {
          helpers.log('redrawFor', event);
          if (_.isFunction(this.redraw))
            this.redraw();
          else if (this.container && _.isFunction(this.container.redraw))
            this.container.redraw();
        });
      }, this);
    },

    transform: function(data) {
      data = data || [];

      // Base is last transform to be called,
      // so stored data has been fully transformed
      this.data(data);
      return data;
    },

    setFromOptions: function(options) {
      // Set any properties from options
      _.each(options, function(value, key) {
        if (this[key] && this[key].isProperty && this[key].setFromOptions)
          this[key](value, {silent: true});
      }, this);
    }
  });

  /**
    Chart
    Foundation for building charts with series data
  */
  d3.chart('Base').extend('Chart', {
    initialize: function(options) {
      this.options(options || {});
      this.redrawFor('options');
    }
  });
  d3.chart('Chart').extend('SeriesChart', extensions.Series);

  /**
    Container
    Foundation for chart and component placement

    Properties:
    - {Object/Array} rawData
    - {Object} chartMargins {top, right, bottom, left} in px
    - {Number} width in px
    - {Number} height in px
  */
  d3.chart('Base').extend('Container', {
    initialize: function(options) {
      this.chartsById = {};
      this.componentsById = {};

      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      };

      this.base.classed('chart', true);

      this.on('change:dimensions', this.redraw);

      this.options(options || {});
      this.redrawFor('options');

      this.handleResize();
      this.handleHover();
    },

    rawData: property('rawData'),

    // Chart margins from Container edges ({top, right, bottom, left})
    chartMargins: property('chartMargins', {
      get: function(values) {
        values = (values && typeof values == 'object') ? values : {};
        values = _.defaults(values, {top: 0, right: 0, bottom: 0, left: 0});

        return values;
      },
      set: function(values, previous) {
        values = (values && typeof values == 'object') ? values : {};
        values = _.defaults(values, previous, {top: 0, right: 0, bottom: 0, left: 0});

        return {
          override: values,
          after: function() {
            this.trigger('change:dimensions');
          }
        };
      }
    }),

    width: property('width', {
      defaultValue: function() {
        return helpers.dimensions(this.base).width;
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    }),
    height: property('height', {
      defaultValue: function() {
        return helpers.dimensions(this.base).height;
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    }),

    draw: function(data) {
      helpers.log('draw', data);
      helpers.log.time('Base#draw');

      // Explicitly set width and height of container
      // (if width/height > 0)
      this.base
        .attr('width', this.width() || null)
        .attr('height', this.height() || null);

      // Pre-draw for accurate dimensions for layout
      helpers.log.time('Base#draw.layout');
      this._preDraw(data);

      // Layout now that components' dimensions are known
      this.layout();
      helpers.log.timeEnd('Base#draw.layout');

      // Full draw now that everything has been laid out
      d3.chart().prototype.draw.call(this, data);

      helpers.log.timeEnd('Base#draw');
    },

    redraw: function() {
      // Using previously saved rawData, redraw chart      
      if (this.rawData()) {
        helpers.log('redraw');
        this.draw(this.rawData());
      }
    },

    chartLayer: function(options) {
      options = _.defaults({}, options, {
        zIndex: helpers.zIndex.chart
      });

      return this.base.append('g')
        .attr('class', 'chart-layer')
        .attr('data-zIndex', options.zIndex);
    },

    componentLayer: function(options) {
      options = _.defaults({}, options, {
        zIndex: helpers.zIndex.component
      });

      return this.base.append('g')
        .attr('class', 'chart-component-layer')
        .attr('data-zIndex', options.zIndex);
    },

    attachChart: function(id, chart) {
      this._attach(id, chart);
      this.chartsById[id] = chart;
    },

    detachChart: function(id) {
      var chart = this.chartsById[id];
      if (!chart) return;

      this._detach(id, chart);
      delete this.chartsById[id];
    },

    attachComponent: function(id, component) {
      this._attach(id, component);
      this.componentsById[id] = component;

      component.on('change:position', function() {
        this.trigger('change:dimensions');
      });
    },

    detachComponent: function(id) {
      var component = this.componentsById[id];
      if (!component) return;

      component.off('change:position');
      this._detach(id, component);
      delete this.componentsById[id];
    },

    layout: function() {
      var layout = this._extractLayout();
      this._updateChartMargins(layout);
      this._positionLayers(layout);
    },
    
    chartWidth: function() {
      var margins = this._chartMargins();
      return this.width() - margins.left - margins.right;
    },
    chartHeight: function() {
      var margins = this._chartMargins();
      return this.height() - margins.top - margins.bottom;
    },

    handleResize: function() {
      // TODO Further work on making sure resize happens properly
      // this.onResize = _.debounce(function() {
      //   this.trigger('change:dimensions');
      // }.bind(this), 250);
      // d3.select(window).on('resize', this.onResize);
    },

    handleHover: function() {
      var inside;
      var trigger = this.trigger.bind(this);
      
      var throttledMouseMove = _.throttle(function(coordinates) {
        if (inside)
          trigger('move:mouse', coordinates);
      }, 100);

      this.base.on('mouseenter', function() {
        inside = true;
        trigger('enter:mouse', translateToXY(d3.mouse(this)));
      });
      this.base.on('mousemove', function() {
        throttledMouseMove(translateToXY(d3.mouse(this)));
      });
      this.base.on('mouseleave', function() {
        inside = false;
        trigger('leave:mouse');
      });

      function translateToXY(coordinates) {
        return {x: coordinates[0], y: coordinates[1]};
      }

      // Handle hover over charts
      var insideChart;
      this.on('enter:mouse', function(coordinates) {
        var chartCoordinates = this._translateCoordinatesToChart(coordinates);
        if (chartCoordinates) {
          insideChart = true;
          trigger('chart:enter:mouse', chartCoordinates);
        }
      });
      this.on('move:mouse', function(coordinates) {
        var chartCoordinates = this._translateCoordinatesToChart(coordinates);
        if (chartCoordinates) {
          if (insideChart) {
            trigger('chart:move:mouse', chartCoordinates);
          }
          else {
            insideChart = true;
            trigger('chart:enter:mouse', chartCoordinates);
          }
        }
        else if (insideChart) {
          insideChart = false;
          trigger('chart:leave:mouse');
        }
      });
      this.on('leave:mouse', function() {
        if (insideChart) {
          insideChart = false;
          trigger('chart:leave:mouse');
        }
      });

      // Handle hover over points
      var insidePoints;
      this.on('chart:enter:mouse', function(coordinates) {
        var points = this._translateCoordinatesToPoints(coordinates);
        if (points.length) {
          insidePoints = true;
          trigger('points:enter:mouse', points);
        }
      });
      this.on('chart:move:mouse', function(coordinates) {
        var points = this._translateCoordinatesToPoints(coordinates);
        if (points.length) {
          if (insidePoints) {
            trigger('points:move:mouse', points);
          }
          else {
            insidePoints = true;
            trigger('points:enter:mouse', points);
          }
        }
        else if (insidePoints) {
          insidePoints = false;
          trigger('points:leave:mouse');
        }
      });
      this.on('chart:leave:mouse', function() {
        if (insidePoints) {
          insidePoints = false;
          trigger('points:leave:mouse');
        }
      });

      // Handle hover over points labels
      var insideLabels;
      this.on('points:enter:mouse', function(points) {
        var labels = this._convertPointsToLabels(points);
        if (labels.length) {
          insideLabels = true;
          trigger('labels:enter:mouse', labels);
        }
      });
      this.on('points:move:mouse', function(points) {
        var labels = this._convertPointsToLabels(points);
        if (labels.length) {
          if (insideLabels) {
            trigger('labels:move:mouse', labels);
          }
          else {
            insideLabels = true;
            trigger('labels:enter:mouse', labels);
          }
        }
        else if (insideLabels) {
          insideLabels = false;
          trigger('labels:leave:mouse');
        }
      });
      this.on('points:leave:mouse', function() {
        if (insideLabels) {
          insideLabels = false;
          trigger('labels:leave:mouse');
        }
      });
    },

    _attach: function(id, item) {
      item.id = id;
      item.base.attr('data-id', id);
      item.container = this;

      this.attach(id, item);

      if (item && _.isFunction(item.trigger)) {
        item.trigger('attached');
      }
    },

    _detach: function(id, item) {
      item.base.remove();

      delete this._attached[id];

      if (item && _.isFunction(item.trigger)) {
        item.trigger('detached');
      }
    },

    _preDraw: function(data) {
      this._positionChartLayers();
      _.each(this.componentsById, function(component, id) {
        if (!component.skipLayout)
          component.draw(this.demux ? this.demux(id, data) : data);
      }, this);
    },

    _positionLayers: function(layout) {
      this._positionChartLayers();
      this._positionComponents(layout);
      this._positionByZIndex();      
    },

    _positionChartLayers: function() {
      var margins = this._chartMargins();

      this.base.selectAll('.chart-layer')
        .attr('transform', helpers.transform.translate(margins.left, margins.top))
        .attr('width', this.chartWidth())
        .attr('height', this.chartHeight());
    },

    _positionComponents: function(layout) {
      var margins = this._chartMargins();
      var width = this.width();
      var height = this.height();
      var chartWidth = this.chartWidth();
      var chartHeight = this.chartHeight();

      _.reduce(layout.top, function(previous, part, index, parts) {
        var y = previous - part.offset;
        setLayout(part.component, margins.left, y, {width: chartWidth});
        
        return y;
      }, margins.top);

      _.reduce(layout.right, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var x = previous + previousPart.offset;
        setLayout(part.component, x, margins.top, {height: chartHeight});

        return x;
      }, width - margins.right);

      _.reduce(layout.bottom, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var y = previous + previousPart.offset;
        setLayout(part.component, margins.left, y, {width: chartWidth});

        return y;
      }, height - margins.bottom);

      _.reduce(layout.left, function(previous, part, index, parts) {
        var x = previous - part.offset;
        setLayout(part.component, x, margins.top, {height: chartHeight});

        return x;
      }, margins.left);

      function setLayout(component, x, y, options) {
        if (component && _.isFunction(component.setLayout))
          component.setLayout(x, y, options);
      }
    },

    _positionByZIndex: function() {
      // Get layers
      var elements = this.base.selectAll('.chart-layer, .chart-component-layer')[0];

      // Sort by z-index
      elements = _.sortBy(elements, function(element) {
        return +d3.select(element).attr('data-zIndex') || 0;
      });

      // Move layers to z-index order
      _.each(elements, function(element) {
        element.parentNode.appendChild(element);
      }, this);
    },

    // Update margins from components layout
    _updateChartMargins: function(layout) {
      // Copy margins to prevent updating user-defined margins
      var margins = _.extend({}, this.chartMargins());
      _.each(layout, function(parts, key) {
        _.each(parts, function(part) {
          margins[key] += part.offset || 0;
        });
      });
      
      this._chartMargins(margins);

      return margins;
    },

    // Extract layout from components
    _extractLayout: function() {
      var layout = {top: [], right: [], bottom: [], left: []};
      _.each(this.componentsById, function(component) {
        if (component.skipLayout)
          return;

        var position = component.layoutPosition();
        if (!_.contains(['top', 'right', 'bottom', 'left'], position))
          return;

        var offset;
        if (position == 'top' || position == 'bottom')
          offset = component.layoutHeight();
        else
          offset = component.layoutWidth();

        layout[position].push({
          offset: offset,
          component: component
        });
      });
      
      return layout;
    },

    // Internal chart margins to separate from user-defined margins
    _chartMargins: property('_chartMargins', {
      defaultValue: function() {
        return _.extend({}, this.chartMargins());
      }
    }),

    _translateCoordinatesToChart: function(coordinates) {
      var margins = this._chartMargins();
      var chartWidth = this.chartWidth();
      var chartHeight = this.chartHeight();

      var bounds = {
        top: margins.top,
        right: margins.left + chartWidth,
        bottom: margins.top + chartHeight,
        left: margins.left
      };

      if (coordinates.x >= bounds.left && coordinates.x <= bounds.right
          && coordinates.y >= bounds.top && coordinates.y <= bounds.bottom) {
        var chartCoordinates = {
          x: coordinates.x - bounds.left,
          y: coordinates.y - bounds.top
        };

        return chartCoordinates;
      }
    },

    _translateCoordinatesToPoints: function(coordinates) {
      var points = _.reduce(this.chartsById, function(memo, chart, id) {
        if (chart && _.isFunction(chart._translateCoordinatesToPoints)) {
          var chartPoints = chart._translateCoordinatesToPoints(coordinates, {measurement: 'x'});
          if (!chartPoints || !_.isArray(chartPoints)) {
            throw new Error('d3.chart.multi: Expected _translateCoordinatesToPoints to return an Array for chart with id: ' + id);
          }
          else {
            // Add chart id to series key
            _.map(chartPoints, function(series) {
              series.chartId = id;
              series.seriesKey = series.key;
              series.key = series.key ? id + '-' + series.key : id;
            });

            return memo.concat(chartPoints);
          }
            
        }
        else {
          return memo;
        }
      }, [], this);

      return points;
    },

    _convertPointsToLabels: function(points) {
      var labels = _.map(points, function(series) {
        series = _.clone(series);
        var chart = this.chartsById[series.chartId];
        if (chart && _.isFunction(chart._convertPointToLabel)) {
          series.labels = _.map(series.points, chart._convertPointToLabel, chart);
        }
        else {
          series.labels = [];
        }

        // Remove points from labels
        delete series.points;

        return series;
      }, this);

      return labels;
    },

    _getLabels: function() {
      var labels = _.reduce(this.chartsById, function(memo, chart, id) {
        if (chart && _.isFunction(chart._getLabels)) {
          var labels = chart._getLabels();
          if (!labels || !_.isArray(labels)) {
            throw new Error('d3.chart.multi: Expected _getLabels to return an Array for chart with id: ' + id);
          }
          else {
            // Add chart id to series key
            _.map(labels, function(series) {
              series.chartId = id;
              series.seriesKey = series.key;
              series.key = series.key ? id + '-' + series.key : id;
            });

            return memo.concat(labels);
          }
        }
        else {
          return memo;
        }
      }, [], this);

      return labels;
    }
  });
  
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
    - skipLayout: Don't use this component type during layout (e.g. inset within chart)
    - layoutWidth: Adjust with more precise sizing calculations
    - layoutHeight: Adjust with more precise sizing calculations
    - layoutPosition: Adjust layout positioning
    - setLayout: Override if layout needs to be customized
  */
  d3.chart('Base').extend('Component', {
    initialize: function(options) {
      this.options(options || {});
      this.redrawFor('options');
    },

    position: property('position', {
      defaultValue: 'top',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),
    width: property('width', {
      defaultValue: function() {
        return helpers.dimensions(this.base).width;
      }
    }),
    height: property('height', {
      defaultValue: function() {
        return helpers.dimensions(this.base).height;
      }
    }),

    margins: property('margins', {
      get: function(values) {
        var percentages = _.defaults({}, values, {top: 0.0, right: 0.0, bottom: 0.0, left: 0.0});
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
    */
    skipLayout: false,
    layoutWidth: function() {
      var margins = this.margins();
      return this.width() + margins.left + margins.right;
    },
    layoutHeight: function() {
      var margins = this.margins();
      return this.height() + margins.top + margins.bottom;
    },
    layoutPosition: function() {
      return this.position();
    },

    /**
      Set layout of underlying base
      (Override for elements placed within chart)
    */
    setLayout: function(x, y, options) {
      var margins = this.margins();
      this.base.attr('transform', helpers.transform.translate(x + margins.left, y + margins.top));
      this.height(options && options.height);
      this.width(options && options.width);
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Labels
    Draw labels from _getLabels for each chart on container
  */
  d3.chart('Chart').extend('Labels', {
    initialize: function() {
      this.layer('Labels', this.base.append('g').classed('chart-labels', true), {
        dataBind: function(data) {
          var chart = this.chart();
          var series = this.selectAll('g')
            .data(data, chart.seriesKey);

          series.enter()
            .append('g')
            .attr('class', chart.seriesClass)
            .attr('data-chart-id', chart.seriesChartId)
            .attr('data-series-key', chart.seriesSeriesKey);
          series.exit()
            .remove();

          return series.selectAll('g')
            .data(chart.seriesLabels, chart.labelKey);
        },
        insert: function() {
          return this.chart().insertLabels(this);
        },
        events: {
          'merge:transition': function() {
            var chart = this.chart();

            helpers.log.time('Labels.draw');
            // 1. Draw all labels
            chart.drawLabels(this);

            if (chart.handleCollisions()) {
              helpers.log.time('Chart.handleCollisions');
              
              // 2. Remove overlapping labels within series
              chart.removeLabels();

              // 3. Group overlapping labels between series
              chart.groupLabels();

              helpers.log.timeEnd('Chart.handleCollisions');
            }           

            // 4. Layout labels
            chart.layoutLabels();
            helpers.log.timeEnd('Labels.draw');
          },
          'exit': function() {
            this.remove();
          }
        }
      });
    },

    transform: function(data) {
      return this.extractLabels(data);
    },

    excludeFromLegend: true,
    labels: property('labels', {defaultValue: []}),
    handleCollisions: property('handleCollisions', {defaultValue: true}),
    
    format: property('format', {
      type: 'Function',
      set: function(value) {
        if (_.isString(value)) {
          return {
            override: d3.format(value)
          };
        }
      }
    }),
    position: property('position', {
      defaultValue: 'top',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left'], value);
      }
    }),
    offset: property('offset', {
      defaultValue: 0,
      get: function(offset) {
        return this.offsetByPosition(offset, this.position());
      }
    }),
    padding: property('padding', {defaultValue: 2}),
    anchor: property('anchor', {
      defaultValue: function() {
        var position = this.position();

        if (position == 'right')
          return 'start';
        else if (position == 'left')
          return 'end';
        else
          return 'middle';
      },
      validate: function(value) {
        return _.contains(['start', 'middle', 'end'], value);
      }
    }),
    alignment: property('alignment', {
      defaultValue: function() {
        var alignmentByPosition = {
          'top': 'bottom',
          'right': 'middle',
          'bottom': 'top',
          'left': 'middle'
        };

        return alignmentByPosition[this.position()];
      },
      validate: function(value) {
        return _.contains(['top', 'middle', 'bottom'], value);
      }
    }),

    labelKey: di(function(chart, d, i) {
      return d.key;
    }),
    labelX: di(function(chart, d, i) {
      var offset = _.defaults({}, chart.offset(), d.offset);
      return d.coordinates.x + offset.x;
    }),
    labelY: di(function(chart, d, i) {
      var offset = _.defaults({}, chart.offset(), d.offset);
      return d.coordinates.y + offset.y;
    }),
    labelText: di(function(chart, d, i) {
      var format = chart.format();
      return format ? format(d.text) : d.text;
    }),
    labelStyle: di(function(chart, d, i) {
      var styles = _.defaults({}, d.style, chart.options().style);
      return helpers.style(styles) || null;
    }),

    seriesKey: di(function(chart, d, i) {
      return d.key || i;
    }),
    seriesChartId: di(function(chart, d, i) {
      return d.chartId;
    }),
    seriesSeriesKey: di(function(chart, d, i) {
      return d.seriesKey;
    }),
    seriesClass: di(function(chart, d, i) {
      var seriesIndex = !_.isUndefined(d.index) ? 'chart-index-' + d.index : '';
      var seriesClass = d['class'] ? ' ' + d['class'] : '';

      return _.compact(['chart-series', seriesIndex, seriesClass]).join(' ');
    }),
    seriesLabels: di(function(chart, d, i) {
      return d.labels;
    }),
    seriesData: di(function(chart, d, i) {
      var parentData = helpers.getParentData(this);

      // Element may be two-deep (text / rect)
      if (!parentData.seriesKey && this.parentNode)
        return helpers.getParentData(this.parentNode);
      else
        return parentData;
    }),

    insertLabels: function(base) {
      var groups = base.append('g')
        .classed('chart-label', true)
        .attr('style', this.labelStyle);

      groups.append('rect')
        .classed('chart-label-bg', true);
      groups.append('text')
        .classed('chart-label-text', true);

      return groups;
    },
    drawLabels: function(selection) {
      var labels = [];
      
      // Add labels
      selection.call(function(data) {
        _.each(data, function(series, seriesIndex) {
          labels.push([]);

          _.each(series, function(labelElement, labelIndex) {
            var label = new this.Label(labelElement, d3.select(labelElement).data()[0], {
              labelX: this.labelX,
              labelY: this.labelY,
              labelText: this.labelText,
              padding: this.padding(),
              anchor: this.anchor(),
              alignment: this.alignment()
            });
            labels[seriesIndex].push(label);
            label.draw();
          }, this);
        }, this);
      }.bind(this));

      // After adding all labels, calculate bounds
      _.each(labels, function(series) {
        _.each(series, function(label) {
          label.setBounds();
        });
      });
      
      this.labels(labels);
    },
    removeLabels: function() {
      _.each(this.labels(), function(series) {
        var prev;
        _.each(series, function(label) {
          if (label.checkForOverlap(prev, {compare: 'LR'})) {
            label.remove();
          }
          else {
            prev = label;
          }
        }, this);
      }, this);
    },
    groupLabels: function(selection) {
      checkForCollisions(this.labels());

      function checkForCollisions(labels) {
        _.each(labels, function(seriesA, seriesIndex) {
          // Check through remaining series for collisions
          _.each(labels.slice(seriesIndex + 1), function(seriesB) {
            _.each(seriesB, function(labelB) {
              if (!labelB.removed) {
                _.each(seriesA, function(labelA) {
                  if (!labelA.removed && labelA.checkForOverlap(labelB)) {
                    groupLabels(labelA, labelB);
                  }
                });
              }
            });
          });
        });
      }

      function groupLabels(labelA, labelB) {
        if (labelA.group && labelB.group) {
          // Move labelB group labels into labelA group
          _.each(labelB.group.labels, function(label) {
            labelA.group.labels.push(label);
            label.group = labelA.group;
          });

          updateGroupPositions(labelA.group);
        }
        else if (labelA.group) {
          addLabelToGroup(labelB, labelA.group);
        }
        else if (labelB.group) {
          addLabelToGroup(labelA, labelB.group);
        }
        else {
          var group = {labels: []};
          addLabelToGroup(labelA, group);
          addLabelToGroup(labelB, group);
        }
      }

      function addLabelToGroup(label, group) {
        group.labels.push(label);
        label.group = group;
        label.originalY = label.y();
        label.selection.attr('data-group-index', group.index);

        updateGroupPositions(group);
      }

      function updateGroupPositions(group) {
        var byY = _.chain(group.labels)
          .each(function(label) {
            // Reset to original y
            label.y(label.originalY);
          })
          .sortBy(function(label) {
            return label.y();
          })
          .reverse()
          .value();

        _.each(byY, function(label, index) {
          var prev = _.first(byY, index);
          var overlap;
          for (var i = prev.length - 1; i >= 0; i--) {
            if (label.checkForOverlap(prev[i])) {
              overlap = prev[i];
              break;
            }
          }

          if (overlap) {
            label.y(overlap.y() - label.height());
          }
        });
      }
    },
    layoutLabels: function() {
      _.each(this.labels(), function(series) {
        _.each(series, function(label) {
          if (!label.removed)
            label.layout();
        });
      });
    },

    extractLabels: function(data) {
      // Get labels from container
      if (this.container && _.isFunction(this.container._getLabels)) {
        return this.container._getLabels();
      }
      else {
        return [];
      }
    },

    offsetByPosition: function(offset, position) {
      if (_.isNumber(offset)) {
        offset = {
          top: {x: 0, y: -offset},
          right: {x: offset, y: 0},
          bottom: {x: 0, y: offset},
          left: {x: -offset, y: 0}
        }[position];

        if (!offset) {
          offset = {x: 0, y: 0};
        }
      }

      return offset;
    },

    Label: Label
  });
  
  /**
    HoverLabels
    Listen to points events and draw labels
  */
  d3.chart('Labels').extend('HoverLabels', {
    initialize: function() {
      _.bindAll(this, 'onLabelsEnter', 'onLabelsMove', 'onLabelsLeave');

      this.on('attached', function() {
        this.container.on('labels:enter:mouse', this.onLabelsEnter);
        this.container.on('labels:move:mouse', this.onLabelsMove);
        this.container.on('labels:leave:mouse', this.onLabelsLeave);
      });
      this.on('detached', function() {
        this.container.off('labels:enter:mouse', this.onLabelsEnter);
        this.container.off('labels:move:mouse', this.onLabelsMove);
        this.container.off('labels:leave:mouse', this.onLabelsLeave);
      });
    },

    excludeFromLegend: true,
    draw: function() {
      // Override default draw call
      // (only want to draw on hover)
    },
    _draw: function(labels) {
      d3.chart('Chart').prototype.draw.call(this, labels);
    },

    onLabelsEnter: function(points) {
      this._draw(points);
    },
    onLabelsMove: function(points) {
      this._draw(points);
    },
    onLabelsLeave: function() {
      this._draw([]);
    },

    extractLabels: function(data) {
      // Pass through labels data
      return data;
    }
  });

  /**
    Element helper

    @param {SVG Element} element
  */
  function Element(element) {
    if (!_.isFunction(element.getBBox))
      throw new Error('Only SVG elements with getBBox() are supported by Element helper');

    this.element = element;
    this.selection = d3.select(element);
    this.removed = false;

    return this;
  }
  _.extend(Element.prototype, {
    x: property('x', {type: 'Function', defaultValue: 0}),
    y: property('y', {type: 'Function', defaultValue: 0}),
    width: property('width', {type: 'Function', defaultValue: 0}),
    height: property('height', {type: 'Function', defaultValue: 0}),

    bounds: property('bounds', {
      get: function() {
        return {
          x: this.x(),
          y: this.y(),
          width: this.width(),
          height: this.height()
        };
      },
      set: function(bounds) {
        this.x(bounds.x);
        this.y(bounds.y);
        this.width(bounds.width);
        this.height(bounds.height);
      }
    }),

    xCenter: property('xCenter', {
      get: function() {
        return this.x() + (this.width() / 2);
      },
      set: function(value) {
        this.x(value - (this.width() / 2));
      }
    }),

    layout: function() {
      this.selection
        .attr('x', this.x())
        .attr('y', this.y())
        .attr('width', this.width())
        .attr('height', this.height());
    },

    getBBox: function() {
      return this.element.getBBox();
    },
    setBounds: function() {
      this.bounds(this.getBBox());
      return this;
    },
    
    checkForOverlap: function(element, options) {
      if (!element || !element.bounds) return false;

      var a = getEdges(this.bounds());
      var b = getEdges(element.bounds());
      var containedLR = (b.left < a.left && b.right > a.right);
      var containerTB = (b.bottom < a.bottom && b.top > a.top);
      var overlapLR = (b.left >= a.left && b.left < a.right) || (b.right > a.left && b.right <= a.right) || containedLR;
      var overlapTB = (b.top >= a.top && b.top < a.bottom) || (b.bottom > a.top && b.bottom <= a.bottom) || containerTB;

      if (options && options.compare == 'LR')
        return overlapLR;
      else if (options && options.compare == 'TB')
        return overlapTB;
      else
        return overlapLR && overlapTB;

      function getEdges(bounds) {
        return {
          left: bounds.x,
          right: bounds.x + bounds.width,
          top: bounds.y,
          bottom: bounds.y + bounds.height
        };
      }
    }
  });

  /**
    Group helper

    @param {SVG Group} group
  */
  function Group(group) {
    Element.call(this, group);
    return this;
  }
  _.extend(Group.prototype, Element.prototype, {
    getBBox: function() {
      // getBBox does not account for translate(...), needed for groups
      var bbox = this.element.getBBox();
      var transform = this.selection.attr('transform');

      if (transform && _.indexOf(transform, 'translate')) {
        var parts = transform.split(')');
        var translate = {x: 0, y: 0};
        _.each(parts, function(part) {
          if (_.indexOf(part, 'translate')) {
            xy = part.replace('translate', '').replace('(', '').split(',');
            if (xy.length >= 2) {
              translate.x = +xy[0].trim();
              translate.y = +xy[1].trim();  
            }
          }
        }, this);

        bbox.x += translate.x;
        bbox.y += translate.y;
      }

      return bbox;
    },

    layout: function() {
      this.selection
        .attr('transform', helpers.transform.translate(this.x(), this.y()))
        .attr('width', this.width())
        .attr('height', this.height());
    }
  });

  /**
    Label helper

    @param {SVG Element} element
    @param {Object} data
    @param {Object} options
  */
  function Label(element, data, options) {
    Group.call(this, element);
    this.data = data;

    this.text = new Element(this.selection.select('text').node());
    this.rect = new Element(this.selection.select('rect').node());

    this.options = _.defaults({}, options, {
      labelX: function(d, i) { return d.x; },
      labelY: function(d, i) { return d.y; },
      labelText: function(d, i) { return d.value; },
      padding: 0,
      offset: {x: 0, y: 0},
      anchor: 'middle',
      alignment: 'bottom'
    });
  }
  _.extend(Label.prototype, Group.prototype, {
    draw: function() {
      this.text.selection
        .attr('x', this.options.labelX)
        .attr('y', this.options.labelY)
        .attr('text-anchor', 'start')
        .text(this.options.labelText);

      return this;
    },

    layout: function() {
      this.selection
        .attr('transform', helpers.transform.translate(this.x(), this.y()));

      this.rect.layout();
      this.text.layout();

      return this;
    },

    setBounds: function() {
      var textBounds = this.text.setBounds().bounds();
      var adjustments = {x: 0, y: -3, width: 0, height: 0};
      var offset = this.data.offset || this.options.offset;
      var padding = this.data.padding || this.options.padding;
      var anchor = this.data.anchor || this.options.anchor;
      var alignment = this.data.alignment || this.options.alignment;

      var center = {
        x: textBounds.x,
        y: textBounds.y + textBounds.height
      };
      var bounds = {
        width: textBounds.width + 2*padding + adjustments.width,
        height: textBounds.height + 2*padding + adjustments.height
      };

      bounds.x = center.x - bounds.width/2 + offset.x + adjustments.x;
      bounds.y = center.y - bounds.height/2 + offset.y + adjustments.y;

      if (anchor == 'start')
        bounds.x += bounds.width / 2;
      else if (anchor == 'end')
        bounds.x -= bounds.width / 2;
      
      if (alignment == 'bottom')
        bounds.y -= bounds.height / 2;
      else if (alignment == 'top')
        bounds.y += bounds.height / 2;

      this
        .bounds(bounds);

      this.rect
        .bounds({
          x: 0,
          y: 0,
          width: bounds.width,
          height: bounds.height
        });

      this.text
        .x(padding)
        .y(textBounds.height + padding + adjustments.y);

      return this;
    },

    remove: function() {
      this.removed = true;
      this.selection.remove();
      return this;
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Bars
    Bar graph with centered key,value data and adjacent display for series
  */
  d3.chart('SeriesChart').extend('Bars', mixin(extensions.ValuesSeries, extensions.LabelsSeries, {
    initialize: function() {
      this.seriesLayer('Bars', this.base.append('g').classed('chart-bars', true), {
        dataBind: function(data) {
          var chart = this.chart();

          return this.selectAll('rect')
            .data(data, chart.keyValue);
        },
        insert: function() {
          var chart = this.chart();

          return this.append('rect')
            .classed('chart-bar', true)
            .attr('style', chart.itemStyle);
        },
        events: {
          'enter': function() {
            var chart = this.chart();

            if (!chart.invertedXY()) {
              this
                .attr('y', chart.y0)
                .attr('height', 0);  
            }
            else {
              this
                .attr('x', chart.x0)
                .attr('width', 0);
            }
          },
          'merge': function() {
            var chart = this.chart();

            if (!chart.invertedXY()) {
              this
                .attr('x', chart.barX)
                .attr('width', chart.itemWidth);
            }
            else {
              this
                .attr('y', chart.barY)
                .attr('height', chart.itemWidth);   
            }
          },
          'merge:transition': function() {
            var chart = this.chart();

            if (!chart.invertedXY()) {
              this
                .attr('y', chart.barY)
                .attr('height', chart.barHeight);
            }
            else {
              this
                .attr('x', chart.barX)
                .attr('width', chart.barHeight);
            }
          },
          'exit': function() {
            this.remove();
          }
        }
      });
    },

    barHeight: di(function(chart, d, i) {
      if (chart.invertedXY()) {
        return Math.abs(chart.x.call(this, d, i) - chart.x0.call(this, d, i));
      }
      else {
        var height = Math.abs(chart.y0.call(this, d, i) - chart.y.call(this, d, i)); 
        return height > 0 ? height - chart.barOffset() : 0;
      }
    }),
    barX: di(function(chart, d, i) {
      if (chart.invertedXY()) {
        var x = chart.x.call(this, d, i);
        var x0 = chart.x0();

        return x < x0 ? x : x0 + chart.barOffset();
      }
      else {
        return chart.x.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
      }
    }),
    barY: di(function(chart, d, i) {
      if (chart.invertedXY()) {
        return chart.y.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
      }
      else {
        var y = chart.y.call(this, d, i);
        var y0 = chart.y0();

        return y < y0 ? y : y0 + chart.barOffset();
      }
    }),
    displayAdjacent: property('displayAdjacent', {defaultValue: true}),

    barOffset: function barOffset() {
      if (!this.__axis) {
        if (!this.invertedXY())
          this.__axis = d3.select(this.base[0][0].parentNode).select('[data-id="axis.x"] .domain');
        else
          this.__axis = d3.select(this.base[0][0].parentNode).select('[data-id="axis.y"] .domain');
      }
      
      var axisThickness = this.__axis[0][0] && parseInt(this.__axis.style('stroke-width')) || 0;
      return axisThickness / 2;
    },

    insertSwatch: function() {
      return this.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', 20).attr('height', 20)
        .attr('class', 'chart-bar');
    }
  }));
  
  /**
    Stacked Bars
  */
  d3.chart('Bars').extend('StackedBars', {
    transform: function(data) {
      // Re-initialize bar positions each time data changes
      this.barPositions = [];
      return data;
    },

    barHeight: di(function(chart, d, i) {
      if (chart.invertedXY()) {
        return Math.abs(chart.x.call(this, d, i) - chart.x0.call(this, d, i));
      }
      else {
        var height = Math.abs(chart.y0.call(this, d, i) - chart.y.call(this, d, i));
        var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
        return height > 0 ? height - offset : 0;
      }
    }),
    barX: di(function(chart, d, i) {
      if (chart.invertedXY()) {
        var x = chart.x.call(this, d, i);
        var x0 = chart.x0();

        // Only handle positive x-values
        if (x < x0) return;

        if (chart.barPositions.length <= i)
          chart.barPositions.push(0);

        var previous = chart.barPositions[i];
        chart.barPositions[i] = previous + (x - x0);

        var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
        return previous + offset;
      }
      else {
        return chart.x.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
      }
    }),
    barY: di(function(chart, d, i) {
      if (chart.invertedXY()) {
        return chart.y.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
      }
      else {
        var y = chart.y.call(this, d, i);
        var y0 = chart.y0();

        // Only handle positive y-values
        if (y > y0) return;

        if (chart.barPositions.length <= i)
          chart.barPositions.push(0);

        var previous = chart.barPositions[i] || y0;
        var newPosition = previous - (y0 - y);

        chart.barPositions[i] = newPosition;
        
        return newPosition;
      }
    }),

    displayAdjacent: property('displayAdjacent', {defaultValue: false})
  });

})(d3, d3.chart.helpers, d3.chart.extensions);

(function(d3, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Line
    (x,y) line graph
  */
  d3.chart('SeriesChart').extend('Line', mixin(extensions.XYSeries, extensions.LabelsSeries, {
    initialize: function() {
      this.seriesLayer('Lines', this.base.append('g').classed('chart-lines', true), {
        dataBind: function(data) {
          var chart = this.chart();
          var lines = {};

          // Add lines based on underlying series data
          _.each(chart.data(), function(series) {
            lines[series.seriesIndex] = chart.createLine(series);
          });
          chart.lines(lines);

          // Rather than use provided series data
          return this.selectAll('path')
            .data(function(d, i) {
              return [chart.data()[i]];
            }, chart.seriesKey);
        },
        insert: function() {
          var chart = this.chart();

          return this.append('path')
            .classed('chart-line', true)
            .attr('style', chart.itemStyle);
        },
        events: {
          'merge:transition': function() {
            var chart = this.chart();
            var lines = chart.lines();

            this
              .attr('d', function(d, i) {
                return lines[chart.seriesIndex.call(this, d, i)](chart.seriesValues.call(this, d, i));
              })
              .attr('style', chart.itemStyle);
          }
        }
      });
    },
    lines: property('lines', {defaultValue: {}}),

    createLine: function(series) {
      var line = d3.svg.line()
        .x(this.x)
        .y(this.y);

      var interpolate = series.interpolate || this.options().interpolate;
      if (interpolate)
        line.interpolate(interpolate);

      return line;
    },
    insertSwatch: function() {
      return this.append('line')
        .attr('x1', 0).attr('y1', 10)
        .attr('x2', 20).attr('y2', 10)
        .attr('class', 'chart-line');
    }
  }));
  
  /**
    LineValues
    Line graph for centered key,value data
  */
  d3.chart('Line').extend('LineValues', extensions.ValuesSeries);

})(d3, d3.chart.helpers, d3.chart.extensions);

(function(d3, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Title

    Properties:
    - {String} title
    - {Object} style
    - {Number} rotation
  */
  d3.chart('Component').extend('Title', {
    initialize: function() {
      this.redrawFor('title', 'rotation');

      this.layer('Title', this.base.append('g').classed('chart-title', true), {
        dataBind: function(data) {
          // TODO Look into databound titles
          return this.selectAll('text')
            .data([0]);
        },
        insert: function() {
          return this.append('text');
        },
        events: {
          merge: function() {
            var chart = this.chart();
            this
              .attr('transform', chart.transformation())
              .attr('style', chart.style())
              .attr('alignment-baseline', 'middle')
              .attr('text-anchor', 'middle')
              .attr('class', chart.options()['class'])
              .text(chart.text());
          }
        }
      });
    },

    text: property('text', {
      get: function() {
        return this.options().text;
      }
    }),
    rotation: property('rotation', {
      defaultValue: function() {
        var rotateByPosition = {
          right: 90,
          left: -90
        };

        return rotateByPosition[this.position()] || 0;
      }
    }),

    transformation: function() {
      var translate = helpers.transform.translate(this.width() / 2, this.height() / 2);
      var rotate = helpers.transform.rotate(this.rotation());

      return translate + rotate;
    },
  });
  
})(d3, d3.chart.helpers, d3.chart.extensions);

(function(d3, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Axis
    Add axis for given (x,y) series data

    Properties:
    - {String} [position = bottom] top, right, bottom, left, x0, y0
    - {x, y} [translation] of axis relative to chart bounds
    - {String} [orient = bottom] top, right, bottom, left
    - {String} [orientation = horizontal] horizontal, vertical

    Available d3 Axis Extensions:
    - ticks
    - tickValues
    - tickSize
    - innerTickSize
    - outerTickSize
    - tickPadding
    - tickFormat
  */
  d3.chart('Component').extend('Axis', mixin(extensions.XYSeries, {
    initialize: function() {
      // Transfer generic scale options to specific scale for axis
      this.on('change:scale', function() {
        if (this.options().scale) {
          var scale = this.isXAxis() ? 'xScale' : 'yScale';
          this[scale](helpers.createScaleFromOptions(this.options().scale));
        }
      }.bind(this));
      this.on('change:options', function() {
        this.trigger('change:scale');
      }.bind(this));
      this.trigger('change:scale');

      this.axis = d3.svg.axis();
      this.axisLayer = this.base.append('g').attr('class', 'chart-axis');

      if (this.options().display) {
        this.layer('Axis', this.axisLayer, {
          dataBind: function(data) {
            // Force addition of just one axis with dummy data array
            // (Axis will be drawn using underlying chart scales)
            return this.selectAll('g')
              .data([0]);
          },
          insert: function() {
            return this.append('g');
          },
          events: {
            merge: function() {
              var chart = this.chart();

              // Setup axis (scale and properties)
              chart._setupAxis();

              // Place and render axis
              this
                .attr('transform', chart.translation())
                .call(chart.axis);
            }
          }
        });
      }
      else {
        this.skipLayout = true;
      }
    },

    position: property('position', {
      defaultValue: 'bottom',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left', 'x0', 'y0'], value);
      }
    }),

    translation: property('translation', {
      defaultValue: function() {
        var translationByPosition = {
          top: {x: 0, y: 0},
          right: {x: this.width(), y: 0},
          bottom: {x: 0, y: this.height()},
          left: {x: 0, y: 0},
          x0: {x: this.x0(), y: 0},
          y0: {x: 0, y: this.y0()}
        };
        
        return translationByPosition[this.position()];
      },
      get: function(value) {
        return helpers.translate(value);
      }
    }),

    orient: property('orient', {
      defaultValue: function() {
        var orient = this.position();
        
        if (orient == 'x0')
          orient = 'left';
        else if (orient == 'y0')
          orient = 'bottom';
        
        return orient;
      }
    }),

    orientation: property('orientation', {
      validate: function(value) {
        return _.contains(['horizontal', 'vertical'], value);
      },
      defaultValue: function() {
        var byPosition = {
          top: 'horizontal',
          right: 'vertical',
          bottom: 'horizontal',
          left: 'vertical',
          x0: 'vertical',
          y0: 'horizontal'
        };

        return byPosition[this.position()];
      }
    }),
    type: property('type'),

    ticks: property('ticks', {type: 'Function'}),
    tickValues: property('tickValues', {type: 'Function'}),
    tickSize: property('tickSize', {type: 'Function'}),
    innerTickSize: property('innerTickSize', {type: 'Function'}),
    outerTickSize: property('outerTickSize', {type: 'Function'}),
    tickPadding: property('tickPadding', {type: 'Function'}),
    tickFormat: property('tickFormat', {type: 'Function'}),

    layoutHeight: function() {
      return this._labelOverhang().height;
    },
    layoutWidth: function() {
      return this._labelOverhang().width;
    },
    layoutPosition: function() {
      if (this.position() == 'x0')
        return 'bottom';
      else if (this.position() == 'y0')
        return 'right';
      else
        return this.position();
    },
    setLayout: function(x, y, options) {
      // Axis is positioned with chartBase, so don't set layout
      return;
    },

    isXAxis: function() {
      return this.type() == 'x';
    },
    isYAxis: function() {
      return this.type() == 'y';
    },

    _setupAxis: function() {
      // Get scale by orientation
      var scale = this.isXAxis() ? this._xScale() : this._yScale();

      // Setup axis
      this.axis.scale(scale);

      var extensions = ['orient', 'ticks', 'tickValues', 'tickSize', 'innerTickSize', 'outerTickSize', 'tickPadding', 'tickFormat'];
      var arrayExtensions = ['tickValues'];
      _.each(extensions, function(key) {
        var value = this[key] && this[key]();
        if (!_.isUndefined(value)) {
          // If value is array, treat as arguments array
          // otherwise, pass in directly
          if (_.isArray(value) && !_.contains(arrayExtensions, key))
            this.axis[key].apply(this.axis, value);
          else
            this.axis[key](value);
        }
      }, this);
    },

    _labelOverhang: function() {
      // TODO Look into overhang relative to chartBase (for x0, y0)
      var overhangs = {width: [0], height: [0]};
      var orientation = this.orientation();

      this.axisLayer.selectAll('.tick').each(function() {
        if (orientation == 'horizontal')
          overhangs.height.push(this.getBBox().height);
        else
          overhangs.width.push(this.getBBox().width);
      });

      return {
        width: _.max(overhangs.width),
        height: _.max(overhangs.height)
      };
    }
  }));
  
  /**
    AxisValues
    Axis component for (key,value) series data
  */
  d3.chart('Axis').extend('AxisValues', extensions.ValuesSeries);
  
})(d3, d3.chart.helpers, d3.chart.extensions);

(function(d3, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Legend
  */
  d3.chart('Component').extend('Legend', {
    initialize: function() {
      this.legend = this.base.append('g')
        .classed('chart-legend', true);

      if (this.options().display) {
        this.layer('Legend', this.legend, {
          dataBind: function(data) {
            var chart = this.chart();
            return this.selectAll('g')
              .data(data, chart.dataKey.bind(chart));
          },
          insert: function() {
            var chart = this.chart();
            var groups = this.append('g')
              .attr('class', chart.dataGroupClass);

            groups.append('g')
              .attr('width', 20)
              .attr('height', 20)
              .attr('class', 'chart-legend-swatch');
            groups.append('text')
              .attr('class', 'chart-legend-label chart-label')
              .attr('transform', helpers.translate(25, 0));
            
            return groups;
          },
          events: {
            merge: function() {
              var chart = this.chart();

              this.select('g').each(chart.createSwatch);
              this.select('text')
                .text(chart.dataValue)
                .attr('alignment-baseline', 'before-edge');

              // Position groups after positioning everything inside
              var directionByPosition = {
                top: 'horizontal',
                right: 'vertical',
                bottom: 'horizontal',
                left: 'vertical'
              };
              this.call(helpers.stack.bind(this, {direction: directionByPosition[chart.position()], origin: 'top', padding: 5}));
            }
          }
        });
      }
      else {
        this.skipLayout = true;
      }
    },
    isLegend: true,

    transform: function(allData) {
      var extractData = d3.chart('Multi').prototype.extractData;
      var data = _.reduce(this.options().charts, function(data, chart) {
        if (chart.excludeFromLegend)
          return data;

        var chartData = _.map(extractData(chart, allData), function(series, index) {
          return {
            chart: chart,
            series: series,
            seriesIndex: index
          };
        });

        return data.concat(chartData);
      }, [], this);
      
      return data;
    },

    dataKey: di(function(chart, d, i) {
      return d.chart.id + '.' + d.series.name;
    }),
    dataValue: di(function(chart, d, i) {
      return d.series.name;
    }),
    dataGroupClass: di(function(chart, d, i) {
      return 'chart-legend-group';
    }),
    dataSeriesClass: di(function(chart, d, i) {
      return 'chart-series chart-index-' + (d.seriesIndex || 0);
    }),
    dataClass: di(function(chart, d, i) {
      var classes = [chart.dataSeriesClass.call(this, d, i)];
      if (d.chart.options()['class'])
        classes.push(d.chart.options()['class']);
      if (d.series['class'])
        classes.push(d.series['class']);

      return classes.join(' ') || null;
    }),
    dataStyle: di(function(chart, d, i) {
      var styles = _.defaults({}, d.series.style, d.chart.options().style);
      
      return helpers.style(styles) || null;
    }),

    createSwatch: di(function(chart, d, i) {
      var selection = d3.select(this);

      // Clear existing swatch
      selection.empty();
      selection
        .attr('class', chart.dataClass);

      var inserted;
      if (d && d.chart && _.isFunction(d.chart.insertSwatch)) {
        selection.chart = function() { return chart; };
        inserted = d.chart.insertSwatch.call(selection);
      }
      else {
        // Simple colored circle
        inserted = selection.append('circle')
          .attr('cx', 10)
          .attr('cy', 10)
          .attr('r', 10)
          .attr('class', 'chart-swatch');
      }

      // Style inserted element
      if (inserted && _.isFunction(inserted.attr)) {
        inserted.attr('style', chart.dataStyle.call(this, d, i));
      }
    })
  });
  
  /**
    Inset legend
    Legend positioned within chart bounds

    Properties:
    - {Object} position {x,y} coordinates of legend origin relative chart bounds
  */
  d3.chart('Legend').extend('InsetLegend', {
    initialize: function() {
      this._positionLegend();
    },

    position: property('position', {
      defaultValue: {x: 10, y: 10},
      set: function(value, previous) {
        value = (value && _.isObject(value)) ? value : {};
        value = _.defaults(value, previous || {}, {x: 0, y: 0});

        return {
          override: value,
          after: function() {
            this._positionLegend();
          }
        };
      }
    }),
    skipLayout: true,

    _positionLegend: function() {
      if (this.legend) {
        var position = this.position();
        this.legend.attr('transform', helpers.translate(position.x, position.y));
      }
    }
  });
  
})(d3, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  /**
    Multi chart

    Configure chart based on given options, including adding charts, axes, legend, and other properties

    @example
    ```javascript
    var chart = d3.select('#chart')
      .append('svg')
      .chart('Multi', {
        type: 'Values'
        charts: [
          {type: 'Bars', dataKey: 'participation', itemPadding: 20},
          {type: 'Line', dataKey: 'results', labels: {position: 'top'}}
        ],
        axes: {
          y: {scale: {domain: [0, 20000]}},
          secondaryY: {dataKey: 'results', scale: {domain: [0, 70]}}
        }
      })
      .width(600)
      .height(400)
      .chartMargins({top: 10});
    ```

    @param {Object} options
    - charts: {Array} of chart definitions
      - type: Matches Chart name (Line, LineValues, Bars)
      - dataKey: Key for extracting chart data from data object
      - other chart properties (e.g. xScale/yScale: {type, domain}, itemPadding, labelPosition, etc.)
    - axes: {Array} of axis definitions
      - type: [Axis] Matches Axis name (Axis, AxisValues)
      - dataKey: Key for extracting axis data from data object
      - other axis properties
    - legend: {Object} of legend properties
      - dataKey: Key for extracting legend data from data object
      - position: top, right, bottom, left
      - other legend properties
  */
  d3.chart('Container').extend('Multi', {
    initialize: function() {
      this.redrawFor('title', 'charts', 'axes', 'legend');
    },

    options: property('options', {
      defaultValue: {},
      set: function(options) {
        if (!options) return;
        
        helpers.log.time('Multi#options');
        this.type(options.type || 'XY', {silent: true});
        this.invertedXY(options.invertedXY || false, {silent: true});
        
        this.axes(options.axes, {silent: true});
        this.charts(options.charts, {silent: true});
        this.components(options.components, {silent: true});
        this.legend(options.legend, {silent: true});
        this.title(options.title, {silent: true});
        helpers.log.timeEnd('Multi#options');

        // To avoid changing underlying and then redraw failing due to no "change"
        // store cloned options
        return {
          override: _.clone(options)
        };
      }
    }),

    // General options
    type: property('type', {
      defaultValue: 'XY'
    }),
    invertedXY: property('invertedXY', {
      defaultValue: false
    }),

    title: property('title', {
      set: function(options, title, setOptions) {
        var changed = false;
        var silent = _.isBoolean(setOptions && setOptions.silent) && setOptions.silent || false;
        
        if (!options || _.isEmpty(options)) {
          // Remove title if no options are given
          this.detachComponent('title');

          return {
            override: undefined
          };
        }

        // Title may be set directly
        if (_.isString(options))
          options = {text: options};

        // Load defaults
        options = _.defaults({}, options, d3.chart('Multi').defaults.title, {invertedXY: this.invertedXY()});
        
        if (!title) {
          // Create title
          var Title = helpers.resolveChart(options.type, 'Title', this.type());
          title = new Title(this.componentLayer({zIndex: helpers.zIndex.title}), options);

          this.attachComponent('title', title);
          changed = true;
        }
        else if (!_.isEqual(title.options(), options)) {
          // Update existing title options
          title.options(options, {silent: silent});
          changed = true;
        }

        return {
          override: title,

          // Updating existing object causes change determination to always be false,
          // so keep track explicitly
          changed: silent ? false : changed
        };
      }
    }),

    charts: property('charts', {
      set: function(options, charts, setOptions) {
        options = options || {};
        charts = charts || {};
        var removeIds = _.difference(_.keys(charts), _.keys(options));
        var changed = removeIds.length > 0;
        var silent = _.isBoolean(setOptions && setOptions.silent) && setOptions.silent || false;
                
        _.each(removeIds, function(removeId) {
          this.detachChart(removeId);
          delete charts[removeId];
        }, this);

        _.each(options, function(chartOptions, chartId) {
          var chart = charts[chartId];
          chartOptions = _.defaults({}, chartOptions, d3.chart('Multi').defaults.charts, {invertedXY: this.invertedXY()});

          if (!chart) {
            // Create chart
            var Chart = helpers.resolveChart(chartOptions.type, 'Chart', this.type());
            chart = new Chart(this.chartLayer(), chartOptions);

            this.attachChart(chartId, chart);
            charts[chartId] = chart;
            changed = true;
          }
          else if (!_.isEqual(chart.options(), chartOptions)) {
            // Update chart
            chart.options(chartOptions, {silent: silent});
            changed = true;
          }
        }, this);

        return {
          override: charts,
          changed: silent ? false : changed,
          after: function() {
            this.bindChartScales();
          }
        };
      },
      defaultValue: {}
    }),

    axes: property('axes', {
      set: function(options, axes, setOptions) {
        options = options || {};
        axes = axes || {};
        var axisIds = _.uniq(['x', 'y'].concat(_.keys(options)));
        var removeIds = _.difference(_.keys(axes), axisIds);
        var changed = removeIds.length > 0;
        var silent = _.isBoolean(setOptions && setOptions.silent) && setOptions.silent || false;

        _.each(removeIds, function(removeId) {
          this.detachComponent('axis.' + removeId);
          this.detachComponent('axis_title.' + removeId);
          delete axes[removeId];
        }, this);

        _.each(axisIds, function(axisId) {
          var axis = axes[axisId];
          var positionByInvertedAndId = {
            notInverted: {
              x: 'bottom',
              y: 'left',
              secondaryX: 'top',
              secondaryY: 'right'
            },
            inverted: {
              x: 'left',
              y: 'bottom',
              secondaryX: 'right',
              secondaryY: 'top'
            }
          };
          var axisOptions = {
            position: positionByInvertedAndId[this.invertedXY() ? 'inverted' : 'notInverted'][axisId],
            type: axisId == 'y' || axisId == 'secondaryY' ? 'y' : 'x'
          };

          if (options[axisId] === false)
            axisOptions = _.defaults({display: false}, axisOptions, d3.chart('Multi').defaults.axes, {invertedXY: this.invertedXY()});
          else
            axisOptions = _.defaults({}, options[axisId], axisOptions, d3.chart('Multi').defaults.axes, {invertedXY: this.invertedXY()});

          if (axisId != 'x' && axisId != 'y' && !axisOptions.dataKey)
            throw new Error('d3.chart.Multi: dataKey(s) are required for axes other than x and y');

          if (!axis) {
            // Create axis
            var Axis = helpers.resolveChart(axisOptions.type, 'Axis', this.type());
            axis = new Axis(this.chartLayer({zIndex: helpers.zIndex.axis}), axisOptions);

            this.attachComponent('axis.' + axisId, axis);
            axes[axisId] = axis;
            changed = true;
          }
          else {
            // Check for changed from options
            if (!_.isEqual(axis.options(), axisOptions))
              changed = true;

            axis.options(axisOptions, {silent: silent});
            
            // Manually trigger change:scale (if necessary)
            if (silent)
              axis.trigger('change:scale');
          }

          // Create axis title
          if (axisOptions.title) {
            var id = 'axis_title.' + axisId;
            var title = this.componentsById[id];
            var titleOptions = _.isString(axisOptions.title) ? {text: axisOptions.title} : axisOptions.title;
            titleOptions = _.defaults({}, titleOptions, {position: axisOptions.position, 'class': 'chart-title-axis'});

            if (!title) {
              var Title = helpers.resolveChart(titleOptions.type, 'Title', this.type());  
              title = new Title(this.componentLayer({zIndex: helpers.zIndex.title}), titleOptions);

              this.attachComponent(id, title);
            }
            else {
              title.options(titleOptions, {silent: silent});
            }
          }
        }, this);

        // Setup filter keys for x and y axes
        _.each(['x', 'y'], function(axisId) {
          var axis = axes[axisId];

          // Don't need to filter keys if dataKey already set
          if (axis.options().dataKey)
            return;  

          var filterKeys = [];
          _.each(axes, function(filterAxis, filterKey) {
            if ((axisId == 'x' && !filterAxis.isXAxis()) || (axisId == 'y' && !filterAxis.isYAxis()))
              return;

            var dataKey = filterAxis.options().dataKey;
            if (dataKey)
              filterKeys = filterKeys.concat(_.isArray(dataKey) ? dataKey : [dataKey]);
          }, this);

          if (!_.isEqual(axis.options().filterKeys, filterKeys))
            changed = true;

          // Set filterKeys "internally" to avoid change firing
          axis.options().filterKeys = filterKeys;
        }, this);

        return {
          override: axes,
          changed: silent ? false : changed,
          after: function() {
            this.bindChartScales();
          }
        };    
      },
      defaultValue: {}
    }),

    legend: property('legend', {
      set: function(options, legend, setOptions) {
        options = options === false ? {display: false} : (options || {});
        options = _.defaults({}, options, d3.chart('Multi').defaults.legend);
        var changed = false;
        var silent = _.isBoolean(setOptions && setOptions.silent) && setOptions.silent || false;

        // Load chart information
        if (options.dataKey) {
          // Load only charts matching dataKey(s)
          var dataKeys = _.isArray(options.dataKey) ? options.dataKey : [options.dataKey];
          options.charts = _.filter(this.charts(), function(chart) {
            return _.contains(dataKeys, chart.options().dataKey);
          });
        }
        else {
          options.charts = this.charts();
        }

        // If switching from outside to inset, need to change legend base layer, so remove
        if (legend && legend.options().type != options.type) {
          // TODO Possible alternates for changing base of legend
          this.detachComponent('legend');
          legend = undefined;
        }

        if (!legend) {
          var Legend = helpers.resolveChart(options.type, 'Legend', this.type());
          var base = options.type == 'Inset' || options.type == 'InsetLegend' ? this.chartLayer({zIndex: helpers.zIndex.legend}) : this.componentLayer({zIndex: helpers.zIndex.legend});
          legend = new Legend(base, options);

          this.attachComponent('legend', legend);
          changed = true;
        }
        else {
          if (!_.isEqual(legend.options(), options))
            changed = true;

          legend.options(options, {silent: silent});
        }

        return {
          override: legend,
          changed: silent ? false : changed
        };
      }
    }),

    components: property('components', {
      set: function(options, components, setOptions) {
        options = options || {};
        components = components || {};
        var removeIds = _.difference(_.keys(components), _.keys(options));
        var changed = removeIds.length > 0;
        var silent = _.isBoolean(setOptions && setOptions.silent) && setOptions.silent || false;

        _.each(removeIds, function(removeId) {
          this.detachComponent(removeId);
          delete components[removeId];
        }, this);

        _.each(options, function(componentOptions, componentId) {
          var component = components[componentId];
          componentOptions = _.defaults({}, componentOptions);

          if (!component) {
            // Create component
            var Component = helpers.resolveChart(componentOptions.type, 'Component', this.type());
            var layer = Component.layer && Component.layer == 'chart' ? this.chartLayer() : this.componentLayer();

            component = new Component(layer, componentOptions);

            this.attachComponent(componentId, component);
            components[componentId] = component;
            changed = true;
          }
          else if (!_.isEqual(component.options(), componentOptions)) {
            component.options(componentOptions, {silent: silent});
            charted = true;
          }
        }, this);

        return {
          override: components,
          changed: silent ? false : changed,
          after: function(components) {
            _.each(components, function(component) {
              if (_.isFunction(component.xScale) && _.isFunction(component.yScale)) {
                component.xScale = this.axes().x._xScale.bind(this.axes().x);
                component.yScale = this.axes().y._yScale.bind(this.axes().y);
              }
            }, this);
          }
        };
      }
    }),
  
    draw: function(data, options) {
      if (!_.isUndefined(options))
        this.options(options, {silent: true});

      d3.chart('Container').prototype.draw.call(this, data);
    },

    demux: function(name, data) {
      var item = this.chartsById[name] || this.componentsById[name];

      if (item)
        return this.extractData(item, data);
      else
        return data;
    },

    extractData: function(item, data) {
      var dataKey = item.options().dataKey;
      var filterKeys = item.options().filterKeys;

      // Legends need all data (filter by charts)
      if (item && item.isLegend)
        return data;

      // Use dataKey or filterKeys if specified, otherwise use all data
      if (dataKey || filterKeys) {
        var dataKeys = _.isArray(dataKey) ? dataKey : (dataKey ? [dataKey] : []);
        filterKeys = _.isArray(filterKeys) ? filterKeys : (filterKeys ? [filterKeys] : []);

        var filtered = _.reduce(data, function(memo, series, key) {
          var exclude = _.contains(filterKeys, key);
          var include = _.contains(dataKeys, key);
          var includeAll = !dataKeys.length;

          if ((include || includeAll) && !exclude)
            return memo.concat(series);
          else
            return memo;
        }, []);

        return filtered;
      }
      else {
        return data;
      }
    },

    bindChartScales: function() {
      _.each(this.charts(), function(chart) {
        // Get scales for chart
        chart.xScale = this.getScale(chart.options().dataKey, 'x');
        chart.yScale = this.getScale(chart.options().dataKey, 'y');
      }, this);
    },

    getScale: function(dataKey, type) {
      var match = _.find(this.axes(), function(axis) {
        if ((type == 'x' && !axis.isXAxis()) || (type == 'y' && !axis.isYAxis()))
          return false;

        var axisDataKey = axis.options().dataKey;
        return _.isArray(axisDataKey) ? _.contains(axisDataKey, dataKey) : axisDataKey == dataKey;
      });
      var axis = match || this.axes()[type];
      var scaleKey = type == 'x' ? '_xScale' : '_yScale';

      return axis[scaleKey].bind(axis);
    }
  }, {
    defaults: {
      charts: {
        type: 'Line'
      },
      axes: {
        display: true
      },
      legend: {
        display: true,
        position: 'right'
      },
      title: {
        position: 'top',
        'class': 'chart-title-main'
      }
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
