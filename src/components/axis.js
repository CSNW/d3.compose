import d3 from 'd3';
import {
  assign,
  includes,
  isUndefined,
  objectEach
} from '../utils';
import {
  getLayer,
  getTranslate,
  prepareTransition,
  types
} from '../helpers';
import component, {Component} from '../component';

/**
  Axis
*/
export const Axis = Component.extend({
  render() {
    const {transform, axis, gridlines} = prepareProps(this.base, this.props);
    const layer = getLayer(this.base, 'axis')
      .attr('class', 'd3c-axis')
      .attr('transform', transform);

    if (gridlines) {
      const gridlinesLayer = getLayer(this.base, 'gridlines')
        .attr('class', 'd3c-axis-gridlines');

      // TODO Attach gridlines
    } else {
      // TODO Detach gridlines
    }

    drawAxis(layer, axis);
  }
});

export const defaultPosition = 'left';

Axis.properties = {
  scale: types.any,

  position: {
    type: types.enum('top', 'right', 'bottom', 'left'),
    getDefault: () => defaultPosition
  },

  translation: {
    type: types.object,
    getDefault: ({position = defaultPosition, width, height}) => {
      return {
        top: {x: 0, y: 0},
        right: {x: width, y: 0},
        bottom: {x: 0, y: height},
        left: {x: 0, y: 0}
      }[position];
    }
  },

  orient: {
    type: types.enum('top', 'right', 'bottom', 'left'),
    getDefault: ({position = defaultPosition}) => position
  },

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

  gridlines: types.any,

  ticks: types.any,
  tickValues: types.any,
  tickSize: types.any,
  innerTickSize: types.any,
  outerTickSize: types.any,
  tickPadding: types.any,
  tickFormat: types.any
}

const axis = component(Axis);
export default axis;

// Helpers
// -------

export function drawAxis(selection, props) {
  const axis = createAxis(props);

  if (props.transition && !selection.selectAll('*').empty()) {
    selection = selection.transition().call(prepareTransition(transition));
  }

  selection.call(axis);
}

export function prepareProps(selection, props) {
  var {orientation, scale, width, height, translation, gridlines, transition} = props;

  // Set range for scale
  if (orientation == 'vertical') {
    scale = scale.copy().range([height, 0]);
  } else {
    scale = scale.copy().range([0, width]);
  }

  const transform = getTranslate(translation);
  const axis = assign({}, props, {scale});

  if (gridlines) {
    gridlines = assign({transition}, gridlines);
  }

  return {
    transform,
    axis,
    gridlines
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
