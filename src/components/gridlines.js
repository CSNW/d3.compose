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
export var Gridlines = createDraw({
  prepare: function prepare(selection, props) {
    var scale = props.scale.copy();

    if (props.orientation == 'vertical') {
      scale.range([0, props.width]);
    } else {
      scale.range([props.height, 0]);
    }

    return assign({}, props, {scale: scale});
  },

  select: function select(props) {
    var tickValues = props.tickValues;
    if (isUndefined(tickValues) && props.scale) {
      tickValues = props.scale.ticks ? props.scale.ticks(props.ticks) : props.scale.domain();
    }

    return this.selectAll('line')
      .data(tickValues || []);
  },

  enter: function enter() {
    this.append('line')
      .attr('class', 'd3c-gridline');
  },

  merge: function merge(props) {
    this
      .attr('opacity', 0)
      .each(drawLine(props));

    this.transition().call(prepareTransition(props.transition))
      .attr('opacity', 1);
  }
});

export var defaultOrientation = 'vertical';
export var defaultTicks = 10;

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
    getDefault: function() { return defaultOrientation; }
  },

  /**
    Tick count to pass to scale.ticks(...) to generate gridlines

    @property ticks
    @type Number
    @default 10
  */
  ticks: {
    type: types.number,
    getDefault: function() { return defaultTicks; }
  },

  /**
    Explicitly set tick values for gridlines

    @property tickValues
    @type Array
  */
  tickValues: types.array
}

var gridlines = component(Gridlines);
export default gridlines;

// Helpers
// -------

export function drawLine(props) {
  return function(d) {
    var x1, x2, y1, y2;
    if (props.orientation == 'vertical') {
      x1 = x2 = props.scale(d);
      y1 = 0;
      y2 = props.height;
    } else {
      x1 = 0;
      x2 = props.width;
      y1 = y2 = props.scale(d);
    }

    d3.select(this)
      .attr('x1', x1)
      .attr('x2', x2)
      .attr('y1', y1)
      .attr('y2', y2);
  };
}
