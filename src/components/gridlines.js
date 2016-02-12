import d3 from 'd3';
import {
  assign,
  isUndefined
} from '../utils';
import {
  createDraw,
  prepareTransition,
  types
} from '../helpers';
import {getValue} from '../mixins/xy';
import component from '../component';

export const Gridlines = createDraw({
  prepare(selection, props) {
    const {orientation, width, height} = props;
    const scale = props.scale.copy();

    if (orientation == 'vertical') {
      scale.range([0, width]);
    } else {
      scale.range([height, 0]);
    }

    return assign({}, props, {scale});
  },

  select({scale, ticks, tickValues}) {
    if (isUndefined(tickValues) && scale && scale.ticks) {
      if (ticks != null && !Array.isArray(ticks)) {
        ticks = [ticks];
      }

      tickValues = scale.ticks.apply(scale, ticks);
    }

    return this.selectAll('line')
      .data(tickValues || []);
  },

  enter() {
    this.append('line')
      .attr('class', 'd3c-gridline');
  },

  merge(props) {
    this
      .attr('opacity', 0)
      .each(drawLine(props));

    this.transition().call(prepareTransition(props.transition))
      .attr('opacity', 1);
  }
});

export const defaultValue = (d) => d;
export const defaultOrientation = 'vertical';
export const defaultTicks = [10];

Gridlines.properties = {
  scale: types.any,

  value: {
    type: types.any,
    getDefault: () => defaultValue
  },

  orientation: {
    type: types.enum('vertical', 'horizontal'),
    getDefault: () => defaultOrientation
  },

  ticks: {
    type: types.any,
    getDefault: () => defaultTicks
  },

  tickValues: types.any
}

const gridlines = component(Gridlines);
export default gridlines;

// Helpers
// -------

export function drawLine({orientation, value, scale, width, height}) {
  return function(d, i, j) {
    var x1, x2, y1, y2;
    if (orientation == 'vertical') {
      x1 = x2 = getValue(value, scale, d, i, j);
      y1 = 0;
      y2 = height;
    } else {
      x1 = 0;
      x2 = width;
      y1 = y2 = getValue(value, scale, d, i, j);
    }

    d3.select(this)
      .attr('x1', x1)
      .attr('x2', x2)
      .attr('y1', y1)
      .attr('y2', y2);
  };
}
