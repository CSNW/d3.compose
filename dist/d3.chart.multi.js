/*! d3.chart.multi - v0.8.0
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

        getSet.previous = properties[name];
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
  */
  // Object extensions
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

  // Array extensions
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
    var isSVG = element ? element.nodeName == 'svg' : false;

    // Firefox throws error when calling getBBox when svg hasn't been displayed
    // ignore error and set to empty
    var boundingBox;
    try {
      boundingBox = element && typeof element.getBBox == 'function' && element.getBBox();
    }
    catch(ex) {}

    if (!boundingBox)
      boundingBox = {width: 0, height: 0};

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
    Determine if given data is likely series data
  */
  function isSeriesData(data) {
    var first = _.first(data);
    return first && _.isObject(first) && _.isArray(first.values);
  }

  /**
    Get max for array/series by value di
  */
  function max(data, getValue) {
    var getMax = function(data) {
      return data && d3.extent(data, getValue)[1];
    };

    if (isSeriesData(data)) {
      return _.reduce(data, function(memo, series, index) {
        if (series && _.isArray(series.values)) {
          var seriesMax = getMax(series.values);
          return seriesMax > memo ? seriesMax : memo;
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
      return _.reduce(data, function(memo, series, index) {
        if (series && _.isArray(series.values)) {
          var seriesMin = getMin(series.values);
          return seriesMin < memo ? seriesMin : memo;
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
          return _.map(data, getValue);
        };

        var allValues;
        if (isSeriesData(options.data)) {
          allValues = _.flatten(_.map(options.data, function(series) {
            if (series && _.isArray(series.values)) {
              return getValues(series.values);
            }
          }));
        }
        else {
          allValues = getValues(options.data);
        }

        scale.domain(_.uniq(allValues));
      }
      else {
        scale.domain([
          min(options.data, getValue), 
          max(options.data, getValue)
        ]);
      }      
    }

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
    Mixin mixins into prototype

    Designed specifically to work with d3-chart
    - transform is called from last to first
    - initialize is called from first to last
    - remaining are overriden from first to last  

    @param {Array or Object...} mixins Array of mixins or separate extension arguments
    @return {Object}
  */
  function mixin(mixins) {
    mixins = _.isArray(mixins) ? mixins : _.toArray(arguments);
    var mixed = _.extend.apply(this, [{}].concat(mixins));

    // Don't mixin constructor with prototype
    delete mixed.constructor;

    if (mixed.initialize) {
      mixed.initialize = function initialize() {
        var args = _.toArray(arguments);

        _.each(mixins, function(extension) {
          if (extension.initialize)
            extension.initialize.apply(this, args);
        }, this);
      };
    }
    if (mixed.transform) {
      mixed.transform = function transform(data) {
        return _.reduceRight(mixins, function(data, extension) {
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
    isSeriesData: isSeriesData,
    max: max,
    min: min,
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
    mixins for handling series data
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
    isXY: true,

    xKey: property('xKey', {defaultValue: 'x'}),
    yKey: property('yKey', {defaultValue: 'y'}),

    xScale: property('xScale', {
      type: 'Function',
      set: function(value) {
        var scale = helpers.createScaleFromOptions(value);
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
        var scale = helpers.createScaleFromOptions(value);
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
        return +valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        var max = helpers.max(this.data(), this.xValue);
        return +valueOrDefault(value, max);
      }
    }),
    yMin: property('yMin', {
      get: function(value) {
        var min = helpers.min(this.data(), this.yValue);

        // Default behavior: if min is less than zero, use min, otherwise use 0
        return +valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    yMax: property('yMax', {
      get: function(value) {
        var max = helpers.max(this.data(), this.yValue);
        return +valueOrDefault(value, max);
      }
    }),

    initialize: function() {
      // Set scale range once chart has been rendered
      // TODO Better event than change:data
      this.on('change:data', this.setScales.bind(this));
      this.setScales();
    },

    x: di(function(chart, d, i) {
      return +chart.xScale()(chart.xValue.call(this, d, i));
    }),
    y: di(function(chart, d, i) {
      return +chart.yScale()(chart.yValue.call(this, d, i));
    }),
    x0: di(function(chart, d, i) {
      return +chart.xScale()(0);
    }),
    y0: di(function(chart, d, i) {
      return +chart.yScale()(0);
    }),

    xValue: di(function(chart, d, i) {
      return d[chart.xKey()];
    }),
    yValue: di(function(chart, d, i) {
      return d[chart.yKey()];
    }),
    keyValue: di(function(chart, d, i) {
      return !_.isUndefined(d.key) ? d.key : chart.xValue.call(this, d, i);
    }),

    setScales: function() {
      this.setXScaleRange(this.xScale());
      this.setYScaleRange(this.yScale());
    },

    setXScaleRange: function(xScale) {
      xScale.range([0, this.width()]);
    },
    setYScaleRange: function(yScale) {
      yScale.range([this.height(), 0]);
    },

    getDefaultXScale: function() {
      return helpers.createScaleFromOptions({
        data: this.data(),
        key: this.xKey()
      });
    },
    getDefaultYScale: function() {
      return helpers.createScaleFromOptions({
        data: this.data(),
        key: this.yKey()
      });
    }
  };

  /**
    TODO Remove
  */
  var XYSeries = {};

  /**
    mixins for charts of centered key,value data (x: index, y: value, key)
  
    Properties:
    - [itemPadding = 0.1] {Number} % padding between each item (for ValuesSeries, padding is just around group, not individual series items)
    Dependencies: XY
  */
  var Values = {
    isValues: true,

    // Define % padding between each item
    // (If series is displayed adjacent, padding is just around group, not individual series)
    itemPadding: property('itemPadding', {defaultValue: 0.1}),

    setXScaleRange: function(xScale) {
      if (_.isFunction(xScale.rangeBands)) {
        xScale.rangeBands(
          [0, this.width()], 
          this.itemPadding(), 
          this.itemPadding() / 2
        );
      }
      else {
        XY.setXScaleRange.call(this, xScale);
      }
    },

    getDefaultXScale: function() {
      return helpers.createScaleFromOptions({
        type: 'ordinal',
        data: this.data(),
        key: this.xKey()
      });
    },
  };

  /**
    mixins for charts of centered key,value series data (x: index, y: value, key)

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
      return chart.displayAdjacent() ? chart.adjacentX.call(this, d, i) : chart.layeredX.call(this, d, i);
    }),

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
      return chart.xScale()(chart.xValue.call(this, d, i)) + 0.5 * chart.layeredWidth.call(this) || 0;
    }),
    layeredWidth: di(function(chart, d, i) {
      var rangeBand = chart.xScale().rangeBand();
      return isFinite(rangeBand) ? rangeBand : 0;
    }),

    // determine item width based on series display type (adjacent or layered)
    itemWidth: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentWidth.call(this, d, i) : chart.layeredWidth.call(this, d, i);
    })
  };

  /**
    mixins for handling labels in charts

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
              style: _.extend({}, this.labelStyle(), point['labelStyle']),
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
        style: _.extend({}, this.labelStyle(), point['labelStyle']),
        values: point.values,
        index: point.index
      };
    }
  };

  /**
    mixins for handling labels in series charts

    Dependencies: Labels
  */
  var LabelsSeries = {
    _getLabels: function() {
      var seriesLabels = [];

      if (this.labelDisplay()) {
        seriesLabels = _.compact(_.map(this.data(), function(series, seriesIndex) {
          if (series.excludeFromLabels) return;

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
                style: _.extend({}, this.labelStyle(), point['labelStyle']),
                values: point,
                index: pointIndex,
              };
            }, this)
          };
        }, this));
      }
      
      return seriesLabels;
    }
  };

  // Expose mixins
  d3.chart.mixins = _.extend(d3.chart.mixins || {}, {
    Series: Series,
    XY: XY,
    XYSeries: _.extend({}, Series, XY, XYSeries),
    Values: _.extend({}, XY, Values),
    ValuesSeries: _.extend({}, Series, XY, XYSeries, Values, ValuesSeries),
    Labels: Labels,
    LabelsSeries: _.extend({}, Labels, LabelsSeries)
  });

})(d3, _, d3.chart.helpers);

(function(d3, _, helpers, mixins) {
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
      defaultValue: {},
      set: function(options) {
        this.setFromOptions(options);
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
      Set any properties from options
    */
    setFromOptions: function(options) {
      _.each(options, function(value, key) {
        if (this[key] && this[key].isProperty && this[key].setFromOptions)
          this[key](value, {silent: true});
      }, this);
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

})(d3, _, d3.chart.helpers, d3.chart.mixins);

(function(d3, _, helpers, mixins) {
  var property = helpers.property;
  
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
  d3.chart('Chart').extend('SeriesChart', mixins.Series);

})(d3, _, d3.chart.helpers, d3.chart.mixins);

(function(d3, _, helpers, mixins) {
  var property = helpers.property;

  /**
    Container
    Foundation for chart and component placement

    Properties:
    - {Object/Array} rawData
    - {Object} margins {top, right, bottom, left} in px
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

      this.base.classed('chart-container', true);

      this.options(options || {});
      this.redrawFor('options');

      this.on('change:dimensions', this.redraw);
      this.attachHoverListeners();
    },

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
      defaultValue: {top: 0, right: 0, bottom: 0, left: 0},
      set: function(values) {
        return {
          override: _.defaults({}, values, {top: 0, right: 0, bottom: 0, left: 0}),
          after: function() {
            this.trigger('change:dimensions');
          }
        };
      }
    }),

    /**
      Chart position (generally used internally)

      @param {Object} value {top, right, bottom, left}
    */
    chartPosition: property('chartPosition', {
      defaultValue: function() {
        return {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          width: this.width(),
          height: this.height()
        };
      },
      set: function(values) {
        return {
          override: _.defaults({}, values, {
            width: this.width() - values.right - values.left,
            height: this.height() - values.bottom - values.top
          })
        };
      }
    }),

    /**
      Get/set overall width/height of Container
    */
    width: property('width', {
      defaultValue: function() {
        return d3.chart('Base').prototype.width.call(this);
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    }),
    height: property('height', {
      defaultValue: function() {
        return d3.chart('Base').prototype.height.call(this);
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
      this.layout(data);
      helpers.log.timeEnd('Base#draw.layout');

      // Full draw now that everything has been laid out
      d3.chart().prototype.draw.call(this, data);

      helpers.log.timeEnd('Base#draw');
    },

    /**
      Redraw with existing data
    */
    redraw: function() {
      // Using previously saved rawData, redraw chart      
      if (this.rawData()) {
        helpers.log('redraw');
        this.draw(this.rawData());
      }
    },

    /**
      Get chart layer (for laying out with charts)

      @param {Object} options
      - zIndex
    */
    chartLayer: function(options) {
      options = _.defaults({}, options, {
        zIndex: helpers.zIndex.chart
      });

      return this.base.append('g')
        .attr('class', 'chart-layer')
        .attr('data-zIndex', options.zIndex);
    },

    /**
      Get component layer

      @param {Object} options
      - zIndex
    */
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

      component.on('change:position', this.redraw);
    },

    detachComponent: function(id) {
      var component = this.componentsById[id];
      if (!component) return;

      component.off('change:position');
      this._detach(id, component);
      delete this.componentsById[id];
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
      var chartPosition = _.extend({}, this.margins());
      _.each(layout, function(parts, key) {
        _.each(parts, function(part) {
          chartPosition[key] += part.offset || 0;
        });
      });
      this.chartPosition(chartPosition);

      // 4. Position layers with layout
      this._positionLayers(layout);
    },

    attachHoverListeners: function() {
      var inside;
      var trigger = this.trigger.bind(this);
      
      var throttledMouseMove = _.throttle(function(coordinates) {
        if (inside)
          trigger('move:mouse', coordinates);
      }, 50);

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

      var translateToXY = function(coordinates) {
        var x = coordinates[0];
        var y = coordinates[1];
        var chartPosition = this.chartPosition();
        var chartX = x - chartPosition.left;
        var chartY = y - chartPosition.top;
        
        // Set at chart bounds if outside of chart
        if (x > (chartPosition.left + chartPosition.width))
          chartX = chartPosition.left + chartPosition.width;
        else if (x < chartPosition.left)
          chartX = 0;

        if (y > (chartPosition.top + chartPosition.height))
          chartY = chartPosition.top + chartPosition.height;
        else if (y < chartPosition.top)
          chartY = 0;

        return {
          container: {x: x, y: y},
          chart: {x: chartX, y: chartY}
        };
      }.bind(this);
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

    _positionLayers: function(layout) {
      this._positionChartLayers();
      this._positionComponents(layout);
      this._positionByZIndex();      
    },

    _positionChartLayers: function() {
      var position = this.chartPosition();
      
      this.base.selectAll('.chart-layer')
        .attr('transform', helpers.transform.translate(position.left, position.top))
        .attr('width', position.width)
        .attr('height', position.height);
    },

    _positionComponents: function(layout) {
      var chart = this.chartPosition();
      var width = this.width();
      var height = this.height();
      
      _.reduce(layout.top, function(previous, part, index, parts) {
        var y = previous - part.offset;
        setLayout(part.component, chart.left, y, {width: chart.width});
        
        return y;
      }, chart.top);

      _.reduce(layout.right, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var x = previous + previousPart.offset;
        setLayout(part.component, x, chart.top, {height: chart.height});

        return x;
      }, width - chart.right);

      _.reduce(layout.bottom, function(previous, part, index, parts) {
        var previousPart = parts[index - 1] || {offset: 0};
        var y = previous + previousPart.offset;
        setLayout(part.component, chart.left, y, {width: chart.width});

        return y;
      }, height - chart.bottom);

      _.reduce(layout.left, function(previous, part, index, parts) {
        var x = previous - part.offset;
        setLayout(part.component, x, chart.top, {height: chart.height});

        return x;
      }, chart.left);

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

    // Extract layout from components
    _extractLayout: function(data) {
      var overallLayout = {top: [], right: [], bottom: [], left: []};
      _.each(this.componentsById, function(component) {
        if (component.skipLayout)
          return;

        var layout = component.getLayout(data);
        var position = layout && layout.position;

        if (!_.contains(['top', 'right', 'bottom', 'left'], position))
          return;

        overallLayout[position].push({
          offset: position == 'top' || position == 'bottom' ? layout.height : layout.width,
          component: component
        });
      });
      
      return overallLayout;
    },

    // TODO Refactor into charts
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

    // TODO Refactor into charts
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

})(d3, _, d3.chart.helpers, d3.chart.mixins);

(function(d3, _, helpers, mixins) {
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

      - skipLayout: Skip component during layout calculations and positioning
      - layoutLayers: Use to specify array of specific layers to draw during layout
      - getLayout: return position, width, and height for layout
      - setLayout: use x, y, and options {height, width} for layout
    */
    skipLayout: false,
    layoutLayers: undefined,
    getLayout: function(data) {
      this._layoutDraw(data);

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
      var margins = this.margins();
      this.base.attr('transform', helpers.transform.translate(x + margins.left, y + margins.top));
      this.height(options && options.height);
      this.width(options && options.width);
    },

    draw: function(data) {
      // If data has been transformed, don't re-transform
      var context = this;

      if (this._transformed) {
        // Remove prototype chain and transform from context
        // and instead pass in transformed data (stored from _layoutDraw)
        var transformedData = this.data();
        context = _.extend({}, this, {
          transform: function(data) {
            return transformedData;
          }
        });

        this._transformed = false;
      }

      return d3.chart('Base').prototype.draw.apply(context, arguments);
    },

    _layoutDraw: function(data) {
      // Transform data for layout
      // required for selective layers or all layers
      // (retains transform so that it only happens once per layout + draw)
      data = this._transform(data);

      if (this.layoutLayers && this.layoutLayers.length) {
        // If only certain layers are needed for layer,
        // perform partial draw that only draws those layers
        _.each(this.layoutLayers, function(layerName) {
          this.layer(layerName).draw(data);
        }, this);
      }
      else {
        this.draw(data);
      }
    },

    _transform: function(data) {
      // Transform cascade is internal in d3.chart
      // perform transform by calling draw with all layers and attachments removed
      // with fake layer to capture transformed data
      var transformedData;
      this.draw.call(_.extend({}, this, {
        _layers: {
          '_': {
            draw: function(data) {
              // Store transformed data
              transformedData = data;
            }
          }
        },
        _attached: {}
      }), data);

      // Save transformed state to skip in draw
      this._transformed = true;

      return transformedData;
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.mixins);

(function(d3, _, helpers, mixins) {
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
    labelClass: di(function(chart, d, i) {
      return 'chart-label' + (d['class'] ? ' ' + d['class'] : '');
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
        .attr('class', this.labelClass)
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

})(d3, _, d3.chart.helpers, d3.chart.mixins);

(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Bars
    Bar graph with centered key,value data and adjacent display for series
  */
  d3.chart('SeriesChart').extend('Bars', mixin(mixins.ValuesSeries, mixins.LabelsSeries, {
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
            .attr('class', chart.barClass)
            .attr('style', chart.itemStyle);
        },
        events: {
          'enter': function() {
            var chart = this.chart();

            this
              .attr('y', chart.y0)
              .attr('height', 0);  
          },
          'merge': function() {
            var chart = this.chart();

            this
              .attr('x', chart.barX)
              .attr('width', chart.itemWidth);
          },
          'merge:transition': function() {
            var chart = this.chart();

            if (chart.delay())
              this.delay(chart.delay());
            if (chart.duration())
              this.duration(chart.duration());

            this
              .attr('y', chart.barY)
              .attr('height', chart.barHeight);
          },
          'exit': function() {
            this.remove();
          }
        }
      });
    },
    delay: property('delay'),
    duration: property('duration'),


    displayAdjacent: property('displayAdjacent', {defaultValue: true}),

    barHeight: di(function(chart, d, i) {
      var height = Math.abs(chart.y0.call(this, d, i) - chart.y.call(this, d, i)); 
      return height > 0 ? height - chart.barOffset() : 0;
    }),
    barX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
    }),
    barY: di(function(chart, d, i) {
      var y = chart.y.call(this, d, i);
      var y0 = chart.y0();

      return y < y0 ? y : y0 + chart.barOffset();
    }),
    barClass: di(function(chart, d, i) {
      return 'chart-bar' + (d['class'] ? ' ' + d['class'] : '');
    }),

    barOffset: function barOffset() {
      if (!this.__axis) {
        this.__axis = d3.select(this.base[0][0].parentNode).select('[data-id="axis.x"] .domain');
      }
      if (!this.__axis) {
        return 0;
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
      var height = Math.abs(chart.y0.call(this, d, i) - chart.y.call(this, d, i));
      var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
      return height > 0 ? height - offset : 0;
    }),
    barX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
    }),
    barY: di(function(chart, d, i) {
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
    }),

    displayAdjacent: property('displayAdjacent', {defaultValue: false})
  });

})(d3, d3.chart.helpers, d3.chart.mixins);

(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Line
    (x,y) line graph
  */
  d3.chart('SeriesChart').extend('Line', mixin(mixins.XYSeries, mixins.LabelsSeries, {
    initialize: function() {
      this.seriesLayer('Lines', this.base.append('g').classed('chart-lines', true), {
        dataBind: function(data) {
          var chart = this.chart();
          var lines = {};

          // Add lines based on underlying series data
          _.each(chart.data(), function(series, index) {
            lines[index] = chart.createLine(series);
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

            if (chart.delay())
              this.delay(chart.delay());
            if (chart.duration())
              this.duration(chart.duration());

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
    delay: property('delay'),
    duration: property('duration'),

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
  d3.chart('Line').extend('LineValues', mixins.ValuesSeries);

})(d3, d3.chart.helpers, d3.chart.mixins);

(function(d3, helpers, mixins) {
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
  
})(d3, d3.chart.helpers, d3.chart.mixins);

(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Axis
    Add axis for given (x,y) series data

    Properties:
    - {String} [position = bottom] top, right, bottom, left, x0, y0
      Note: for x0 and y0, both x and y scales are required,
            so use `xScale` and `yScale` rather than `scale`
    - {x, y} [translation] of axis relative to chart bounds
    - {String} [orient = bottom] top, right, bottom, left
    - {String} [orientation = horizontal] horizontal, vertical

    Available d3 Axis mixins:
    - ticks
    - tickValues
    - tickSize
    - innerTickSize
    - outerTickSize
    - tickPadding
    - tickFormat
  */
  d3.chart('Component').extend('Axis', mixin(mixins.XY, {
    initialize: function() {
      // Set scale once chart is ready to drawn
      this.on('before:draw', function() {
        this._setupScale(this.scale());
      }.bind(this));

      // Create two axes (so that layout and transitions work)
      // 1. Display and transitions
      // 2. Layout (draw to get width, but separate so that transitions aren't affected)
      this.axis = d3.svg.axis();
      this._layoutAxis = d3.svg.axis();

      this.axisBase = this.base.append('g').attr('class', 'chart-axis');
      this._layoutBase = this.base.append('g')
        .attr('class', 'chart-axis chart-layout')
        .attr('style', 'display: none;');

      this.layer('Axis', this.axisBase, {
        dataBind: function(data) {
          // Setup axis (scale and properties)
          var chart = this.chart();
          chart._setupAxis(chart.axis);

          // Force addition of just one axis with dummy data array
          // (Axis will be drawn using underlying chart scales)
          return this.selectAll('g')
            .data([0]);
        },
        insert: function() {
          return this.append('g');
        },
        events: {
          'enter': function() {
            // Place and render axis
            var chart = this.chart();
            
            this
              .attr('transform', chart.translation())
              .call(chart.axis);
          },
          'update': function() {
            this.attr('transform', this.chart().translation());
          },
          'update:transition': function() {
            // Render axis (with transition)
            this.call(this.chart().axis);
          },
          'exit': function() {
            this.selectAll('g').remove();
          }
        }
      });

      this.layer('LayoutAxis', this._layoutBase, {
        dataBind: function(data) {
          var chart = this.chart();
          chart._setupAxis(chart._layoutAxis);
          return this.selectAll('g').data([0]);
        },
        insert: function() {
          return this.append('g');
        },
        events: {
          'merge': function() {
            var chart = this.chart();
            this
              .attr('transform', chart.translation())
              .call(chart.axis);
          }
        }
      });
    },

    scale: property('scale', {
      type: 'Function',
      set: function(value) {
        var scale = helpers.createScaleFromOptions(value);
        this._setupScale(scale);

        return {
          override: scale
        };
      }
    }),

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

    layoutLayers: ['LayoutAxis'],
    getLayout: function(data) {
      // Make layout axis visible for width calculations in Firefox
      this._layoutBase.attr('style', 'display: block;');

      // Get label overhang to use as label width (after default layout/draw)
      var layout = d3.chart('Component').prototype.getLayout.apply(this, arguments);
      var labelOverhang = this._getLabelOverhang();

      // Hide layout axis now that calculations are complete
      this._layoutBase.attr('style', 'display: none;');

      var position = this.position();
      if (position == 'x0')
        position = 'bottom';
      else if (position == 'y0')
        position = 'right';
      
      return {
        position: position,
        width: labelOverhang.width,
        height: labelOverhang.height
      };
    },
    setLayout: function(x, y, options) {
      // Axis is positioned with chartBase, so don't set layout
      return;
    },

    _setupScale: function(scale) {
      if (scale) {
        if (this.orientation() == 'vertical') {
          mixins.XY.setYScaleRange.call(this, scale);
          this.xScale(helpers.createScaleFromOptions()).yScale(scale);
        }
        else {
          mixins.XY.setXScaleRange.call(this, scale);
          this.xScale(scale).yScale(helpers.createScaleFromOptions());
        }
      }
    },

    _setupAxis: function(axis) {
      // Setup axis
      if (this.orientation() == 'vertical')
        this.axis.scale(this.yScale());
      else
        this.axis.scale(this.xScale());

      var extensions = ['orient', 'ticks', 'tickValues', 'tickSize', 'innerTickSize', 'outerTickSize', 'tickPadding', 'tickFormat'];
      var arrayExtensions = ['tickValues'];
      _.each(extensions, function(key) {
        var value = this[key] && this[key]();
        if (!_.isUndefined(value)) {
          // If value is array, treat as arguments array
          // otherwise, pass in directly
          if (_.isArray(value) && !_.contains(arrayExtensions, key))
            axis[key].apply(axis, value);
          else
            axis[key](value);
        }
      }, this);
    },

    _getLabelOverhang: function() {
      // TODO Look into overhang relative to chartBase (for x0, y0)
      var overhangs = {width: [0], height: [0]};
      var orientation = this.orientation();

      this._layoutBase.selectAll('.tick').each(function() {
        try {
          // There are cases where getBBox may throw 
          // (e.g. not currently displayed in Firefox)
          var bbox = this.getBBox();

          if (orientation == 'horizontal')
            overhangs.height.push(bbox.height);
          else
            overhangs.width.push(bbox.width);
        }
        catch (ex) {
          // Ignore error
        }
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
  d3.chart('Axis').extend('AxisValues', mixin(mixins.Values, {
    setScaleRange: function(scale) {
      if (this.orientation() == 'vertical') {
        mixins.Values.setYScaleRange.call(this, scale);
      }
      else {
        mixins.Values.setXScaleRange.call(this, scale);
      }
    }
  }));
  
})(d3, d3.chart.helpers, d3.chart.mixins);

(function(d3, helpers, mixins) {
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
      var demux = d3.chart('Multi').prototype.demux;
      var data = _.reduce(this.options().charts, function(data, chart) {
        if (chart.excludeFromLegend)
          return data;

        var chartData = _.compact(_.map(chart.data(), function(series, index) {
          if (series.excludeFromLegend) return;
          
          return {
            chart: chart,
            series: series,
            seriesIndex: index
          };
        }));

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
      selection.selectAll('*').remove();
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
  }, {
    // @static
    layerType: 'chart'
  });
  
})(d3, d3.chart.helpers, d3.chart.mixins);

(function(d3, _, helpers, mixins) {
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

        return {
          charts: {
            participation: {type: 'Bars', data: participation, xScale: scales.x, yScale: scales.y, itemPadding: 20},
            results: {type: 'Line', data: results, xScale: scales.x, yScale: scales.secondaryY, labels: {position: 'top'}}
          }
          axes: {
            x: {scale: scales.x}
            y: {scale: scales.y},
            secondaryY: {scale: scales.secondaryY}
          },
          legend: true,
          title: 'd3.chart.multi'
        };
      })
    ```

    @param {Object} options
  */
  d3.chart('Container').extend('Multi', {
    initialize: function() {
      this.redrawFor('title', 'charts', 'axes', 'legend', 'components');
      
      this._full_draw = false;
      this._axes = {};
      this._components = {};
    },

    options: property('options', {
      defaultValue: function(data) { return {}; },
      type: 'Function',
      set: function(options) {
        this._full_draw = true;

        // If options is plain object,
        // return from generic options function
        if (!_.isFunction(options)) {
          return {
            override: function(data) {
              return options;
            }
          };
        }
      }
    }),

    title: property('title', {
      set: function(options, previous, setOptions) {
        // Remove title if no options are given
        if (!options || _.isEmpty(options)) {
          return this.detachComponent('title');
        }

        // Title may be set directly
        if (_.isString(options))
          options = {text: options};

        // Load defaults
        options = _.defaults({}, options, d3.chart('Multi').defaults.title);

        var title = this.componentsById['title'];
        if (!title) {
          var Title = d3.chart(options.type);
          title = new Title(this.componentLayer({zIndex: helpers.zIndex.title}), options);

          this.attachComponent('title', title);
        }
        else {
          title.options(options, {silent: setOptions && setOptions.silent});
        }
      }
    }),

    charts: property('charts', {
      set: function(charts, previous, setOptions) {
        charts = charts || {};
        
        // Find charts to remove
        var removeIds = _.difference(_.keys(this.chartsById), _.keys(charts));
        _.each(removeIds, function(removeId) {
          this.detachChart(removeId);
        }, this);

        // Create or update charts
        _.each(charts, function(chartOptions, chartId) {
          var chart = this.chartsById[chartId];
          chartOptions = _.defaults({}, chartOptions, d3.chart('Multi').defaults.charts);

          if (!chart) {
            var Chart = d3.chart(chartOptions.type);
            chart = new Chart(this.chartLayer(), chartOptions);

            this.attachChart(chartId, chart);
          }
          else {
            chart.options(chartOptions, {silent: setOptions && setOptions.silent});
          }
        }, this);
      },
      defaultValue: {}
    }),

    axes: property('axes', {
      set: function(axes, previous, setOptions) {
        axes = axes || {};
        
        // Find axes to remove
        var removeIds = _.difference(_.keys(this._axes), _.keys(axes));
        _.each(removeIds, function(removeId) {
          this.detachComponent('axis.' + removeId);
          this.detachComponent('axis_title.' + removeId);
          delete this._axes[removeId];
        }, this);

        // Create or update axes
        _.each(axes, function(axisOptions, axisId) {
          var axis = this._axes[axisId];
          axisOptions = _.defaults({}, axisOptions, d3.chart('Multi').defaults.axes);

          if (!axis) {
            var Axis = d3.chart(axisOptions.type);
            axis = new Axis(this.chartLayer({zIndex: helpers.zIndex.axis}), axisOptions);
            
            this.attachComponent('axis.' + axisId, axis);
            this._axes[axisId] = axis;
          }
          else {
            axis.options(axisOptions, {silent: setOptions && setOptions.silent});
          }

          var axisTitleId = 'axis_title.' + axisId;
          var axisTitle = this.componentsById[axisTitleId];
          if (axisOptions.title) {
            var titleOptions = _.isString(axisOptions.title) ? {text: axisOptions.title} : axisOptions.title;
            titleOptions = _.defaults({}, titleOptions, {
              type: 'Title',
              position: axisOptions.position,
              'class': 'chart-title-axis'
            });

            if (!axisTitle) {
              var Title = d3.chart(titleOptions.type);
              title = new Title(this.componentLayer({zIndex: helpers.zIndex.title}), titleOptions);

              this.attachComponent(axisTitleId, title);
            }
            else {
              title.options(titleOptions, {silent: setOptions && setOptions.silent});
            }
          }
          else if (axisTitle) {
            this.detachComponent(axisTitleId);
          }
        }, this);   
      },
      defaultValue: {}
    }),

    legend: property('legend', {
      set: function(options, previous, setOptions) {
        if (!options || options === false || options.display === false) {
          return this.detachComponent('legend');
        }

        if (options === true) {
          options = {display: true};
        }
        options = _.defaults({}, options, d3.chart('Multi').defaults.legend);

        // Load charts
        if (options.charts) {
          options.charts = _.map(options.charts, function(chartId) {
            return this.chartsById[chartId];
          }, this);
        }

        // If switching legend types, remove existing for clean slate
        if (previous && previous.type != options.type) {
          this.detachComponent('legend');
        }

        var legend = this.componentsById['legend'];
        if (!legend) {
          var Legend = d3.chart(options.type);

          // TODO Make this happen within component
          var layerOptions = {zIndex: helpers.zIndex.legend};
          var base = Legend.layerType == 'chart' ? this.chartLayer(layerOptions) : this.componentLayer(layerOptions);

          legend = new Legend(base, options);

          this.attachComponent('legend', legend);
        }
        else {
          legend.options(options, {silent: setOptions && setOptions.silent});
        }
      }
    }),

    components: property('components', {
      set: function(components, previous, setOptions) {
        components = components || {};

        var removeIds = _.difference(_.keys(this._components), _.keys(components));
        _.each(removeIds, function(removeId) {
          this.detachComponent(removeId);
          delete this._components[removeId];
        }, this);

        _.each(components, function(componentOptions, componentId) {
          var component = this.componentsById[componentId];
          componentOptions = _.defaults({}, componentOptions);

          if (!component) {
            var Component = d3.chart(componentOptions.type);
            var base = Component.layerType == 'chart' ? this.chartLayer() : this.componentLayer();

            component = new Component(layer, componentOptions);

            this.attachComponent(componentId, component);
            this._components[componentId] = component;
          }
          else {
            component.options(componentOptions, {silent: setOptions && setOptions.silent});
          }
        }, this);
      }
    }),
  
    draw: function(data) {
      var config = this._prepareConfig(data);

      this.axes(config.axes, {silent: true});
      this.charts(config.charts, {silent: true});
      this.components(config.components, {silent: true});
      this.legend(config.legend, {silent: true});
      this.title(config.title, {silent: true});  

      d3.chart('Container').prototype.draw.call(this, {
        original: data,
        config: config.data
      });
    },

    redraw: function() {
      // Redraw chart with previously saved raw data / config
      if (this.rawData()) {
        if (this._full_draw) {
          this._full_draw = false;
          this.draw(this.rawData().original);
        }
        else {
          d3.chart('Container').prototype.draw.call(this, this.rawData());
        }
      }
    },

    demux: function(name, data) {
      var item_data;
      var item = this.chartsById[name];
      if (item) {
        item_data = data.config.charts[name];
        if (item_data) {
          return item_data;
        }
      }
      else {
        item = this.componentsById[name];
        if (item) {
          item_data = data.config.components[name];
          if (item_data) {
            return item_data;
          }
        }
      }

      // If no item data is found, use original data
      return data.original;
    },

    _prepareConfig: function(data) {
      var config = _.defaults({}, this.options()(data), {
        charts: {},
        axes: {},
        components: {},
        legend: false,
        title: false,
        options: {}
      });

      // Normalize legend and title config
      if (config.legend === true) {
        config.legend = {};
      }
      if (!config.legend.charts && !config.legend.data) {
        config.legend.charts = _.keys(config.charts);
      }
      if (_.isString(config.title)) {
        config.title = {text: config.title};
      }

      // Extract and remove data from config
      var config_data = {
        charts: {},
        components: {}
      };
      _.each(config.charts, function(chart_options, chart_id) {
        config_data.charts[chart_id] = chart_options.data;
        delete chart_options.data;
      });
      _.each(config.axes, function(axis_options, axis_id) {
        config_data.components['axis.' + axis_id] = axis_options.data;
        delete axis_options.data;
      });
      _.each(config.components, function(component_options, component_id) {
        config_data.components[component_id] = component_options.data;
        delete component_options.data;
      });
      if (_.isObject(config.legend)) {
        config_data.components.legend = config.legend.data;
        delete config.legend.data;
      }

      // Attach data to config
      config.data = config_data;
      return config;
    }
  }, {
    defaults: {
      charts: {},
      axes: {
        type: 'Axis'
      },
      legend: {
        type: 'Legend',
        position: 'right'
      },
      title: {
        type: 'Title',
        position: 'top',
        'class': 'chart-title-main'
      }
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.mixins);
