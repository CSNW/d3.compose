(function(d3, _, helpers) {
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
        _.each(options, function(value, key) {
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

})(d3, _, d3.chart.helpers);
