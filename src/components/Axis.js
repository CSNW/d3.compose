(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Axis
    Add axis for given (x,y) series data

    Properties:
    - {String} [position = bottom] top, right, bottom, left, x0, y0
      Note: for x0 and y0, both x and y scales are required,
            so use `xScale` and `yScale` rather than `scale`
    - {x, y} [translation] of axis relative to chart bounds
    - {String} [orient = bottom] top, right, bottom, left
    - {String} [orientation = horizontal] horizontal, vertical

    Available d3 Axis mixins:
    - ticks
    - tickValues
    - tickSize
    - innerTickSize
    - outerTickSize
    - tickPadding
    - tickFormat
  */
  d3.chart('Component').extend('Axis', mixin(mixins.XY, {
    initialize: function() {
      // Create two axes (so that layout and transitions work)
      // 1. Display and transitions
      // 2. Layout (draw to get width, but separate so that transitions aren't affected)
      this.axis = d3.svg.axis();
      this._layoutAxis = d3.svg.axis();

      this.axisBase = this.base.append('g').attr('class', 'chart-axis');
      this._layoutBase = this.base.append('g')
        .attr('class', 'chart-axis chart-layout')
        .attr('style', 'display: none;');

      this.layer('Axis', this.axisBase, {
        dataBind: function(data) {
          // Setup axis (scale and properties)
          var chart = this.chart();
          chart._setupAxis(chart.axis);

          // Force addition of just one axis with dummy data array
          // (Axis will be drawn using underlying chart scales)
          return this.selectAll('g')
            .data([0]);
        },
        insert: function() {
          return this.append('g');
        },
        events: {
          'enter': function() {
            // Place and render axis
            var chart = this.chart();
            
            this
              .attr('transform', chart.translation())
              .call(chart.axis);
          },
          'update': function() {
            this.attr('transform', this.chart().translation());
          },
          'update:transition': function() {
            // Render axis (with transition)
            var chart = this.chart();

            if (chart.delay())
              this.delay(chart.delay());
            
            if (chart._skip_transition) {
              this.duration(0);
              chart._skip_transition = undefined;
            }
            else if (chart.duration()) {
              this.duration(chart.duration());
            }
            
            if (chart.ease())
              this.ease(chart.ease());

            this.call(chart.axis);
          },
          'exit': function() {
            this.selectAll('g').remove();
          }
        }
      });

      this.layer('_LayoutAxis', this._layoutBase, {
        dataBind: function(data) {
          var chart = this.chart();
          chart._setupAxis(chart._layoutAxis);
          return this.selectAll('g').data([0]);
        },
        insert: function() {
          return this.append('g');
        },
        events: {
          'merge': function() {
            var chart = this.chart();
            this
              .attr('transform', chart.translation())
              .call(chart.axis);
          }
        }
      });
    },
    duration: property('duration', {type: 'Function'}),
    delay: property('delay', {type: 'Function'}),
    ease: property('ease', {type: 'Function'}),

    scale: property('scale', {
      type: 'Function',
      set: function(value) {
        var scale = helpers.createScaleFromOptions(value);

        if (this.orientation() == 'vertical') {
          this.yScale(scale.copy());
        }
        else {
          this.xScale(scale.copy());
        }

        return {
          override: scale
        };
      }
    }),

    position: property('position', {
      defaultValue: 'bottom',
      validate: function(value) {
        return _.contains(['top', 'right', 'bottom', 'left', 'x0', 'y0'], value);
      },
      set: function() {
        // Update scale -> xScale/yScale when position changes
        if (this.scale()) {
          this.scale(this.scale());
        }
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
      },
      set: function() {
        // Update scale -> xScale/yScale when orientation changes
        if (this.scale()) {
          this.scale(this.scale());
        }
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

    getLayout: function(data) {
      // 1. Get previous values to restore after draw for proper transitions
      var state = this.getState();
      
      // 2. Draw with current values
      this.draw(data);

      // 3. Calculate layout
      // (make layout axis visible for width calculations in Firefox)
      this._layoutBase.attr('style', 'display: block;');
      
      var labelOverhang = this._getLabelOverhang();
      
      this._layoutBase.attr('style', 'display: none;');

      // 4. Draw with previous values
      if (this._previous_raw_data) {
        this.setState(_.extend(state.previous, {duration: 0}));
        
        this.draw(this._previous_raw_data);

        // 5. Restore current values
        this.setState(state.current);
      }
      else {
        // Skip transition after layout
        // (Can transition from unexpected state)
        this._skip_transition = true;
      }

      // Store raw data for future layout
      this._previous_raw_data = data;

      var position = this.position();
      if (position == 'x0')
        position = 'bottom';
      else if (position == 'y0')
        position = 'right';
      
      return {
        position: position,
        width: labelOverhang.width,
        height: labelOverhang.height
      };
    },
    setLayout: function(x, y, options) {
      // Axis is positioned with chartBase, so don't set layout
      return;
    },

    getState: function() {
      return {
        previous: {
          scale: this.scale.previous,
          xScale: this.xScale.previous,
          yScale: this.yScale.previous,
          duration: this.duration.previous
        },
        current: {
          scale: this.scale(),
          xScale: this.xScale(),
          yScale: this.yScale(),
          duration: this.duration()
        }
      };
    },
    setState: function(state) {
      this
        .xScale(state.xScale)
        .yScale(state.yScale)
        .scale(state.scale)
        .duration(state.duration);
    },

    _setupAxis: function(axis) {
      // Setup axis
      if (this.orientation() == 'vertical')
        this.axis.scale(this.yScale());
      else
        this.axis.scale(this.xScale());

      var extensions = ['orient', 'ticks', 'tickValues', 'tickSize', 'innerTickSize', 'outerTickSize', 'tickPadding', 'tickFormat'];
      var arrayExtensions = ['tickValues'];
      _.each(extensions, function(key) {
        var value = this[key] && this[key]();
        if (!_.isUndefined(value)) {
          // If value is array, treat as arguments array
          // otherwise, pass in directly
          if (_.isArray(value) && !_.contains(arrayExtensions, key))
            axis[key].apply(axis, value);
          else
            axis[key](value);
        }
      }, this);
    },

    _layoutDraw: function(data) {
      this.draw(data);
    },

    _getLabelOverhang: function() {
      // TODO Look into overhang relative to chartBase (for x0, y0)
      var overhangs = {width: [0], height: [0]};
      var orientation = this.orientation();

      this._layoutBase.selectAll('.tick').each(function() {
        try {
          // There are cases where getBBox may throw 
          // (e.g. not currently displayed in Firefox)
          var bbox = this.getBBox();

          if (orientation == 'horizontal')
            overhangs.height.push(bbox.height);
          else
            overhangs.width.push(bbox.width);
        }
        catch (ex) {
          // Ignore error
        }
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
  d3.chart('Axis').extend('AxisValues', mixin(mixins.Values));
  
})(d3, d3.chart.helpers, d3.chart.mixins);
