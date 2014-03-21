(function(d3, _) {
  
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
    var prop_key = '__properties'
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
        value = underlying != null ? underlying : getSet.defaultValue;

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
    getSet.setFromOptions = options.setFromOptions != null ? options.setFromOptions : true;
    getSet.defaultValue = options.defaultValue;

    return getSet;
  };

  // Dimensions helper for robustly determining width/height of given selector
  function dimensions(selector) {
    var element = selector && selector.length && selector[0] && selector[0].length && selector[0][0];

    return {
      width: parseFloat((selector && selector.attr('width')) || (element && element.clientWidth) || 0),
      height: parseFloat((selector && selector.attr('height')) || (element && element.clientHeight) || 0)
    };
  };

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
      }
    }
    if (mixed.transform) {
      mixed.transform = function transform(data) {
        return _.reduceRight(extensions, function(data, extension) {
          if (extension && extension.transform)
            return extension.transform.call(this, data);
          else
            return data;
        }, data, this);
      }
    }
    
    return mixed;
  }

  /**
    Mixin extensions with Chart prototype before calling extend
    returns intermediate extended chart

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
  }

  // Add helpers to chart (static)
  d3.chart.helpers = {
    property: property,
    dimensions: dimensions,
    translate: translate,
    createScaleFromOptions: createScaleFromOptions,
    mixin: mixin
  };
})(d3, _);