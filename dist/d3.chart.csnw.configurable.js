/*! d3.chart.csnw.configurable - v0.0.0
 * https://github.com/CSNW/d3.chart.csnw.configurable
 * License: MIT
 */
(function (root, factory) {
  if (typeof exports === 'object') {
    module.exports = factory(require('d3', 'underscore'));
  } else if (typeof define === 'function' && define.amd) {
    define(['d3', 'underscore'], factory);
  } else {
    factory(root.d3, root._);
  }
}(this, function (d3, _) {
  'use strict';

(function(d3, _) {
  
  function isDefined(value) {
    return !_.isNull(value) && !_.isUndefined(value);
  }

  /**
    Property helper
    
    @param {String} name of stored property
    @param {Object} options
    - get: function(value) {return ...} getter, where value is the stored value, return desired value
    - set: function(value, previous) {return {override, after}} 
           setter, return override to set stored value and after() to run after set
    - type: 'function' if get/set value is function, otherwise get/set is evaluated if they're a function
  */ 
  function property(name, options) {
    var prop_key = '__properties';
    options = options || {};
    
    function get(context) {
      return context[prop_key] ? context[prop_key][name] : null;
    }
    function set(context, value) {
      context[prop_key] = context[prop_key] || {};
      context[prop_key][name] = value;
    }

    var getSet = function(value) {
      var underlying = get(this);
      if (!arguments.length) {
        value = isDefined(underlying) ? underlying : getSet.defaultValue;

        if (value && typeof value == 'function' && options.type != 'function')
          value = value.call(this);

        if (typeof options.get == 'function')
          return options.get.call(this, value);
        else
          return value;
      }

      var previous = underlying;
      set(this, value);
      
      if (typeof options.set == 'function') {
        var response = options.set.call(this, value, previous);
        if (response && response.override)
          set(this, response.override);
        if (response && response.after)
          response.after.call(this, get(this));
      }

      return this;
    };

    // For checking if function is a property
    getSet.isProperty = true;
    getSet.setFromOptions = isDefined(options.setFromOptions) ? options.setFromOptions : true;
    getSet.defaultValue = options.defaultValue;

    return getSet;
  }

  // Dimensions helper for robustly determining width/height of given selector
  function dimensions(selector) {
    var element = selector && selector.length && selector[0] && selector[0].length && selector[0][0];

    return {
      width: parseFloat((selector && selector.attr('width')) || (element && element.clientWidth) || 0),
      height: parseFloat((selector && selector.attr('height')) || (element && element.clientHeight) || 0)
    };
  }

  // Translate helper for creating translate string
  function translate(x, y) {
    if (_.isObject(x)) {
      y = x.y;
      x = x.x;
    }
      
    return 'translate(' + x + ', ' + y + ')';
  }

  // Create scale from options
  function createScaleFromOptions(options) {
    options = options || {};

    // If function, scale was passed in as options
    if (_.isFunction(options))
      return options;

    var scale = options.type && d3.scale[options.type] ? d3.scale[options.type]() : d3.scale.linear();
    if (options.domain)
      scale.domain(options.domain);
    if (options.range)
      scale.range(options.range);

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

          return translate(x, y);
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
    styles = _.reduce(styles, function(memo, value, key) {
      if (value)
        return memo + key + ': ' + value + ';';
      else
        return memo;
    }, '');

    return styles;
  }

  /**
    Get value for key(s) from search objects
    searching from first to last keys and objects

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
        return isDefined(value);
      });
    });

    return isDefined(value) ? value : undefined;
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

    if (mixed.initialize) {
      mixed.initialize = function initialize() {
        var args = _.toArray(arguments);

        _.each(extensions, function(extension) {
          // if (extension.prototype)
          //   extension.apply(this, args);
          // else
          if (extension.initialize)
            extension.initialize.apply(this, args);
          // else if (extension.prototype && extension.prototype.initialize)
          //   extension.prototype.initialize.apply(this, args);
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

  /**
    Mixin extensions with Chart prototype before calling extend
    returns object for extension

    @param {Array or Object...} extensions Array of extensions or seperate extension arguments
  */
  d3.chart().mixin = function(extensions) {
    var parent = this;
    extensions = _.isArray(extensions) ? extensions : _.toArray(arguments);

    // By design, mixin should always be followed by extend()
    // (May be updated in the future)
    return {
      extend: function(name, protoProps, staticProps) {
        if (protoProps)
          extensions.push(protoProps);
        return d3.chart().extend.call(parent, name, mixin(extensions), staticProps);
      }
    };
  };

  // Add helpers to chart (static)
  d3.chart.helpers = {
    isDefined: isDefined,
    property: property,
    dimensions: dimensions,
    translate: translate,
    createScaleFromOptions: createScaleFromOptions,
    stack: stack,
    style: style,
    getValue: getValue,
    mixin: mixin
  };
})(d3, _);
(function(d3, helpers) {
  var property = helpers.property;
  var isDefined = helpers.isDefined;
  
  // Extensions
  // ----------------------------------------------------------- //
  var extensions = d3.chart.extensions = {};

  // Extensions for handling series data
  extensions.Series = {
    seriesKey: function(d, i) {
      return d.key;
    },
    seriesValues: function(d, i) {
      // Store seriesIndex on series and values
      // TODO: Look at more elegant way to do this that avoids changing data
      if (isDefined(i))
        d.seriesIndex = i;

      return _.map(d.values, function(value) {
        if (isDefined(i))
          value.seriesIndex = i;
        return value;
      });
    },
    seriesClass: function(d, i) {
      return 'series index-' + i + (d['class'] ? ' ' + d['class'] : '');
    },
    seriesIndex: function(d, i) {
      return d.seriesIndex || 0;
    },
    seriesCount: function(d, i) {
      return this.data() ? this.data().length : 1;
    },

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
            .data(data, chart.seriesKey.bind(chart));

          series.enter()
            .append('g')
            .attr('class', chart.seriesClass.bind(chart));
          series.chart = function() { return chart; };

          return dataBind.call(series, chart.seriesValues.bind(chart));
        };
      }
      
      return d3.chart().prototype.layer.call(this, name, selection, options);
    }
  };

  // Extensions for handling XY data
  extensions.XY = {
    initialize: function() {
      this.on('change:data', this.setScales);

      if (this.options.xScale)
        this.xScale(helpers.createScaleFromOptions(this.options.xScale));
      if (this.options.yScale)
        this.yScale(helpers.createScaleFromOptions(this.options.yScale));
    },

    x: function(d, i) {
      return this._xScale()(this.xValue(d, i));
    },
    y: function(d, i) {
      return this._yScale()(this.yValue(d, i));
    },
    x0: function(d, i) {
      return this._xScale()(0);
    },
    y0: function(d, i) {
      return this._yScale()(0);
    },

    xValue: function(d, i) {
      return d.x;
    },
    yValue: function(d, i) {
      return d.y;
    },
    keyValue: function(d, i) {
      return d.key;
    },

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

        return isDefined(value) ? value : (min < 0 ? min : 0);
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        // Calculate maximum from series data
        var max = _.reduce(this.data(), function(memo, series, index) {
          var max = d3.extent(this.seriesValues(series, index), this.xValue)[1];
          return max > memo ? max : memo;
        }, -Infinity, this);

        return isDefined(value) ? value : max;
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
        return isDefined(value) ? value : (min < 0 ? min : 0);
      }
    }),
    yMax: property('yMax', {
      get: function(value) {
        // Calculate maximum from series data
        var max = _.reduce(this.data(), function(memo, series, index) {
          var max = d3.extent(this.seriesValues(series, index), this.yValue)[1];
          return max > memo ? max : memo;
        }, -Infinity, this);

        return isDefined(value) ? value : max;
      }
    })
  };

  // Extensions for charts of centered key,value data (x: index, y: value, key)
  extensions.Values = {
    isValues: true,
    transform: function(data) {
      // Transform series data from values to x,y
      _.each(data, function(series) {
        series.values = _.map(series.values, function(item, index) {
          item = _.isObject(item) ? item : {y: item};

          return {
            x: isDefined(item.x) ? item.x : item.key,
            y: item.y,
            key: item.key
          };
        }, this);
      }, this);

      return data;
    },

    x: function(d, i) {
      return this._xScale()(this.xValue(d, i)) + 0.5 * this.layeredWidth();
    },

    defaultXScale: function() {
      return d3.scale.ordinal();
    },

    setXScaleDomain: function(xScale, data, chart) {
      // Extract keys from series with most data to ensure loading all keys
      var keys = _.reduce(data, function(memo, series, index) {
        var keys = _.map(this.seriesValues(series, index), this.xValue.bind(this));
        return keys.length > memo.length ? keys : memo;
      }, [], this);

      return xScale.domain(keys);
    },

    setXScaleRange: function(xScale, data, chart) {
      return xScale.rangeBands([0, chart.width()], this.itemPadding(), this.itemPadding() / 2);
    },

    // AdjacentX/Width is used in cases where series are presented next to each other at each value
    adjacentX: function(d, i) {
      var adjacentWidth = this.adjacentWidth(d, i);
      var left = this.x(d, i) - this.layeredWidth(d, i) / 2 + adjacentWidth / 2;
      
      return left + adjacentWidth * this.seriesIndex(d, i);
    },
    adjacentWidth: function(d, i) {
      return this.layeredWidth(d, i) / this.seriesCount();
    },

    // LayeredX/Width is used in cases where sereis are presented on top of each other at each value
    layeredX: function(d, i) {
      return this.x(d, i);
    },
    layeredWidth: function(d, i) {
      return this._xScale().rangeBand();
    },

    // itemX/Width determine centered-x and width based on series display type (adjacent or layered)
    itemX: function(d, i) {
      return this.displayAdjacent() ? this.adjacentX(d, i) : this.layeredX(d, i);
    },
    itemWidth: function(d, i) {
      return this.displayAdjacent() ? this.adjacentWidth(d, i) : this.layeredWidth(d, i);
    },

    // Define % padding between each item
    // (If series is displayed adjacent, padding is just around group, not individual series)
    itemPadding: property('itemPadding', {defaultValue: 0.1}),
    displayAdjacent: property('displayAdjacent', {defaultValue: false})
  };

})(d3, d3.chart.helpers);

(function(d3, _, helpers, extensions) {
  var property = helpers.property;
  
  /**
    Base
  
    Shared functionality between all charts, components, and containers
  */
  d3.chart('Base', {
    initialize: function(options) {
      this.options = options || {};

      // Call any setters that match options
      _.each(this.options, function(value, key) {
        if (this[key] && this[key].isProperty && this[key].setFromOptions)
          this[key](value);
      }, this);
    },
    transform: function(data) {
      // Base is last transform to be called,
      // so stored data has been fully transformed
      this.data(data || []);
      return data || [];
    },

    width: function width() {
      return helpers.dimensions(this.base).width;
    },
    height: function height() {
      return helpers.dimensions(this.base).height;
    },

    // Store data after it has been fully transformed
    data: property('data', {
      set: function(data) {
        this.trigger('change:data', data);
      }
    })
  });

  

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  /**
    Chart: Foundation for building charts with series data
  */
  d3.chart('Base').mixin(extensions.Series).extend('Chart');

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  d3.chart('Base').extend('Component', {
    chartOffset: property('chartOffset', {
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
    })
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
  var property = helpers.property;

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

      this.updateDimensions();
      this.on('change:dimensions', function() {
        this.updateDimensions();
        this.redraw();
      });
    },

    updateDimensions: function() {
      // Explicitly set width and height of container
      this.base
        .attr('width', this.width())
        .attr('height', this.height());

      // Place chart base within container
      var margins = this.updateChartMargins();
      this.chartBase()
        .attr('transform', helpers.translate(margins.left, margins.top))
        .attr('width', this.chartWidth())
        .attr('height', this.chartHeight());
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

      component.on('change:dimensions', function() {
        this.trigger('change:dimensions');
      });
    },

    updateChartMargins: function() {
      // Get user-defined chart margins
      var margins = this.chartMargins();

      // Update overall chart margins with component chartOffsets
      _.each(this.components, function(component) {
        var offset = component && component.chartOffset && component.chartOffset();

        if (offset) {
          margins.top += offset.top || 0;
          margins.right += offset.right || 0;
          margins.bottom += offset.bottom || 0;
          margins.left += offset.left || 0;
        }
      }, this);
      
      this._chartMargins(margins);
      return margins;
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
    // Internal chart margins to separate from user-defined margins
    _chartMargins: property('_chartMargins', {
      defaultValue: function() {
        return _.extend({}, this.chartMargins());
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
    })
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  // Labels: Chart with labels positioned at (x,y) points
  d3.chart('Chart')
    .mixin(extensions.XY)
    .extend('Labels', {
      initialize: function() {
        this.seriesLayer('Labels', this.base.append('g').classed('labels', true), {
          dataBind: function(data) {
            var chart = this.chart();
            return this.selectAll('text')
              .data(data, chart.keyValue.bind(chart));
          },
          insert: function() {
            var chart = this.chart();

            // TODO: set font-family, font-size in style to override css

            return this.append('text')
              .classed('label', true)
              .attr('font-family', chart.labelFontFamily())
              .attr('font-size', chart.labelFontSize())
              .attr('alignment-baseline', chart.labelAlignment.bind(chart));
          },
          events: {
            'enter': function() {
              var chart = this.chart();
              this
                .attr('x', chart.labelX.bind(chart))
                .attr('y', chart.y0.bind(chart))
                .attr('text-anchor', chart.labelAnchor.bind(chart))
                .text(0);
            },
            'merge:transition': function() {
              var chart = this.chart();
              this
                .attr('y', chart.labelY.bind(chart))
                .text(chart.yValue.bind(chart));
            }
          }
        });
      },

      labelX: function(d, i) {
        return this.x(d, i) + this.calculatedLabelOffset(d, i).x;
      },
      labelY: function(d, i) {
        return this.y(d, i) + this.calculatedLabelOffset(d, i).y;
      },

      calculatedLabelOffset: function(d, i) {
        var offset = this.labelOffset();

        var byPosition = {
          top: {x: 0, y: -offset},
          right: {x: offset, y: 0},
          bottom: {x: 0, y: offset},
          left: {x: -offset, y: 0}
        };
        
        return byPosition[this.calculatedLabelPosition(d, i)];
      },
      labelAnchor: function(d, i) {
        if (this.calculatedLabelPosition(d, i) == 'right')
          return 'start';
        else if (this.calculatedLabelPosition(d, i) == 'left')
          return 'end';
        else
          return 'middle';
      },
      labelAlignment: function(d, i) {
        // Set alignment-baseline so that font size does not play into calculations
        // http://www.w3.org/TR/SVG/text.html#BaselineAlignmentProperties
        var byPosition = {
          top: 'after-edge',
          right: 'middle',
          bottom: 'before-edge',
          left: 'middle'
        };

        return byPosition[this.calculatedLabelPosition(d, i)];
      },

      calculatedLabelPosition: function(d, i) {
        var position = this.labelPosition();
        var parts = position.split('|');

        if (parts.length > 1) {
          var value = parts[0] == 'top' || parts[0] == 'bottom' ? this.yValue(d, i) : this.xValue(d, i);
          return value >= 0 ? parts[0] : parts[1];
        }
        else {
          return parts[0];
        }
      },

      // top, right, bottom, left, 1|2 (1 for positive or 0, 2 for negative)
      labelPosition: property('labelPosition', {defaultValue: 'top'}),
      // px distance offset from (x,y) point
      labelOffset: property('labelOffset', {defaultValue: 14}),

      // Font size, px
      labelFontSize: property('labelFontSize', {defaultValue: '14px'}),
      labelFontFamily: property('labelFontFamily', {defaultValue: 'sans-serif'})
    });
  
  // LabelValues: Chart with labels for centered values
  d3.chart('Chart')
    .mixin(d3.chart('Labels').prototype, extensions.Values)
    .extend('LabelValues', {
      labelX: function(d, i) {
        return this.itemX(d, i) + this.calculatedLabelOffset(d, i).x;
      }
    });

  // ChartWithLabels: Chart with labels attached
  // TODO: Attach labels after chart so that labels appear above chart
  d3.chart('Chart').extend('ChartWithLabels', {
    initialize: function() {
      if (this.showLabels()) {
        // Create labels chart
        this.labels = this.base.chart(this.isValues ? 'LabelValues' : 'Labels', this.options);  

        // Transfer certain properties to labels
        if (this.labels.displayAdjacent && this.displayAdjacent)
          this.labels.displayAdjacent(this.displayAdjacent());

        // Attach labels chart
        this.attach('Labels', this.labels);
      }
    },
    showLabels: property('showLabels', {defaultValue: true})
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
  var property = helpers.property;
  
  // Line: (x,y) line graph
  d3.chart('ChartWithLabels')
    .mixin(extensions.XY)
    .extend('Line', {
      initialize: function() {
        this.seriesLayer('Line', this.base.append('g').classed('line-chart', true), {
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
              }, chart.seriesKey.bind(chart));
          },
          insert: function() {
            return this.append('path')
              .classed('line', true);
          },
          events: {
            'merge:transition': function() {
              var chart = this.chart();
              var lines = chart.lines();

              this
                .attr('d', function(d, i) {
                  return lines[chart.seriesIndex(d, i)](chart.seriesValues(d, i));
                })
                .attr('style', chart.lineStyle.bind(chart));
            }
          }
        });
      },
      lines: property('lines', {defaultValue: []}),
      lineStyle: function(d, i) {
        return helpers.style({
          stroke: this.lineStroke(d, i),
          'stroke-dasharray': this.lineStrokeDashArray(d, i)
        });
      },
      lineStroke: function(d, i) {
        return helpers.getValue(['stroke', 'color'], d, this.options);
      },
      lineStrokeDashArray: function(d, i) {
        return helpers.getValue(['stroke-dasharray'], d, this.options);
      },
      createLine: function(series) {
        var line = d3.svg.line()
          .x(this.x.bind(this))
          .y(this.y.bind(this));

        var interpolate = series.interpolate || this.options.interpolate;
        if (interpolate)
          line.interpolate(interpolate);

        return line;
      }
    });
  
  // LineValues: Line graph for centered key,value data
  d3.chart('ChartWithLabels')
    .mixin(d3.chart('Line').prototype, extensions.Values)
    .extend('LineValues');

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  // Bars: Bar graph with centered key,value data and adjacent display for series
  d3.chart('ChartWithLabels')
    .mixin(extensions.XY, extensions.Values)
    .extend('Bars', {
      initialize: function() {
        this.seriesLayer('Bars', this.base.append('g').classed('bar-chart', true), {
          dataBind: function(data) {
            var chart = this.chart();
            return this.selectAll('rect')
              .data(data, chart.keyValue.bind(chart));
          },
          insert: function() {
            return this.append('rect')
              .classed('bar', true);
          },
          events: {
            'enter': function() {
              var chart = this.chart();
              this
                  .attr('x', chart.barX.bind(chart))
                  .attr('y', chart.y0.bind(chart))
                  .attr('width', chart.itemWidth.bind(chart))
                  .attr('height', 0);
            },
            'merge:transition': function() {
              var chart = this.chart();
              this
                  .attr('y', chart.barY.bind(chart))
                  .attr('height', chart.barHeight.bind(chart));
            }
          }
        });
      },
      barHeight: function(d, i) {
        return Math.abs(this.y0(d, i) - this.y(d, i));
      },
      barX: function(d, i) {
        return this.itemX(d, i) - this.itemWidth(d, i) / 2;
      },
      barY: function(d, i) {
        var y = this.y(d, i);
        var y0 = this.y0();
        
        return y < y0 ? y : y0;
      },
      displayAdjacent: property('displayAdjacent', {defaultValue: true})
    });

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  // Axis: Add axis for given (x,y) series data
  d3.chart('Component')
    .mixin(extensions.Series, extensions.XY)
    .extend('Axis', {
      initialize: function() {
        this.axis = d3.svg.axis();

        this.layer('Axis', this.base.append('g').classed('axis', true), {
          dataBind: function(data) {
            // Force addition of just one axis with dummy data array
            // (Axis will be drawn using underlying chart scales and data)
            return this.selectAll('g')
              .data([0]);
          },
          insert: function() {
            var chart = this.chart();
            var position = chart.axisPosition();
            var orientation = chart.axisOrientation();

            // Get scale by orientation
            var scale = orientation == 'horizontal' ? chart._xScale() : chart._yScale();

            // Setup axis
            chart.axis
              .scale(scale)
              .orient(chart.axisOrient());

            return this.append('g');
          },
          events: {
            merge: function() {
              var chart = this.chart();
              this
                .attr('transform', chart.axisTranlation.call(chart))
                .call(chart.axis);
            }
          }
        });
      },

      axisTranlation: function(d, i) {
        var translationByPosition = {
          top: {x: 0, y: 0},
          right: {x: this.width(), y: 0},
          bottom: {x: 0, y: this.height()},
          left: {x: 0, y: 0},
          x0: {x: this.x0(d, i), y: 0},
          y0: {x: 0, y: this.y0(d, i)}
        };
        
        return helpers.translate(translationByPosition[this.axisPosition()]);
      },

      // Position axis: top, right, bottom, left, x0, y0
      axisPosition: property('axisPosition', {
        defaultValue: 'bottom',
        set: function(value) {
          // Update chartOffset by position
          var offset = this.chartOffset();
          var offsetDistance = this.axisOffset();
          var orient = this.axisOrient();
          
          if (!offset[orient]) {
            offset[orient] = offsetDistance;
            this.chartOffset(offset);
          }
        }
      }),
      // Distance to offset chart margin on axis side
      axisOffset: property('axisOffset', {
        defaultValue: function() {
          var orientation = this.axisOrientation();
          return orientation == 'horizontal' ? 30 : 60;
        }
      }),

      axisOrient: property('axisOrient', {
        defaultValue: function() {
          var orient = this.axisPosition();
          
          if (orient == 'x0')
            orient = 'left';
          else if (orient == 'y0')
            orient = 'bottom';
          
          return orient;
        }
      }),
      axisOrientation: function() {
        var byPosition = {
          top: 'horizontal',
          right: 'vertical',
          bottom: 'horizontal',
          left: 'vertical',
          x0: 'vertical',
          y0: 'horizontal'
        };

        return byPosition[this.axisPosition()];
      }
    });
  
  // AxisValues: Axis component for (key,value) series data
  d3.chart('Component')
    .mixin(d3.chart('Axis').prototype, extensions.Values)
    .extend('AxisValues');

})(d3, _, d3.chart.helpers, d3.chart.extensions);

(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  /**
    Legend component
  */
  d3.chart('Component')
    .mixin()
    .extend('Legend', {
      initialize: function() {
        this.legend = this.base.append('g')
          .classed('legend', true);

        this.layer('Legend', this.legend, {
          dataBind: function(data) {
            var chart = this.chart();
            return this.selectAll('g')
              .data(data, chart.dataKey.bind(chart));
          },
          insert: function() {
            var chart = this.chart();
            var groups = this.append('g')
              .attr('class', function(d, i) {
                return 'legend-group index-' + i;
              });

            groups.append('g')
              .attr('width', 20)
              .attr('height', 20)
              .attr('class', 'legend-swatch');
            groups.append('text')
              .attr('class', 'legend-label')
              .attr('transform', helpers.translate(25, 0));
            
            return groups;
          },
          events: {
            merge: function() {
              var chart = this.chart();

              this.select('g').each(chart.createSwatches());
              this.select('text')
                .text(chart.dataValue.bind(chart))
                .attr('alignment-baseline', 'before-edge');

              // Position groups after positioning everything inside
              this.call(helpers.stack.bind(this, {origin: 'top', padding: 5}));
            }
          }
        });
      },

      dataKey: function(d, i) {
        return d.key;
      },
      dataValue: function(d, i) {
        return d.name;
      },
      dataSwatchProperties: function(d, i) {
        // Extract swatch properties from data
        return _.defaults({}, d, {
          type: 'swatch',
          color: 'blue',
          'class': ''
        });
      },

      createSwatches: function() {
        var chart = this;
        return function(d, i) {
          chart.createSwatch(d3.select(this), d, i);
        };
      },
      createSwatch: function(selection, d, i) {
        var properties = this.dataSwatchProperties(d, i);

        // Clear existing swatch
        selection.empty();
        selection
          .classed(properties['class'], true);

        if (properties.type == 'Line' || properties.type == 'LineValues') {
          var line = selection.append('line')
            .attr('x1', 0).attr('y1', 10)
            .attr('x2', 20).attr('y2', 10)
            .attr('class', 'line');
        }
        else {
          // Simple colored swatch
          selection.append('circle')
            .attr('cx', 10)
            .attr('cy', 10)
            .attr('r', 10)
            .attr('class', 'bar'); // TODO: Temporary
        }
      },

      // Position legend: top, right, bottom, left
      legendPosition: property('legendPosition', {
        defaultValue: 'right',
        set: function(value) {
          var offset = {top: 0, right: 0, bottom: 0, left: 0};

          offset[value] = 100;
          this.chartOffset(offset);
        }
      })
    });

  d3.chart('Legend').extend('InsetLegend', {
    initialize: function() {
      this.positionLegend();
    },

    positionLegend: function() {
      if (this.legend) {
        var position = this.legendPosition();
        this.legend.attr('transform', helpers.translate(position.x, position.y));
      }
    },

    // Position legend: (x,y) of top left corner
    legendPosition: property('legendPosition', {
      defaultValue: {x: 10, y: 10},
      set: function(value, previous) {
        value = (value && _.isObject(value)) ? value : {};
        value = _.defaults(value, previous || {}, {x: 0, y: 0});

        return {
          override: value,
          after: function() {
            this.positionLegend();
          }
        };
      }
    })
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
        charts: [
          {type: 'Bars', dataKey: 'participation', yScale: {domain: [0, 20000]}, itemPadding: 20},
          {type: 'LineValues', dataKey: 'results', yScale: {domain: [0, 70]}, labelPosition: 'top'}
        ]
      })
      .width(600)
      .height(400)
      .chartMargins({top: 10, right: 10, bottom: 10, left: 10});
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
      // Setup charts
      _.each(this.options.charts, function(chartOptions, i) {
        chartOptions = _.defaults(chartOptions || {}, d3.chart('Configurable').defaultChartOptions);

        if (!d3.chart(chartOptions.type))
          return; // No matching chart found...

        var chart = this.chartBase().chart(chartOptions.type, chartOptions);
        var id = 'chart_' + i;

        this.attachChart(id, chart);
      }, this);

      // Setup axes
      _.each(this.options.axes, function(axisOptions, i) {
        axisOptions = _.defaults(axisOptions || {}, d3.chart('Configurable').defaultAxisOptions);

        if (!d3.chart(axisOptions.type))
          return; // No matching axis found...

        var axis = this.chartBase().chart(axisOptions.type, axisOptions);
        var id = 'axis_' + i;

        this.attachComponent(id, axis);
      }, this);

      // Setup legend
      if (this.options.legend) {
        var legendOptions = _.defaults(this.options.legend, d3.chart('Configurable').defaultLegendOptions);

        if (!d3.chart(legendOptions.type))
          return; // No matching legend founct

        var base = legendOptions.type == 'InsetLegend' ? this.chartBase() : this.base;
        var legend = base.chart(legendOptions.type, legendOptions);

        this.attachComponent('legend', legend);
      }
    },
    demux: function(name, data) {
      var item = this.chartsById[name] || this.componentsById[name];
      return name == 'legend' ? this.extractLegendData(item, data) : this.extractData(item, name, data);
    },
    extractData: function(item, name, data) {
      var dataKey = item && item.options && item.options.dataKey || name;
      return data[dataKey] || [];
    },
    extractLegendData: function(legend, data) {
      if (legend && legend.options && legend.options.dataKey) return this.extractData(legend, 'legend', data);
      var options = legend && legend.options && legend.options.data || {};

      var series;
      if (options.charts) {
        series = _.reduce(options.charts, function(memo, index) {
          return memo.concat(getChartData.call(this, this.charts && this.charts[index]));
        }, [], this);
      }
      else {
        series = _.reduce(this.charts, function(memo, chart) {
          return memo.concat(getChartData.call(this, chart));
        }, [], this);
      }

      function getChartData(chart) {
        if (chart) {
          var chartData = this.extractData(chart, chart.id, data);

          // Extend each series in data with information from chart
          // (Don't overwrite series information with chart information)
          return _.map(chartData, function(chartSeries) {
            // TODO: Be much more targeted in options transferred from chart (e.g. just styles, name, etc.)
            return _.defaults(chartSeries, chart.options);
          }, this);
        }
        else {
          return [];
        }
      }
      
      return series;
    }
  }, {
    defaultChartOptions: {},
    defaultAxisOptions: {
      type: 'Axis'
    },
    defaultLegendOptions: {
      type: 'Legend',
      legendPosition: 'right'
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);


  return d3;
}));