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
export const Axis = Component.extend({
  render() {
    const {transform, axis} = prepare(this.base, this.props);
    const layer = getLayer(this.base, 'axis')
      .attr('class', 'd3c-axis')
      .attr('transform', transform);

    drawAxis(layer, axis);
  },

  getDimensions() {
    const {axis} = prepare(this.base, this.props);
    const layer = getLayer(this.base, '_layout')
      .style({display: 'none'});

    drawAxis(layer, axis);
    return getDimensions(layer);
  }
});

export const defaultPosition = 'left';

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
    getDefault: () => defaultPosition
  },

  /**
    @property translation
    @type Object
    @default (set based on position)
  */
  translation: {
    type: types.object,
    getDefault: ({position = defaultPosition, width, height}) => {
      return {
        top: {x: 0, y: height},
        right: {x: 0, y: 0},
        bottom: {x: 0, y: 0},
        left: {x: width, y: 0}
      }[position];
    }
  },

  /**
    @property orient
    @type String
    @default (set based on position)
  */
  orient: {
    type: types.enum('top', 'right', 'bottom', 'left'),
    getDefault: ({position = defaultPosition}) => position
  },

  /**
    @property orientation
    @type String
    @default (set based on position)
  */
  orientation: {
    type: types.enum('vertical', 'horizontal'),
    getDefault: ({position = defaultPosition}) => {
      return {
        top: 'horizontal',
        right: 'vertical',
        bottom: 'horizontal',
        left: 'vertical'
      }[position];
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

const axis = component(Axis);
export default axis;

// Helpers
// -------

export function drawAxis(selection, props) {
  const axis = createAxis(props);

  if (props.transition && !selection.selectAll('*').empty()) {
    selection = selection.transition().call(prepareTransition(props.transition));
  }

  selection.call(axis);
}

export function prepare(selection, props) {
  var {orientation, scale, width, height, translation} = props;

  // Set range for scale
  if (orientation == 'vertical') {
    scale = scale.copy().range([height, 0]);
  } else {
    scale = scale.copy().range([0, width]);
  }

  const transform = getTranslate(translation);
  const axis = assign({}, props, {scale});

  return {
    transform,
    axis
  };
}

export function createAxis(props) {
  const axis = d3.svg.axis();

  objectEach(props, (value, key) => {
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
