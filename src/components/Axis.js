import {
  contains,
  extend,
  isUndefined
} from '../utils';
import {
  property,
  translate,
  di,
  mixin,
  createHelper
} from '../helpers';
import {
  XY,
  Transition,
  StandardLayer
} from '../mixins';
import Component from '../Component';

/**
  Axis component for XY data (wraps `d3.axis`).

  Available d3.axis extensions:

  - `ticks`
  - `tickValues`
  - `tickSize`
  - `innerTickSize`
  - `outerTickSize`
  - `tickPadding`
  - `tickFormat`

  ### Extending

  To extend the `Axis` component, the following methods are available:

  - `onInsert`
  - `onEnter`
  - `onEnterTransition`
  - `onUpdate`
  - `onUpdateTransition`
  - `onMerge`
  - `onMergeTransition`
  - `onExit`
  - `onExitTransition`

  @example
  ```js
  d3.select('#chart')
    .chart('Compose', function(data) {
      var scales = {
        x: {data: data, key: 'x'},
        y: {data: data, key: 'y'}
      };

      return {
        components: {
          'x.axis': {
            type: 'Axis',
            position: 'bottom',
            scale: scales.x
          },
          'y.axis': {
            type: 'Axis',
            position: 'left',
            scale: scales.y
          }
        }
      };
    });
  ```
  @class Axis
  @extends Component, XY, Transition, StandardLayer
*/
var Axis = Component.extend('Axis', mixin(XY, Transition, StandardLayer, {
  initialize: function() {
    // Create two axes (so that layout and transitions work)
    // 1. Display and transitions
    // 2. Layout (draw to get width, but separate so that transitions aren't affected)
    this.axis = d3.svg.axis();

    this.axis_base = this.base.append('g').attr('class', 'chart-axis');
    this._layout_base = this.base.append('g')
      .attr('class', 'chart-axis chart-layout')
      .attr('style', 'display: none;');

    // Use standard layer for extensibility
    this.standardLayer('Axis', this.axis_base);

    this.layer('_LayoutAxis', this._layout_base, {
      dataBind: function(data) {
        return this.selectAll('g').data([0]);
      },
      insert: function() {
        return this.chart().onInsert(this);
      },
      events: {
        'enter': function() {
          this.chart().onEnter(this);
        },
        'merge': function() {
          this.chart().onMerge(this);
        }
      }
    });
  },

  /**
    Scale to pass to d3.axis

    - If `xScale`/`yScale` are given, `scale` is set automatically based on `position`.
    - Can be `d3.scale` or, if `Object` is given, `helpers.createScale` is used

    @example
    ```js
    // Set with d3.scale directly
    axis.scale(d3.scale());

    // or with Object passed helpers.createScale
    axis.scale({data: data, key: 'x'});

    // For x0/y0 position, both xScale and yScale needed
    // (scale is automatically set by position)
    axis.xScale({domain: [0, 100]});
    axis.yScale({domain: [0, 10]});
    axis.position('y0');

    // -> axis.scale() -> axis.xScale by default
    ```
    @property scale
    @type Object|d3.scale
  */
  scale: property('scale', {
    type: 'Function',
    set: function(value) {
      if (this.orientation() == 'vertical') {
        this.yScale(value);
        value = this.yValue();
      }
      else {
        this.xScale(value);
        value = this.xScale();
      }

      return {
        override: value
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
      return contains(['top', 'right', 'bottom', 'left', 'x0', 'y0'], value);
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
      return translate(value);
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
      return contains(['horizontal', 'vertical'], value);
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

  onDataBind: function onDataBind(selection, data) {
    // Setup axis (scale and properties)
    this._setupAxis(this.axis);

    // Force addition of just one axis with dummy data array
    // (Axis will be drawn using underlying chart scales)
    return selection.selectAll('g').data([0]);
  },
  onInsert: function onInsert(selection) {
    return selection.append('g');
  },
  onEnter: function onEnter(selection) {
    // Place and render axis
    selection.call(this.axis);
  },
  onMerge: function onUpdate(selection) {
    selection.attr('transform', this.translation());
  },
  onUpdateTransition: function onUpdateTransition(selection) {
    // Render axis (with transition)
    this.setupTransition(selection);

    if (this._skip_transition) {
      selection.duration(0);
      this._skip_transition = undefined;
    }

    selection.call(this.axis);
  },
  onExit: function onExit(selection) {
    selection.selectAll('g').remove();
  },

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
      this.setState(extend(state.previous, {duration: 0}));

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
      axis.scale(this.yScale());
    else
      axis.scale(this.xScale());

    var extensions = ['orient', 'ticks', 'tickValues', 'tickSize', 'innerTickSize', 'outerTickSize', 'tickPadding', 'tickFormat'];
    var array_extensions = ['tickValues'];
    extensions.forEach(function(key) {
      var value = this[key] && this[key]();
      if (!isUndefined(value)) {
        // If value is array, treat as arguments array
        // otherwise, pass in directly
        if (Array.isArray(value) && !contains(array_extensions, key))
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
      width: d3.max(overhangs.width),
      height: d3.max(overhangs.height)
    };
  }
}), {
  layer_type: 'chart',
  z_index: 60
});

var axis = createHelper('Axis');

export {
  Axis as default,
  axis
};
