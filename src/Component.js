(function(d3, _, helpers, extensions) {
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
    */
    skipLayout: false,
    getLayout: function(data) {
      this.draw(data);

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
    }
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
