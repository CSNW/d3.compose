(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Axis component for XY data

    Available d3.axis extensions:
    - ticks
    - tickValues
    - tickSize
    - innerTickSize
    - outerTickSize
    - tickPadding
    - tickFormat

    @class Axis
  */
  d3.chart('Component').extend('Axis', mixin(mixins.XY, {
    initialize: function() {
      // Create two axes (so that layout and transitions work)
      // 1. Display and transitions
      // 2. Layout (draw to get width, but separate so that transitions aren't affected)
      this.axis = d3.svg.axis();
      this._layout_axis = d3.svg.axis();

      this.axis_base = this.base.append('g').attr('class', 'chart-axis');
      this._layout_base = this.base.append('g')
        .attr('class', 'chart-axis chart-layout')
        .attr('style', 'display: none;');

      this.layer('Axis', this.axis_base, {
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

            if (!helpers.utils.isUndefined(chart.delay()))
              this.delay(chart.delay());

            if (chart._skip_transition) {
              this.duration(0);
              chart._skip_transition = undefined;
            }
            else if (!helpers.utils.isUndefined(chart.duration())) {
              this.duration(chart.duration());
            }

            if (!helpers.utils.isUndefined(chart.ease()))
              this.ease(chart.ease());

            this.call(chart.axis);
          },
          'exit': function() {
            this.selectAll('g').remove();
          }
        }
      });

      this.layer('_LayoutAxis', this._layout_base, {
        dataBind: function(data) {
          var chart = this.chart();
          chart._setupAxis(chart._layout_axis);
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

    /**
      Scale to pass to d3.axis
      (if Object is given, helpers.createScale is used)

      @property scale
      @type Object|d3.scale
    */
    scale: property('scale', {
      type: 'Function',
      set: function(value) {
        var scale = helpers.createScale(value);

        if (this.orientation() == 'vertical')
          this.yScale(scale);
        else
          this.xScale(scale);

        return {
          override: scale
        };
      }
    }),

    /**
      Position axis relative to chart
      (top, right, bottom, left, x0, y0)

      @property position
      @type String
      @default bottom
    */
    position: property('position', {
      default_value: 'bottom',
      validate: function(value) {
        return helpers.utils.contains(['top', 'right', 'bottom', 'left', 'x0', 'y0'], value);
      },
      set: function() {
        // Update scale -> xScale/yScale when position changes
        if (this.scale())
          this.scale(this.scale());
      }
    }),

    /**
      {x,y} translation of axis relative to chart
      (set by default based on position)

      @property translation
      @type Object
      @default (set based on position)
    */
    translation: property('translation', {
      default_value: function() {
        switch (this.position()) {
          case 'top':
            return {x: 0, y: 0};
          case 'right':
            return {x: this.width(), y: 0};
          case 'bottom':
            return {x: 0, y: this.height()};
          case 'left':
            return {x: 0, y: 0};
          case 'x0':
            return {x: this.x0(), y: 0};
          case 'y0':
            return {x: 0, y: this.y0()};
        }
      },
      get: function(value) {
        return helpers.translate(value);
      }
    }),

    /**
      Axis orient for ticks
      (set by default based on position)

      @property orient
      @type String
      @default (set based on position)
    */
    orient: property('orient', {
      default_value: function() {
        var orient = this.position();

        if (orient == 'x0')
          orient = 'left';
        else if (orient == 'y0')
          orient = 'bottom';

        return orient;
      }
    }),

    /**
      Axis orientation (vertical or horizonal)

      @property orientation
      @type String
      @default (set based on position)
    */
    orientation: property('orientation', {
      validate: function(value) {
        return helpers.utils.contains(['horizontal', 'vertical'], value);
      },
      default_value: function() {
        return {
          top: 'horizontal',
          right: 'vertical',
          bottom: 'horizontal',
          left: 'vertical',
          x0: 'vertical',
          y0: 'horizontal'
        }[this.position()];
      },
      set: function() {
        // Update scale -> xScale/yScale when orientation changes
        if (this.scale())
          this.scale(this.scale());
      }
    }),

    // d3.axis extensions
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
      this._layout_base.attr('style', 'display: block;');

      var label_overhang = this._getLabelOverhang();

      this._layout_base.attr('style', 'display: none;');

      // 4. Draw with previous values
      if (this._previous_raw_data) {
        this.setState(helpers.utils.extend(state.previous, {duration: 0}));

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
        width: label_overhang.width,
        height: label_overhang.height
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
      var array_extensions = ['tickValues'];
      helpers.utils.each(extensions, function(key) {
        var value = this[key] && this[key]();
        if (!helpers.utils.isUndefined(value)) {
          // If value is array, treat as arguments array
          // otherwise, pass in directly
          if (helpers.utils.isArray(value) && !helpers.utils.contains(array_extensions, key))
            axis[key].apply(axis, value);
          else
            axis[key](value);
        }
      }, this);
    },

    _getLabelOverhang: function() {
      // TODO Look into overhang relative to chartBase (for x0, y0)
      var overhangs = {width: [0], height: [0]};
      var orientation = this.orientation();

      this._layout_base.selectAll('.tick').each(function() {
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
        width: helpers.utils.max(overhangs.width),
        height: helpers.utils.max(overhangs.height)
      };
    }
  }), {
    layer_type: 'chart',
    z_index: 60
  });

})(d3, d3.compose.helpers, d3.compose.mixins);
