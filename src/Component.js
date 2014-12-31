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
        context = _.extend(Object.create(d3.chart('Component').prototype), this, {
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
      this.draw.call(_.extend(Object.create(d3.chart('Component').prototype), this, {
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
