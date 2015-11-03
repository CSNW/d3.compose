import d3 from 'd3';
import {
  contains,
  defaults,
  isBoolean,
  isUndefined
} from '../utils';
import {
  property,
  translate,
  mixin,
  createHelper
} from '../helpers';
import {
  XY,
  Transition,
  StandardLayer
} from '../mixins';
import Component from '../Component';
import Gridlines from './Gridlines';

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

      var charts = [];
      var xAxis = d3c.axis({scale: scales.x});
      var yAxis = d3c.axis({scale: scales.y});

      return [
        // Display y-axis to left of charts
        [yAxis, d3c.layered(charts)],

        // Display x-axis below charts
        xAxis
      ];
    });
  ```
  @class Axis
  @extends Component, XY, Transition, StandardLayer
*/
var Mixed = mixin(Component, XY, Transition, StandardLayer);
var Axis = Mixed.extend({
  initialize: function(options) {
    Mixed.prototype.initialize.call(this, options);

    // Create two axes (so that layout and transitions work)
    // 1. Display and transitions
    // 2. Layout (draw to get width, but separate so that transitions aren't affected)
    this.axis = d3.svg.axis();
    this._layout_axis = d3.svg.axis();

    this.axis_base = this.base.append('g').attr('class', 'chart-axis');
    this._layout_base = this.base.append('g')
      .attr('class', 'chart-axis chart-layout')
      .append('g')
        .style('display', 'none');

    // Use standard layer for extensibility
    this.standardLayer('Axis', this.axis_base);

    // Setup gridlines
    this.attachGridlines();
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
  scale: property({
    set: function(value) {
      if (this.orientation() == 'vertical') {
        this.yScale(value);
        value = this.yScale();
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
    (top, right, bottom, left)

    Note: x0 and y0 are currently disabled for more testing

    @property position
    @type String
    @default bottom
  */
  position: property({
    default_value: 'bottom',
    validate: function(value) {
      return contains(['top', 'right', 'bottom', 'left'], value);
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
  translation: property({
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
  orient: property({
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
  orientation: property({
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

  /**
    Attach gridlines for axis
    (`true` to show with default options, `{...}` to pass options to `Gridlines`)

    @property gridlines
    @type Boolean|Object
    @default false
  */
  gridlines: property({
    get: function(value) {
      if (isBoolean(value))
        value = {display: value};
      else if (!value)
        value = {display: false};

      return value;
    }
  }),

  // d3.axis extensions
  ticks: property(),
  tickValues: property(),
  tickSize: property(),
  innerTickSize: property(),
  outerTickSize: property(),
  tickPadding: property(),
  tickFormat: property(),

  onDataBind: function onDataBind(selection) {
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
    // Render axis
    selection.call(this.axis);
  },
  onMerge: function onUpdate(selection) {
    // Position axis
    selection.attr('transform', this.translation());
  },
  onUpdateTransition: function onUpdateTransition(selection) {
    // Render axis (with transition)
    this.setupTransition(selection);

    selection.call(this.axis);
  },
  onExit: function onExit(selection) {
    selection.selectAll('g').remove();
  },

  getLayout: function() {
    // Draw layout axis
    this.setScales();
    this._setupAxis(this._layout_axis);
    this._layout_base.call(this._layout_axis);

    // Calculate layout
    // (make layout axis visible for width calculations in Firefox)
    this._layout_base.style('display', 'block');

    var label_overhang = this._getLabelOverhang();

    this._layout_base.style('display', 'none');

    return {
      position: this.position(),
      width: label_overhang.width,
      height: label_overhang.height
    };
  },
  setLayout: function() {
    // Axis is positioned as chart layer, so don't set layout
    return;
  },

  attachGridlines: function() {
    var gridlines_options = gridlinesOptions(this);
    var gridlines = this._gridlines = gridlines_options.display && createGridlines(this, gridlines_options);

    this.on('draw', function() {
      gridlines_options = gridlinesOptions(this);

      if (gridlines)
        gridlines.options(gridlines_options);
      else if (gridlines_options.display)
        gridlines = this._gridlines = createGridlines(this, gridlines_options);

      if (gridlines && gridlines_options.display)
        gridlines.draw();
      else if (gridlines)
        gridlines.draw([false]);
    }.bind(this));

    function gridlinesOptions(axis) {
      return defaults({}, axis.gridlines(), {
        parent: axis,
        xScale: axis.xScale(),
        yScale: axis.yScale(),
        ticks: axis.ticks(),
        tickValues: axis.tickValues(),
        orientation: axis.orientation() == 'horizontal' ? 'vertical' : 'horizontal'
      });
    }

    function createGridlines(axis, gridline_options) {
      var base = axis.base.append('g').attr('class', 'chart-axis-gridlines');
      return new Gridlines(base, gridline_options);
    }
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

    this._layout_base.selectAll('g').each(function() {
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
}, {
  layer_type: 'chart',
  z_index: 60
});

var axis = createHelper('Axis');

export {
  Axis as default,
  axis
};
