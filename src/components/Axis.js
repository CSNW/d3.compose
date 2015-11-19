import d3 from 'd3';
import {
  contains,
  defaults,
  extend,
  isBoolean,
  isUndefined,
  objectEach
} from '../utils';
import {
  createHelper,
  createScale,
  dimensions,
  mixin,
  translate
} from '../helpers';
import {
  Transition,
  XY
} from '../mixins';
import Component from '../Component';
import Gridlines from './Gridlines';

// *** TODO Move to other files
var types = {
  string: {},
  number: {},
  object: {},
  any: {}
};
function checkProp(/* prop, definition */) {}

function createPrepare() {
  var steps = Array.prototype.slice.call(arguments);

  return function() {
    var selection = this.base;
    var context = this;

    return steps.reduce(function(props, step) {
      return step(selection, props, context);
    }, this.props);
  };
}

function createTransition(props) {
  return function() {
    if (!isUndefined(props.duration))
      this.duration(props.duration);
    if (!isUndefined(props.delay))
      this.delay(props.delay);
    if (!isUndefined(props.ease))
      this.ease(props.ease);
  };
}

function getLayer(selection, id) {
  var layer = selection.select('[data-layer="' + id + '"]');
  if (layer.empty())
    layer = selection.append('g').attr('data-layer', id);

  return layer;
}

Component.properties = {
  position: {
    type: types.string,
    validate: function(value) {
      return contains(['top', 'right', 'bottom', 'left'], value);
    }
  },
  width: {
    type: types.number,
    getDefault: function(selection) {
      // TODO Move to Component.prepare
      return dimensions(selection).width;
    }
  },
  height: {
    type: types.number,
    getDefault: function(selection) {
      // TODO Move to Component.prepare
      return dimensions(selection).height;
    }
  }
};
// ***

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
  @extends Component, Transition
*/
var Mixed = mixin(Component, Transition);
var Axis = Mixed.extend({
  // --- TODO Move to Chart/Base
  update: function(selection, props) {
    this.base = selection;
    this.props = this.prepareProps(props);
  },
  prepareProps: function(props) {
    var properties = this.constructor && this.constructor.properties;
    if (!properties)
      return props;

    var prepared = extend({}, props);

    objectEach(properties, function(definition, key) {
      var prop = prepared[key];

      if (!isUndefined(prop))
        checkProp(prop, definition);
      else if (definition.getDefault)
        prepared[key] = definition.getDefault(this.base, prepared, this);
    }, this);

    return prepared;
  },
  attach: function(id, Type, selection, props) {
    var attached = this.attached[id];

    if (attached)
      attached.options(props);
    else
      attached = new Type(selection, props);

    attached.draw();
    this.attached[id] = attached;
  },
  detach: function(id) {
    var attached = this.attached[id];
    if (attached) {
      attached.base.remove();
      delete this.attached[id];
    }
  },
  // ---

  prepare: createPrepare(
    prepareScales,
    prepareAxis,
    prepareGridlines
  ),

  render: function() {
    // TODO Move to lifecycle
    // also, update is called on getLayout and render
    // to get up-to-date width/height defaults in scales
    // will need to move width/height and scale to prepare
    // (rather than getDefaults)
    this.update(this.base, this.options());

    var props = this.prepare();
    var layer = getLayer(this.base, 'axis')
      .attr('class', 'chart-axis')
      .attr('transform', props.transform);

    if (props.gridlines) {
      var gridlines_layer = getLayer(this.base, 'gridlines')
        .attr('class', 'chart-axis-gridlines');
      this.attach('gridlines', Gridlines, gridlines_layer, props.gridlines);
    }
    else {
      this.detach('gridlines');
    }

    drawAxis(layer, {axis: props.axis, transition: props.transition});
  },

  getLayout: function() {
    // TODO Move to lifecycle
    this.update(this.base, this.options());

    // Draw layout axis
    var props = {
      axis: this.prepare().axis
    };
    var layer = getLayer(this.base, 'layout')
      .attr('class', 'chart-axis chart-layout')
      .style({display: 'none'});

    drawAxis(layer, props);

    // Calculate layout
    // (make layout axis visible for width calculations in Firefox)
    layer.style({display: 'block'});

    var label_overhang = getLabelOverhang(layer, this.props.orientation);

    layer.style({display: 'none'});

    return {
      position: this.props.position,
      width: label_overhang.width,
      height: label_overhang.height
    };
  },
  setLayout: function() {
    // Axis is positioned as chart layer, so don't set layout
  },

  // === TODO Remove, compatibility with current system
  initialize: function() {
    Mixed.prototype.initialize.apply(this, arguments);
    this.attached = {};
  },
  draw: function() {
    this.render();
  }
  // ===
}, {
  properties: extend({}, Component.properties, {
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
    scale: types.any,

    /**
      {x,y} translation of axis relative to chart
      (set by default based on position)

      @property translation
      @type Object
      @default (set based on position)
    */
    translation: {
      type: types.object,
      getDefault: function(selection, props) {
        return {
          top: {x: 0, y: 0},
          right: {x: props.width, y: 0},
          bottom: {x: 0, y: props.height},
          left: {x: 0, y: 0}
        }[props.position];
      }
    },

    /**
      Axis orient for ticks
      (set by default based on position)

      @property orient
      @type String
      @default (set based on position)
    */
    orient: {
      type: types.string,
      getDefault: function(selection, props) {
        return props.position;
      }
    },

    /**
      Axis orientation (vertical or horizonal)

      @property orientation
      @type String
      @default (set based on position)
    */
    orientation: {
      type: types.string,
      validate: function(value) {
        return contains(['horizontal', 'vertical'], value);
      },
      getDefault: function(selection, props) {
        return {
          top: 'horizontal',
          right: 'vertical',
          bottom: 'horizontal',
          left: 'vertical',
          x0: 'vertical',
          y0: 'horizontal'
        }[props.position];
      }
    },

    /**
      Attach gridlines for axis
      (`true` to show with default options, `{...}` to pass options to `Gridlines`)

      @property gridlines
      @type Boolean|Object
      @default false
    */
    gridlines: types.any,

    ticks: types.any,
    tickValues: types.any,
    tickSize: types.any,
    innerTickSize: types.any,
    outerTickSize: types.any,
    tickPadding: types.any,
    tickFormat: types.any
  }),

  layer_type: 'chart',
  z_index: 60
});

// TODO Move to xy.prepare
function prepareScales(selection, props) {
  var xScale = props.orientation == 'horizontal' ? props.scale : props.xScale;
  if (!xScale)
    xScale = XY.getDefaultXScale.call({data: function() { return props.data; }});

  xScale = createScale(xScale);
  XY.setXScaleRange.call({width: function() { return props.width; }}, xScale);

  var yScale = props.orientation == 'vertical' ? props.scale : props.yScale;
  if (!yScale)
    yScale = XY.getDefaultYScale.call({data: function() { return props.data; }});

  yScale = createScale(yScale);
  XY.setYScaleRange.call({height: function() { return props.height; }}, yScale);

  return extend({}, props, {
    xScale: xScale,
    yScale: yScale,
    scale: props.orientation == 'vertical' ? yScale : xScale
  });
}

function prepareAxis(selection, props, context) {
  var axis = {
    scale: props.scale,
    orient: props.orient,
    ticks: props.ticks,
    tickValues: props.tickValues,
    tickSize: props.tickSize,
    innerTickSize: props.innerTickSize,
    outerTickSize: props.outerTickSize,
    tickPadding: props.tickPadding,
    tickFormat: props.tickFormat
  };
  var transform = translate(props.translation);
  var transition = {
    // Pull properties from Transition mixin
    duration: context.duration(),
    delay: context.delay(),
    ease: context.ease()
  };

  return extend({}, props, {
    axis: axis,
    transform: transform,
    transition: transition
  });
}

function prepareGridlines(selection, props, context) {
  var gridlines = props.gridlines;

  if (gridlines) {
    if (isBoolean(gridlines))
      gridlines = {};

    gridlines = defaults({}, gridlines, {
      parent: context,
      xScale: props.xScale,
      yScale: props.yScale,
      ticks: props.ticks,
      tickValues: props.tickValues,
      orientation: props.orientation == 'horizontal' ? 'vertical' : 'horizontal'
    });
  }

  return extend({}, props, {gridlines: gridlines});
}

function drawAxis(selection, props) {
  var axis = createAxis(props.axis);

  if (props.transition && !selection.selectAll('*').empty())
    selection = selection.transition().call(createTransition(props.transition));

  selection.call(axis);
}

function createAxis(props) {
  var axis = d3.svg.axis();
  var array_extensions = ['tickValues'];

  objectEach(props, function(value, key) {
    if (!isUndefined(value)) {
      // If value is array, treat as arguments array
      // otherwise, pass in directly
      if (Array.isArray(value) && !contains(array_extensions, key))
        axis[key].apply(axis, value);
      else
        axis[key](value);
    }
  });

  return axis;
}

function getLabelOverhang(selection, orientation) {
  // TODO Look into overhang relative to chartBase (for x0, y0)
  var overhangs = {width: [0], height: [0]};

  selection.selectAll('g').each(function() {
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

var axis = createHelper('Axis');

export {
  Axis as default,
  axis,
  prepareAxis,
  drawAxis,
  createAxis
};
