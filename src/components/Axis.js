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
      this.on('change:scale', function() {
        if (this.options().scale) {
          var scale = this.isXAxis() ? 'xScale' : 'yScale';
          this[scale](helpers.createScaleFromOptions(this.options().scale));
        }
      }.bind(this));
      this.on('change:options', function() {
        this.trigger('change:scale');
      }.bind(this));
      this.trigger('change:scale');

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
