/*! d3.chart.multi - v0.6.0
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
          var response = options.set.call(context, value, existing);
          
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
  */
  function valueOrDefault(value, defaultValue) {
    return !_.isUndefined(value) ? value : defaultValue;
  }

  /**
    Dimensions
    Helper for robustly determining width/height of given selector

    @param {d3 Selection} selection
  */
  function dimensions(selection) {
    var element = selection && selection.length && selection[0] && selection[0].length && selection[0][0];
    var boundingBox = element && typeof element.getBBox == 'function' && element.getBBox() || {};
    var client = element ? {width: element.clientWidth, height: element.clientHeight} : {width: 0, height: 0};
    var attr = selection ? {width: selection.attr('width'), height: selection.attr('height')} : {width: 0, height: 0};
    var isSVG = element ? element.nodeName == 'svg' : false;

    // Size set by css -> client (only valid for svg and some other elements)
    // Size set by svg -> attr override or boundingBox
    // -> Take maximum
    return {
      width: _.max([client.width, attr.width || boundingBox.width]) || 0,
      height: _.max([client.height, attr.height || boundingBox.height]) || 0
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

    @param {function} callback with (chart, d, i) arguments
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
    Get parent data for element

    @param {Element} element
  */
  function getParentData(element) {
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
    di: di,
    bindDi: bindDi,
    bindAllDi: bindAllDi,
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
      return !_.isUndefined(d.key) ? d.key : chart.xValue.call(this, d, i);
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
    })
  };

  /**
    Extensions for charts of centered key,value data (x: index, y: value, key)
  
    Properties:
    - [itemPadding = 0.1] {Number} % padding between each item (for ValuesSeries, padding is just around group, not individual series items)
    Dependencies: XY
  */
  var Values = {
    // Define % padding between each item
    // (If series is displayed adjacent, padding is just around group, not individual series)
    itemPadding: property('itemPadding', {defaultValue: 0.1}),
    isValues: true,

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
          return xScale.rangeBands([chart.height(), 0], this.itemPadding(), this.itemPadding() / 2);
        else
          return xScale.rangeBands([0, chart.width()], this.itemPadding(), this.itemPadding() / 2);
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
      
      return left + adjacentWidth * chart.seriesIndex.call(this, d, i);
    }),
    adjacentWidth: di(function(chart, d, i) {
      return chart.layeredWidth.call(this, d, i) / chart.seriesCount.call(this);
    }),

    // LayeredX/Width is used in cases where sereis are presented on top of each other at each value
    layeredX: di(function(chart, d, i) {
      return chart._xScale()(chart.xValue.call(this, d, i)) + 0.5 * chart.layeredWidth.call(this);
    }),
    layeredWidth: di(function(chart, d, i) {
      return chart._xScale().rangeBand();
    }),

    // determine item width based on series display type (adjacent or layered)
    itemWidth: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentWidth.call(this, d, i) : chart.layeredWidth.call(this, d, i);
    })
  };

  // Expose extensions
  d3.chart.extensions = _.extend(d3.chart.extensions || {}, {
    Series: Series,
    XY: XY,
    XYSeries: _.extend({}, Series, XY, XYSeries),
    Values: _.extend({}, XY, Values),
    ValuesSeries: _.extend({}, Series, XY, XYSeries, Values, ValuesSeries)
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
          console.log('REDRAW', arguments);
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
    Chart: Foundation for building charts with series data
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

      this.on('change:dimensions', function() {
        this.redraw();
      });

      this.options(options || {});
      this.redrawFor('options');

      this.handleResize();
      this.handleHover();
    },

    draw: function(data) {
      // Explicitly set width and height of container
      this.base
        .attr('width', this.width())
        .attr('height', this.height());

      // Pre-draw for accurate dimensions for layout
      this._preDraw(data);

      // Layout now that components' dimensions are known
      this.layout();

      // Full draw now that everything has been laid out
      d3.chart().prototype.draw.call(this, data);
    },

    redraw: function() {
      // Using previously saved rawData, redraw chart      
      if (this.rawData())
        this.draw(this.rawData());
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
      chart.id = id;
      chart.base.attr('data-id', id);
      chart.container = this;

      this.attach(id, chart);
      this.chartsById[id] = chart;
    },

    detachChart: function(id) {
      var chart = this.chartsById[id];
      if (!chart) return;

      // Remove chart base layer and all children
      chart.base.remove();

      delete this._attached[id];
      delete this.chartsById[id];
    },

    attachComponent: function(id, component) {
      component.id = id;
      component.base.attr('data-id', id);
      component.container = this;

      this.attach(id, component);
      this.componentsById[id] = component;

      component.on('change:position', function() {
        this.trigger('change:dimensions');
      });
    },

    detachComponent: function(id) {
      var component = this.componentsById[id];
      if (!component) return;

      // Remove component base layer and all children
      component.base.remove();

      component.off('change:position');
      delete this._attached[id];
      delete this.componentsById[id];
    },

    layout: function() {
      var layout = this._extractLayout();
      this._updateChartMargins(layout);
      this._positionLayers(layout);
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
      this.on('enter:mouse', function(coordinates) {
        this.trigger('hover', coordinates);
      });
      this.on('move:mouse', function(coordinates) {
        this.trigger('hover', coordinates);
      });

      var hovering;
      var trigger = this.trigger.bind(this);
      var onMouseMove = this.onMouseMove = _.throttle(function(coordinates) {
        if (hovering)
          trigger('move:mouse', coordinates);
      }, 100);

      this.base.on('mouseenter', function() {
        hovering = true;
        trigger('enter:mouse', d3.mouse(this));
      });
      this.base.on('mousemove', function() {
        onMouseMove(d3.mouse(this));
      });
      this.base.on('mouseleave', function() {
        hovering = false;
        trigger('leave:mouse');
      });
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

(function(d3, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Labels
    Chart with labels positioned at (x,y) points

    Properties:
    - {String} [position = top] top, right, bottom, left, or a|b (a for positive values or 0, b for negative)
    - {Number} [offset = 10] px distance offset from data point
    - {String|Function} format String to be used in d3.format(...) or format function
  */
  d3.chart('SeriesChart').extend('Labels', mixin(extensions.XYSeries, {
    initialize: function() {
      this.seriesLayer('Labels', this.base.append('g').classed('chart-labels', true), {
        dataBind: function(data) {
          var chart = this.chart();
          return this.selectAll('text')
            .data(data, chart.keyValue);
        },
        insert: function() {
          var chart = this.chart();

          return this.append('text')
            .classed('chart-label', true)
            .attr('alignment-baseline', chart.labelAlignment)
            .attr('style', chart.itemStyle);
        },
        events: {
          'enter': function() {
            var chart = this.chart();
            this
              .attr('x', chart.labelX)
              .attr('y', chart.y0)
              .attr('text-anchor', chart.labelAnchor)
              .text(0);
          },
          'merge:transition': function() {
            var chart = this.chart();
            this
              .attr('y', chart.labelY)
              .text(chart.labelValue);
          }
        }
      });
    },

    transform: function(data) {
      // TODO reduce data (by mechanism similar to ticks)
      return data;
    },

    display: property('display', {defaultValue: true}),
    format: property('format', {
      type: 'Function',
      set: function(value) {
        if (_.isString(value)) {
          return {override: d3.format(value)};
        }
      }
    }),
    
    position: property('position', {defaultValue: 'top'}),
    offset: property('offset', {defaultValue: 14}),

    labelX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) + chart.calculatedOffset.call(this, d, i).x;
    }),
    labelY: di(function(chart, d, i) {
      return chart.y.call(this, d, i) + chart.calculatedOffset.call(this, d, i).y;
    }),
    labelValue: di(function(chart, d, i) {
      if (!chart.display()) return;

      var value = chart.yValue.call(this, d, i);
      return chart.format() ? chart.format()(value) : value;
    }),

    calculatedOffset: di(function(chart, d, i) {
      var offset = chart.offset();

      var byPosition = {
        top: {x: 0, y: -offset},
        right: {x: offset, y: 0},
        bottom: {x: 0, y: offset},
        left: {x: -offset, y: 0}
      };
      
      return byPosition[chart.calculatedPosition.call(this, d, i)];
    }),
    labelAnchor: di(function(chart, d, i) {
      if (chart.calculatedPosition.call(this, d, i) == 'right')
        return 'start';
      else if (chart.calculatedPosition.call(this, d, i) == 'left')
        return 'end';
      else
        return 'middle';
    }),
    labelAlignment: di(function(chart, d, i) {
      // Set alignment-baseline so that font size does not play into calculations
      // http://www.w3.org/TR/SVG/text.html#BaselineAlignmentProperties
      var byPosition = {
        top: 'after-edge',
        right: 'middle',
        bottom: 'before-edge',
        left: 'middle'
      };

      return byPosition[chart.calculatedPosition.call(this, d, i)];
    }),

    calculatedPosition: di(function(chart, d, i) {
      var position = chart.position();
      var parts = position.split('|');

      if (parts.length > 1) {
        var value = parts[0] == 'top' || parts[0] == 'bottom' ? chart.yValue.call(this, d, i) : chart.xValue.call(this, d, i);
        return value >= 0 ? parts[0] : parts[1];
      }
      else {
        return parts[0];
      }
    }),

    itemStyle: di(function(chart, d, i) {
      // For labels, only pull in label styles
      // - data.labels.style
      // - series.labels.style
      var series = chart.seriesData.call(this, d, i) || {};
      var styles = _.defaults({}, d.labels && d.labels.style, series.labels && series.labels.style, chart.options().style);
      
      return helpers.style(styles) || null;
    }),
  }));
  
  /**
    LabelValues
    Chart with labels for centered values
  */
  d3.chart('Labels').extend('LabelsValues', mixin(extensions.ValuesSeries, {
    labelX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) + chart.calculatedOffset.call(this, d, i).x;
    })
  }));

  /**
    ChartWithLabels
    Chart with labels attached
  */
  d3.chart('SeriesChart').extend('ChartWithLabels', {
    attachLabels: function() {
      var options = this.labelOptions();
      var Labels = helpers.resolveChart(options.type, 'Labels', this.isValues ? 'Values' : 'XY');
      this.labels = new Labels(this.base, options);

      // Pull x/y scale from parent chart
      this.labels.xScale = property('xScale', {
        get: function() {
          return this._xScale();
        },
        context: this
      });
      this.labels.yScale = property('yScale', {
        get: function() {
          return this._yScale();
        },
        context: this
      });

      this.attach('Labels', this.labels);
    },

    options: property('options', {
      set: function(options) {
        this.setFromOptions(options);

        if (this.labels)
          this.labels.options(this.labelOptions(), {silent: true});
      }
    }),

    labelOptions: property('labelOptions', {
      get: function() {
        var options = this.options().labels;

        // If no options or options is false, display = false
        // If options is true, display = true
        // Otherwise use options given
        if (!options)
          options = {display: false};
        else if (options === true)
          options = {display: true};
        else
          options = _.clone(options);

        // Pull options from parent chart
        options = _.defaults(options, {
          displayAdjacent: this.displayAdjacent ? this.displayAdjacent() : false,
          invertedXY: this.invertedXY ? this.invertedXY() : false
        });

        return options;
      }
    })
  });

})(d3, d3.chart.helpers, d3.chart.extensions);

(function(d3, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Bars
    Bar graph with centered key,value data and adjacent display for series
  */
  d3.chart('ChartWithLabels').extend('Bars', mixin(extensions.ValuesSeries, {
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
                .attr('x', chart.barX)
                .attr('y', chart.y0)
                .attr('width', chart.itemWidth)
                .attr('height', 0);  
            }
            else {
              this
                .attr('x', chart.x0)
                .attr('y', chart.barY)
                .attr('width', 0)
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
          }
        }
      });

      this.attachLabels();
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
    }
  }));
  
  /**
    Stacked Bars
  */
  d3.chart('Bars').extend('StackedBars', {
    initialize: function() {
      this.barPositions = [];
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
  d3.chart('ChartWithLabels').extend('Line', mixin(extensions.XYSeries, {
    initialize: function() {
      this.seriesLayer('Lines', this.base.append('g').classed('chart-lines', true), {
        dataBind: function(data) {
          var chart = this.chart();

          // Add lines based on underlying series data
          chart.lines(_.map(chart.data(), function(series) {
            return chart.createLine(series);
          }));

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

      this.attachLabels();
    },
    lines: property('lines', {defaultValue: []}),

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
      this.on('change:options', createScaleFromOptions.bind(this));
      createScaleFromOptions.call(this);

      function createScaleFromOptions() {
        if (this.options().scale) {
          var scale = this.isXAxis() ? 'xScale' : 'yScale';
          this[scale](helpers.createScaleFromOptions(this.options().scale));
        }        
      }

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
        
        this.type(options.type || 'XY', {silent: true});
        this.invertedXY(options.invertedXY || false, {silent: true});
        
        this.axes(options.axes, {silent: true});
        this.charts(options.charts, {silent: true});
        this.components(options.components, {silent: true});
        this.legend(options.legend, {silent: true});
        this.title(options.title, {silent: true});

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
      set: function(options, title) {
        var changed = false;
        
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
          title.options(options/*, {silent: true} XY needs to know about update for scales*/);
          changed = true;
        }

        return {
          override: title,

          // Updating existing object causes change determination to always be false,
          // so keep track explicitly
          changed: changed
        };
      }
    }),

    charts: property('charts', {
      set: function(options, charts) {
        options = options || {};
        charts = charts || {};
        var removeIds = _.difference(_.keys(charts), _.keys(options));
        var changed = removeIds.length > 0;
                
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
            chart.options(chartOptions/*, {silent: true} XY needs to know about update for scales*/);
            changed = true;
          }
        }, this);

        return {
          override: charts,
          changed: changed,
          after: function() {
            this.bindChartScales();
          }
        };
      },
      defaultValue: {}
    }),

    axes: property('axes', {
      set: function(options, axes) {
        options = options || {};
        axes = axes || {};
        var axisIds = _.uniq(['x', 'y'].concat(_.keys(options)));
        var removeIds = _.difference(_.keys(axes), axisIds);
        var changed = removeIds.length > 0;

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

            axis.options(axisOptions/*, {silent: true} XY needs to know about update for scales*/);
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
              title.options(titleOptions/*, {silent: true} XY needs to know about update for scales*/);
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
          changed: changed,
          after: function() {
            this.bindChartScales();
          }
        };    
      },
      defaultValue: {}
    }),

    legend: property('legend', {
      set: function(options, legend) {
        options = options === false ? {display: false} : (options || {});
        options = _.defaults({}, options, d3.chart('Multi').defaults.legend);
        var changed = false;

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

          legend.options(options);
        }

        return {
          override: legend,
          changed: changed
        };
      }
    }),

    components: property('components', {
      set: function(options, components) {
        options = options || {};
        components = components || {};
        var removeIds = _.difference(_.keys(components), _.keys(options));
        var changed = removeIds.length > 0;

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
            component.options(componentOptions/*, {silent: true} XY needs to know about update for scales*/);
            charted = true;
          }
        }, this);

        return {
          override: components,
          changed: changed,
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
