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
import component from '../component';

/**
  Gridlines component

  @example
  ```js
  var scale = d3.scale.linear().domain([0, 100]);

  // Vertical
  gridlines({orientation: 'vertical', scale});

  // Horizontal
  gridlines({orientation: 'horizontal', scale});

  // Full example
  gridlines({
    orientation: 'horizontal',
    scale,
    ticks: [10],
    tickValues: [0, 50, 100]
  });
  ```
  @class Gridlines
*/
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
      tickValues = scale.ticks(ticks);
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

export const defaultOrientation = 'vertical';
export const defaultTicks = 10;

Gridlines.properties = {
  /**
    Scale use to position gridlines and generate ticks

    @property scale
    @type d3.scale
  */
  scale: types.any,

  /**
    Orientation to draw ticklines

    @property orientation
    @type String
    @default 'vertical'
  */
  orientation: {
    type: types.enum('vertical', 'horizontal'),
    getDefault: () => defaultOrientation
  },

  /**
    Tick count to pass to scale.ticks(...) to generate gridlines

    @property ticks
    @type Number
    @default 10
  */
  ticks: {
    type: types.number,
    getDefault: () => defaultTicks
  },

  /**
    Explicitly set tick values for gridlines

    @property tickValues
    @type Array
  */
  tickValues: types.array
}

const gridlines = component(Gridlines);
export default gridlines;

// Helpers
// -------

export function drawLine({orientation, scale, width, height}) {
  return function(d, i, j) {
    var x1, x2, y1, y2;
    if (orientation == 'vertical') {
      x1 = x2 = scale(d, j);
      y1 = 0;
      y2 = height;
    } else {
      x1 = 0;
      x2 = width;
      y1 = y2 = scale(d, j);
    }

    d3.select(this)
      .attr('x1', x1)
      .attr('x2', x2)
      .attr('y1', y1)
      .attr('y2', y2);
  };
}
