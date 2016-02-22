import d3 from 'd3';
import {
  assign,
  isUndefined,
  objectEach
} from '../utils';
import {
  getDimensions,
  getLayer,
  getTranslate,
  prepareTransition,
  types
} from '../helpers';
import component, {Component} from '../component';

/**
  Axis component (wraps `d3.axis`)

  @example
  ```js
  var scale = d3.scale.linear().domain([0, 100]);

  // Simple
  axis({position: 'left', scale});

  // Proxied d3.axis properties
  axis({
    position: 'left',
    scale,

    ticks: 10,
    tickValues: [0, 50, 100],
    tickSize: [4, 6],
    innerTickSize: 4,
    outerTickSize: 6,
    tickPadding: 3,
    tickFormat: d3.format(',.0f')
  });
  ```
  @class Axis
*/
export var Axis = Component.extend({
  render: function render() {
    var prepared = prepare(this.base, this.props);
    var layer = getLayer(this.base, 'axis')
      .attr('class', 'd3c-axis')
      .attr('transform', prepared.transform);

    drawAxis(layer, prepared.axis);
  },

  getDimensions: function() {
    var prepared = prepare(this.base, this.props);
    var layer = getLayer(this.base, '_layout')
      .style({display: 'none'});

    drawAxis(layer, prepared.axis);
    return getDimensions(layer);
  }
});

export var defaultPosition = 'left';

Axis.properties = {
  /**
    Scale to pass to d3.axis

    @property scale
    @type d3.scale
  */
  scale: types.any,

  /**
    "position" of axis relative to chart
    (used to set defaults for orientation and orient)

    @property position
    @type String
    @default left
  */
  position: {
    type: types.enum('top', 'right', 'bottom', 'left'),
    getDefault: function() { return defaultPosition; }
  },

  /**
    @property translation
    @type Object
    @default (set based on position)
  */
  translation: {
    type: types.object,
    getDefault: function(props) {
      return {
        top: {x: 0, y: props.height},
        right: {x: 0, y: 0},
        bottom: {x: 0, y: 0},
        left: {x: props.width, y: 0}
      }[props.position || defaultPosition];
    }
  },

  /**
    @property orient
    @type String
    @default (set based on position)
  */
  orient: {
    type: types.enum('top', 'right', 'bottom', 'left'),
    getDefault: function(props) {
      return props.position || defaultPosition;
    }
  },

  /**
    @property orientation
    @type String
    @default (set based on position)
  */
  orientation: {
    type: types.enum('vertical', 'horizontal'),
    getDefault: function(props) {
      return {
        top: 'horizontal',
        right: 'vertical',
        bottom: 'horizontal',
        left: 'vertical'
      }[props.position || defaultPosition];
    }
  },

  // d3.axis properties
  ticks: types.any,
  tickValues: types.any,
  tickSize: types.any,
  innerTickSize: types.any,
  outerTickSize: types.any,
  tickPadding: types.any,
  tickFormat: types.any
};

var axis = component(Axis);
export default axis;

// Helpers
// -------

export function drawAxis(selection, props) {
  var axis = createAxis(props);

  if (props.transition && !selection.selectAll('*').empty()) {
    selection = selection.transition().call(prepareTransition(props.transition));
  }

  selection.call(axis);
}

export function prepare(selection, props) {
  var scale = props.scale.copy();

  // Center tick for scaleBandSeries
  if (scale.series && scale.centered) {
    scale.series(1).centered(false);
  }

  // Set range for scale
  if (props.orientation == 'vertical') {
    scale = scale.range([props.height, 0]);
  } else {
    scale = scale.range([0, props.width]);
  }

  var transform = getTranslate(props.translation);
  var axis = assign({}, props, {scale: scale});

  return {
    transform: transform,
    axis: axis
  };
}

export function createAxis(props) {
  var axis = d3.svg.axis();

  objectEach(props, function(value, key) {
    if (!isUndefined(value) && axis[key]) {
      // If value is array, treat as arguments array (except for tickValues)
      // otherwise, pass in directly
      if (Array.isArray(value) && key != 'tickValues') {
        axis[key].apply(axis, value);
      } else {
        axis[key](value);
      }
    }
  });

  return axis;
}
