/*! d3.chart.csnw.configurable - v0.5.1
 * https://github.com/CSNW/d3.chart.csnw.configurable
 * License: MIT
 */
(function(d3, _) {

  /**
    Property helper

    @example
    ```javascript
    var obj = {};
    obj.simple = property('simple');
    
    // Default value
    obj.hasDefault = property('hasDefault', {
      defaultValue: 'Howdy!'
    });

    obj.hasDefault() == 'Howdy!';
    obj.hasDefault('Hello');
    obj.hasDefault() == 'Hello';
    obj.hasDefault(undefined);
    obj.hasDefault() == 'Howdy!';

    // Custom getter
    obj.getter = property('getter', {
      get: function(value) {
        return value + '!';
      }
    });

    obj.getter('Howdy');
    obj.getter() == 'Howdy!';

    // Custom setter, that can override set value and do something after overriding
    obj.setter = property('setter', {
      set: function(value, previous) {
        if (value == 'Hate') {
          return {
            override: 'Love',
            after: function() {
              this.setter() == 'Love';
            }
          };
        }
      }
    });
    ```

    @param {String} name of stored property
    @param {Object} options
    - defaultValue: {...} default value for property (when set value is undefined)
    - get: function(value) {return ...} getter, where value is the stored value, return desired value
    - set: function(value, previous) {return {override, after}} 
           setter, return override to set stored value and after() to run after set
    - type: 'function' if get/set value is function, otherwise get/set is evaluated if they're a function
    - context: 'Object' context to evaluate get/set/after functions
  */ 
  function property(name, options) {
    options = options || {};
    var propKey = options.propKey || '__properties';
    
    function get(context) {
      return !_.isUndefined(context[propKey]) ? context[propKey][name] : undefined;
    }
    function set(context, value) {
      context[propKey] = context[propKey] || {};
      context[propKey][name] = value;
    }

    var getSet = function(value) {
      var underlying = get(this);
      var context = !_.isUndefined(getSet.context) ? getSet.context : this;

      if (!arguments.length) {
        value = !_.isUndefined(underlying) ? underlying : getSet.defaultValue;

        if (value && typeof value == 'function' && options.type != 'function')
          value = value.call(this);

        if (typeof options.get == 'function')
          return options.get.call(context, value);
        else
          return value;
      }

      var previous = underlying;
      if (typeof options.validate == 'function' && !options.validate(value)) {
        if (_.isFunction(this.trigger))
          this.trigger('invalid:' + name, value);

        // Assumption: Previous value already had set called, so don't call set for previous value
        //             Default value has not had set called, so call set for default value
        //             Neither previous nor default, don't set value and don't call set
        if (!_.isUndefined(previous))
          return set(this, previous);
        else if (!_.isUndefined(getSet.defaultValue))
          value = getSet.defaultValue;
        else
          return;
      }

      set(this, value);
      
      if (typeof options.set == 'function') {
        var response = options.set.call(context, value, previous);
        if (response && response.override)
          set(this, response.override);
        if (response && response.after)
          response.after.call(context, get(this));
      }

      if (!_.isEqual(get(this), previous) && _.isFunction(this.trigger))
        this.trigger('change:' + name, get(this));

      return this;
    };

    // For checking if function is a property
    getSet._isProperty = true;
    getSet.setFromOptions = valueOrDefault(options.setFromOptions, true);
    getSet.defaultValue = options.defaultValue;
    getSet.context = options.context;

    return getSet;
  }

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
      d3.chart(chartType + componentType);

    if (!Chart)
      throw new Error('d3.chart.csnw.configurable: Unable to resolve chart for type ' + chartType + ' and component ' + componentType + ' and container ' + containerType);

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
  
  // Extensions
  // ----------------------------------------------------------- //
  var extensions = (d3.chart.extensions = d3.chart.extensions || {});

  // Extensions for handling series data
  extensions.Series = {
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
      var series = chart.dataSeries.call(this, d, i);
      return series && series.seriesIndex || 0;
    }),
    seriesCount: di(function(chart, d, i) {
      return chart.data() ? chart.data().length : 1;
    }),
    dataSeries: di(function(chart, d, i) {
      return helpers.getParentData(this);
    }),
    itemStyle: di(function(chart, d, i) {
      // Get style for data item in the following progression
      // data.style -> series.style -> chart.style
      var series = chart.dataSeries.call(this, d, i) || {};
      var styles = _.defaults({}, d.style, series.style, chart.options.style);
      
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
  */
  extensions.XY = {
    initialize: function() {
      this.on('change:data', this.setScales);

      if (this.options.xScale)
        this.xScale(helpers.createScaleFromOptions(this.options.xScale));
      if (this.options.yScale)
        this.yScale(helpers.createScaleFromOptions(this.options.yScale));
    },

    x: di(function(chart, d, i) {
      return chart._xScale()(chart.xValue.call(this, d, i));
    }),
    y: di(function(chart, d, i) {
      return chart._yScale()(chart.yValue.call(this, d, i));
    }),
    x0: di(function(chart, d, i) {
      return chart._xScale()(0);
    }),
    y0: di(function(chart, d, i) {
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
      return xScale.range([0, chart.width()]);
    },
    setYScaleRange: function(yScale, data, chart) {
      return yScale.range([chart.height(), 0]);
    },

    defaultXScale: function() {
      return d3.scale.linear();
    },
    defaultYScale: function() {
      return d3.scale.linear();
    },

    // _xScale and _yScale used to differentiate between user- and internally-set values
    _xScale: property('_xScale', {type: 'function'}),
    _yScale: property('_yScale', {type: 'function'}),
    xScale: property('xScale', {type: 'function', setFromOptions: false}),
    yScale: property('yScale', {type: 'function', setFromOptions: false}),

    xMin: property('xMin', {
      get: function(value) {
        // Calculate minimum from series data
        var min = _.reduce(this.data(), function(memo, series, index) {
          var min = d3.extent(this.seriesValues(series, index), this.xValue)[0];
          return min < memo ? min : memo;
        }, Infinity, this);

        return valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        // Calculate maximum from series data
        var max = _.reduce(this.data(), function(memo, series, index) {
          var max = d3.extent(this.seriesValues(series, index), this.xValue)[1];
          return max > memo ? max : memo;
        }, -Infinity, this);

        return valueOrDefault(value, max);
      }
    }),
    yMin: property('yMin', {
      get: function(value) {
        // Calculate minimum from series data
        var min = _.reduce(this.data(), function(memo, series, index) {
          var min = d3.extent(this.seriesValues(series, index), this.yValue)[0];
          return min < memo ? min : memo;
        }, Infinity, this);
        
        // Default behavior: if min is less than zero, use min, otherwise use 0
        return valueOrDefault(value, (min < 0 ? min : 0));
      }
    }),
    yMax: property('yMax', {
      get: function(value) {
        // Calculate maximum from series data
        var max = _.reduce(this.data(), function(memo, series, index) {
          var max = d3.extent(this.seriesValues(series, index), this.yValue)[1];
          return max > memo ? max : memo;
        }, -Infinity, this);

        return valueOrDefault(value, max);
      }
    })
  };

  /**
    Extensions for charts of centered key,value data (x: index, y: value, key)
  */
  extensions.Values = {
    isValues: true,
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

    x: di(function(chart, d, i) {
      return chart._xScale()(chart.xValue.call(this, d, i)) + 0.5 * chart.layeredWidth.call(this);
    }),

    defaultXScale: function() {
      return d3.scale.ordinal();
    },

    setXScaleDomain: function(xScale, data, chart) {
      // Extract keys from all series
      var allKeys = _.map(data, function(series, index) {
        return _.map(this.seriesValues(series, index), this.xValue);
      }, this);
      var uniqueKeys = _.uniq(_.flatten(allKeys));

      return xScale.domain(uniqueKeys);
    },

    setXScaleRange: function(xScale, data, chart) {
      return xScale.rangeBands([0, chart.width()], this.itemPadding(), this.itemPadding() / 2);
    },

    // AdjacentX/Width is used in cases where series are presented next to each other at each value
    adjacentX: di(function(chart, d, i) {
      var adjacentWidth = chart.adjacentWidth.call(this, d, i);
      var left = chart.x.call(this, d, i) - chart.layeredWidth.call(this, d, i) / 2 + adjacentWidth / 2;
      
      return left + adjacentWidth * chart.seriesIndex.call(this, d, i);
    }),
    adjacentWidth: di(function(chart, d, i) {
      return chart.layeredWidth.call(this, d, i) / chart.seriesCount.call(this);
    }),

    // LayeredX/Width is used in cases where sereis are presented on top of each other at each value
    layeredX: di(function(chart, d, i) {
      return chart.x.call(this, d, i);
    }),
    layeredWidth: di(function(chart, d, i) {
      return chart._xScale().rangeBand();
    }),

    // itemX/Width determine centered-x and width based on series display type (adjacent or layered)
    itemX: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentX.call(this, d, i) : chart.layeredX.call(this, d, i);
    }),
    itemWidth: di(function(chart, d, i) {
      return chart.displayAdjacent() ? chart.adjacentWidth.call(this, d, i) : chart.layeredWidth.call(this, d, i);
    }),

    // Define % padding between each item
    // (If series is displayed adjacent, padding is just around group, not individual series)
    itemPadding: property('itemPadding', {defaultValue: 0.1}),
    displayAdjacent: property('displayAdjacent', {defaultValue: false})
  };

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
    initialize: function(options) {
      this.options = options || {};

      // Call any setters that match options
      _.each(this.options, function(value, key) {
        if (this[key] && this[key]._isProperty && this[key].setFromOptions)
          this[key](value);
      }, this);

      // Bind all di-functions to this chart
      helpers.bindAllDi(this);
    },

    data: property('data', {
      set: function(data) {
        // This trigger is relied on by other components
        // and must be called even when the data doesn't necessarily change
        // TODO Look into why it needs to called every time (even on no change)
        this.trigger('change:data', data);
      }
    }),
    style: property('style', {
      get: function(value) {
        return helpers.style(value) || null;
      }
    }),

    width: function width() {
      return helpers.dimensions(this.base).width;
    },
    height: function height() {
      return helpers.dimensions(this.base).height;
    },

    transform: function(data) {
      // Base is last transform to be called,
      // so stored data has been fully transformed
      this.data(data || []);
      return data || [];
    }
  });

  /**
    Chart: Foundation for building charts with series data
  */
  d3.chart('Base').extend('Chart', extensions.Series);

  /**
    Container

    Foundation for chart and component placement
  */
  d3.chart('Base').extend('Container', {
    initialize: function() {
      this.charts = [];
      this.chartsById = {};
      this.components = [];
      this.componentsById = {};

      // Overriding transform in init jumps it to the top of the transform cascade
      // Therefore, data coming in hasn't been transformed and is raw
      // (Save raw data for redraw)
      this.transform = function(data) {
        this.rawData(data);
        return data;
      };

      this.base.classed('chart', true);
      this.chartBase(this.base.append('g').classed('chart-base', true));

      this.on('change:dimensions', function() {
        this.redraw();
      });
    },

    draw: function(data) {
      // Explicitly set width and height of container
      this.base
        .attr('width', this.width())
        .attr('height', this.height());

      // Pre-draw for accurate dimensions for layout
      this._preDraw(data);

      // Layout now that components' dimensions are known
      this.updateLayout();

      // Full draw now that everything has been laid out
      d3.chart().prototype.draw.call(this, data);
    },

    redraw: function() {
      // Using previously saved rawData, redraw chart      
      if (this.rawData())
        this.draw(this.rawData());
    },

    attachChart: function(id, chart) {
      chart.id = id;
      this.attach(id, chart);
      this.charts.push(chart);
      this.chartsById[id] = chart;
    },

    attachComponent: function(id, component) {
      component.id = id;
      this.attach(id, component);
      this.components.push(component);
      this.componentsById[id] = component;

      component.on('change:position', function() {
        this.trigger('change:dimensions');
      });
    },

    componentBase: function() {
      // Return new group so that "this.base" can be translated within component
      return this.base.append('g').attr('class', 'chart-component');
    },

    updateLayout: function() {
      var layout = this._extractLayout();
      this._updateChartMargins(layout);
      this._positionChartBase();
      this._positionComponents(layout);
    },

    rawData: property('rawData'),
    chartBase: property('chartBase'),

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
    
    chartWidth: function() {
      var margins = this._chartMargins();
      return this.width() - margins.left - margins.right;
    },
    chartHeight: function() {
      var margins = this._chartMargins();
      return this.height() - margins.top - margins.bottom;
    },

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

    _preDraw: function(data) {
      this._positionChartBase();
      _.each(this.componentsById, function(component, id) {
        if (!component.skipLayout)
          component.draw(this.demux ? this.demux(id, data) : data);
      }, this);
    },

    _positionChartBase: function() {
      var margins = this._chartMargins();

      this.chartBase()
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
      _.each(this.components, function(component) {
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
  

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
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
  d3.chart('Chart').extend('Labels', mixin(extensions.XY, {
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

    position: property('position', {defaultValue: 'top'}),
    offset: property('offset', {defaultValue: 14}),
    format: property('format', {
      type: 'function',
      set: function(value) {
        if (_.isString(value)) {
          return {override: d3.format(value)};
        }
      }
    }),

    labelX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) + chart.calculatedOffset.call(this, d, i).x;
    }),
    labelY: di(function(chart, d, i) {
      return chart.y.call(this, d, i) + chart.calculatedOffset.call(this, d, i).y;
    }),
    labelValue: di(function(chart, d, i) {
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

      var data = d.labels || {};
      var series = chart.dataSeries.call(this, d, i) || {};
      series = series.labels || {};

      var styles = _.defaults({}, data.style, series.style, chart.options.style);
      
      return helpers.style(styles) || null;
    }),
  }));
  
  /**
    LabelValues
    Chart with labels for centered values
  */
  d3.chart('Labels').extend('LabelValues', mixin(extensions.Values, {
    labelX: di(function(chart, d, i) {
      return chart.itemX.call(this, d, i) + chart.calculatedOffset.call(this, d, i).x;
    })
  }));

  /**
    ChartWithLabels
    Chart with labels attached
  */
  d3.chart('Chart').extend('ChartWithLabels', {
    initialize: function() {
      // Initialize on transform so that all child charts have been added
      // (make sure labels are on top)
      // TODO: While this does put labels on top of chart, it puts them on top of all charts
      // Need to place labels layer closer to parent chart
      this.once('transform', function() {
        if (this.showLabels()) {
          var labelOptions = _.defaults({}, this.options.labels, {
            displayAdjacent: this.displayAdjacent()
          });

          var Labels = helpers.resolveChart(this.isValues ? 'LabelValues' : 'Labels', 'Chart', this.isValues);
          this.labels = new Labels(this.base, labelOptions);

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
        }
      });
    },

    transform: function(data) {
      this.trigger('transform');
      return data;
    },

    showLabels: property('showLabels', {defaultValue: true})
  });

  /**
    Bars
    Bar graph with centered key,value data and adjacent display for series
  */
  d3.chart('ChartWithLabels').extend('Bars', mixin(extensions.XY, extensions.Values, {
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
            this
                .attr('x', chart.barX)
                .attr('y', chart.y0)
                .attr('width', chart.itemWidth)
                .attr('height', 0);
          },
          'merge:transition': function() {
            var chart = this.chart();
            this
                .attr('y', chart.barY)
                .attr('height', chart.barHeight);
          }
        }
      });
    },
    barHeight: di(function(chart, d, i) {
      return Math.abs(chart.y0.call(this, d, i) - chart.y.call(this, d, i));
    }),
    barX: di(function(chart, d, i) {
      return chart.itemX.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
    }),
    barY: di(function(chart, d, i) {
      var y = chart.y.call(this, d, i);
      var y0 = chart.y0();
      
      return y < y0 ? y : y0;
    }),
    displayAdjacent: property('displayAdjacent', {defaultValue: true})
  }));

  /**
    Line
    (x,y) line graph
  */
  d3.chart('ChartWithLabels').extend('Line', mixin(extensions.XY, {
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
              .attr('style', chart.lineStyle);
          }
        }
      });
    },
    lines: property('lines', {defaultValue: []}),
    lineStyle: di(function(chart, d, i) {
      return helpers.style({
        stroke: chart.lineStroke.call(this, d, i),
        'stroke-dasharray': chart.lineStrokeDashArray.call(this, d, i)
      });
    }),
    lineStroke: di(function(chart, d, i) {
      return helpers.getValue(['stroke', 'color'], d, chart.options);
    }),
    lineStrokeDashArray: di(function(chart, d, i) {
      return helpers.getValue(['stroke-dasharray'], d, chart.options);
    }),
    createLine: function(series) {
      var line = d3.svg.line()
        .x(this.x)
        .y(this.y);

      var interpolate = series.interpolate || this.options.interpolate;
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
  d3.chart('Line').extend('LineValues', extensions.Values);

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Component
    Common component functionality / base for creating components

    Properties
    - {String} [position = top] (top, right, bottom, left)
    - {Number} [width = base width]
    - {Number} [height = base height]

    Customization
    - skipLayout: Don't use this component type during layout (e.g. inset within chart)
    - layoutWidth: Adjust with more precise sizing calculations
    - layoutHeight: Adjust with more precise sizing calculations
    - layoutPosition: Adjust layout positioning
    - setLayout: Override if layout needs to be customized
  */
  d3.chart('Base').extend('Component', {
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
    skipLayout: false,

    /**
      Height/width/position to use in layout calculations
      (Override for more specific sizing in layout calculations)
    */
    layoutWidth: function() {
      return this.width();
    },
    layoutHeight: function() {
      return this.height();
    },
    layoutPosition: function() {
      return this.position();
    },

    /**
      Set layout of underlying base
      (Override for elements placed within chart)
    */
    setLayout: function(x, y, options) {
      this.base.attr('transform', helpers.transform.translate(x, y));
      this.height(options && options.height);
      this.width(options && options.width);
    }
  });

  /**
    Title

    Properties:
    - {String} title
    - {Object} style
    - {Number} rotation
  */
  d3.chart('Component').extend('Title', {
    initialize: function() {
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
              .attr('class', chart.options['class'])
              .text(chart.title());
          }
        }
      });
    },

    title: property('title'),
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

  /**
    Axis
    Add axis for given (x,y) series data

    Properties:
    - {String} [position = bottom] top, right, bottom, left, x0, y0
  */
  d3.chart('Component').extend('Axis', mixin(extensions.Series, extensions.XY, {
    initialize: function() {
      // Transfer generic scale options to specific scale for axis
      if (this.options.scale) {
        var scale = this.isXAxis() ? 'xScale' : 'yScale';
        this[scale](helpers.createScaleFromOptions(this.options.scale));
      }

      this.axis = d3.svg.axis();
      this.axisLayer = this.base.append('g').attr('class', 'chart-axis');

      if (this.options.display) {
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
        
        return helpers.translate(translationByPosition[this.position()]);
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

    ticks: property('ticks', {type: 'function'}),
    tickValues: property('tickValues', {type: 'function'}),
    tickSize: property('tickSize', {type: 'function'}),
    innerTickSize: property('innerTickSize', {type: 'function'}),
    outerTickSize: property('outerTickSize', {type: 'function'}),
    tickPadding: property('tickPadding', {type: 'function'}),
    tickFormat: property('tickFormat', {type: 'function'}),

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
      return this.orientation() == 'horizontal';
    },
    isYAxis: function() {
      return this.orientation() == 'vertical';
    },

    _setupAxis: function() {
      // Get scale by orientation
      var scale = this.isXAxis() ? this._xScale() : this._yScale();

      // Setup axis
      this.axis.scale(scale);

      var extensions = ['orient', 'ticks', 'tickValues', 'tickSize', 'innerTickSize', 'outerTickSize', 'tickPadding', 'tickFormat'];
      _.each(extensions, function(key) {
        var value = this[key] && this[key]();
        if (!_.isUndefined(value)) {
          // If value is array, treat as arguments array
          // otherwise, pass in directly
          if (_.isArray(value))
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
  d3.chart('Axis').extend('AxisValues', extensions.Values);

  /**
    Legend
  */
  d3.chart('Component').extend('Legend', {
    initialize: function() {
      this.legend = this.base.append('g')
        .classed('chart-legend', true);

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
              .text(chart.dataValue.bind(chart))
              .attr('alignment-baseline', 'before-edge');

            // Position groups after positioning everything inside
            this.call(helpers.stack.bind(this, {origin: 'top', padding: 5}));
          }
        }
      });
    },
    isLegend: true,

    transform: function(allData) {
      var extractData = d3.chart('Configurable').prototype.extractData;
      var data = _.reduce(this.options.charts, function(data, chart) {
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
      if (d.chart.options['class'])
        classes.push(d.chart.options['class']);
      if (d.series['class'])
        classes.push(d.series['class']);

      return classes.join(' ') || null;
    }),
    dataStyle: di(function(chart, d, i) {
      var styles = _.defaults({}, d.series.style, d.chart.options.style);
      
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

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  /**
    Configurable chart

    Configure chart based on given options, including adding charts, axes, legend, and other properties

    @example
    ```javascript
    var chart = d3.select('#chart')
      .append('svg')
      .chart('Configurable', {
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
  d3.chart('Container').extend('Configurable', {
    initialize: function() {
      this.type = this.options.type || 'XY';
      this.setupAxes(this.options.axes);
      this.setupCharts(this.options.charts);

      // TODO Look into placing axes layers below charts

      this.setupLegend(this.options.legend);
      this.setupTitle(this.options.title);
    },

    setupAxes: function(options) {
      options = options || {};
      this.axes = {};

      var axisKeys = _.uniq(['x', 'y'].concat(_.keys(this.options.axes)));
      _.each(axisKeys, function(axisKey) {
        positionByKey = {
          x: 'bottom',
          y: 'left',
          secondaryX: 'top',
          secondaryY: 'right'
        };
        var defaultOptions = {
          display: true,
          position: positionByKey[axisKey]
        };

        var axisOptions;
        if (options[axisKey] === false)
          axisOptions = _.defaults({display: false}, defaultOptions, d3.chart('Configurable').defaultAxisOptions);
        else
          axisOptions = _.defaults({}, options[axisKey], defaultOptions, d3.chart('Configurable').defaultAxisOptions);

        if (axisKey != 'x' && axisKey != 'y' && !axisOptions.dataKey)
          throw new Error('d3.chart.csnw.configurable: dataKey(s) are required for axes other than x and y');

        var Axis = helpers.resolveChart(axisOptions.type, 'Axis', this.type);
        var axis = new Axis(this.chartBase(), axisOptions);
        var id = 'axis_' + axisKey;

        this.attachComponent(id, axis);
        this.axes[axisKey] = axis;

        if (axisOptions.title) {
          var titleOptions = _.isString(axisOptions.title) ? {title: axisOptions.title} : axisOptions.title;
          titleOptions = _.defaults({}, titleOptions, {position: axisOptions.position, 'class': 'chart-title-axis'});
          
          var Title = helpers.resolveChart(titleOptions.type, 'Title', this.type);
          var title = new Title(this.componentBase(), titleOptions);
          id = id + '_title';

          this.attachComponent(id, title);
        }
      }, this);

      // Setup filter keys for x and y axes
      _.each(['x', 'y'], function(axisKey) {
        var axis = this.axes[axisKey];

        // Don't need to filter keys if dataKey already set
        if (axis.options.dataKey)
          return;  

        var filterKeys = [];
        _.each(this.axes, function(filterAxis, filterKey) {
          if ((axisKey == 'x' && !filterAxis.isXAxis()) || (axisKey == 'y' && !filterAxis.isYAxis()))
            return;

          var dataKey = filterAxis.options.dataKey;
          if (dataKey)
            filterKeys = filterKeys.concat(_.isArray(dataKey) ? dataKey : [dataKey]);
        }, this);

        axis.options.filterKeys = filterKeys;
      }, this);
    },

    setupCharts: function(charts) {
      charts = charts || [];

      _.each(charts, function(chartOptions, i) {
        chartOptions = _.defaults({}, chartOptions, d3.chart('Configurable').defaultChartOptions);

        var Chart = helpers.resolveChart(chartOptions.type, 'Chart', this.type);
        var chart = new Chart(this.chartBase(), chartOptions);
        var id = 'chart_' + i;

        // Load matching axis scales (if necessary)
        var scale;
        if (!chartOptions.xScale) {
          scale = this.getMatchingAxisScale(chartOptions.dataKey, 'x');
          if (scale)
            chart.xScale = scale;
        }
        if (!chartOptions.yScale) {
          scale = this.getMatchingAxisScale(chartOptions.dataKey, 'y');
          if (scale)
            chart.yScale = scale;
        }

        this.attachChart(id, chart);
      }, this);
    },

    setupLegend: function(options) {
      options = options === false ? {display: false}: (options || {});
      options = _.defaults({}, options, d3.chart('Configurable').defaultLegendOptions);

      // Load chart information
      if (options.dataKey) {
        // Load only charts matching dataKey(s)
        var dataKeys = _.isArray(options.dataKey) ? options.dataKey : [options.dataKey];
        options.charts = _.filter(this.charts, function(chart) {
          return _.contains(dataKeys, chart.options.dataKey);
        });
      }
      else {
        options.charts = this.charts;  
      }

      var Legend = helpers.resolveChart(options.type, 'Legend', this.type);
      var base = options.type == 'Inset' || options.type == 'InsetLegend' ? this.chartBase() : this.componentBase();
      var legend = new Legend(base, options);

      this.attachComponent('legend', legend);
    },

    setupTitle: function(options) {
      if (!options)
        return;

      // Title may be set directly
      if (_.isString(options))
        options = {title: options};

      options = _.defaults({}, options, d3.chart('Configurable').defaultTitleOptions);

      var Title = helpers.resolveChart(options.type, 'Title', this.type);
      var title = new Title(this.componentBase(), options);

      this.attachComponent('title', title);
    },

    demux: function(name, data) {
      var item = this.chartsById[name] || this.componentsById[name];

      if (item)
        return this.extractData(item, data);
      else
        return data;
    },

    extractData: function(item, data) {
      var dataKey = item.options.dataKey;
      var filterKeys = item.options.filterKeys;

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

    getMatchingAxisScale: function(dataKey, type) {
      var match = _.find(this.axes, function(axis) {
        if ((type == 'x' && !axis.isXAxis()) || (type == 'y' && !axis.isYAxis()))
          return false;

        var axisDataKey = axis.options.dataKey;
        return _.isArray(axisDataKey) ? _.contains(axisDataKey, dataKey) : axisDataKey == dataKey;
      });

      var scaleKey = type == 'x' ? '_xScale' : '_yScale';
      var axis = match || this.axes[type];

      return property(type + 'Scale', {
        get: function () {
          return axis[scaleKey]();
        }
      });
    }
  }, {
    defaultChartOptions: {
      type: 'Line'
    },
    defaultAxisOptions: {
      display: true
    },
    defaultLegendOptions: {
      position: 'right'
    },
    defaultTitleOptions: {
      position: 'top',
      'class': 'chart-title-main'
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
