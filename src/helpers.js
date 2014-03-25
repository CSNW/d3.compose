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