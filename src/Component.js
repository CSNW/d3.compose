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
