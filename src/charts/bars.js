import {assign} from '../utils';
import {
  createPrepare,
  createSeriesDraw,
  getBandwidth,
  getUniqueValues,
  getValue,
  isSeriesData,
  prepareTransition,
  scaleBandSeries,
  types
} from '../helpers';
import series from '../mixins/series'
import {
  ORIGINAL_Y,
  defaultXValue
} from '../mixins/xy';
import xyValues from '../mixins/xy-values';
import connect from '../connect';
import chart from '../chart';

// Draw vertical bars (stacked and unstacked)
export var drawVerticalBars = createSeriesDraw({
  prepare: createPrepare(
    xyValues.prepare,
    prepareStackedBars
  ),
  select: select,
  enter: enterVertical,
  merge: mergeVertical,
  exit: exitVertical
});

// Draw horizontal bars (stacked and unstacked)
export var drawHorizontalBars = createSeriesDraw({
  prepare: createPrepare(
    xyValues.prepare,
    prepareStackedBars
  ),
  select: select,
  enter: enterHorizontal,
  merge: mergeHorizontal,
  exit: exitHorizontal
});

/**
  Bars chart for single or series data, with adjacent display for scaleBandSeries.

  @example
  ```js
  // Automatic scaling
  bars({data: [1, 2, 3]});

  // Ordinal xScale
  bars({
    data: [{x: 'a', y: 10}, {x: 'b', y: 30}, {x: 'c', y: 20}],
    xScale: d3.scale.ordinal().domain(['a', 'b', 'c'])
  });

  // scaleBandSeries xScale
  bars({
    data: [
      {values: [{x: 'a', y: 10}, {x: 'b', y: 30}, {x: 'c', y: 20}]},
      {values: [{x: 'a', y: 30}, {x: 'b', y: 20}, {x: 'c', y: 10}]}
    ],
    xScale: d3c.scaleBandSeries().domain(['a', 'b', 'c']).series(2)
  });

  // Handling non-ordinal scales
  bars({
    // TODO
  });

  // Full example
  bars({
    // Series values
    data: [
      {values: [{a: 'a', b: 10}, {a: 'b', b: 30}, {a: 'c', b: 20}]},
      {values: [{a: 'a', b: 30}, {a: 'b', b: 20}, {a: 'c', b: 10}]}
    ],

    xValue: d => d.a,
    yValue: d => d.b,
    xScale: d3c.scaleBandSeries()
      .domain(['a', 'b', 'c']).series(2).adjacent(false),
    yScale: d3.scale.linear().domain([0, 50]),

    inverted: true, // horizontal
    stacked: true
  })
  ```
  @class Bars
*/
export function Bars(selection, props) {
  if (props.inverted) {
    drawHorizontalBars(selection, props);
  } else {
    drawVerticalBars(selection, props);
  }
}

export function getDefaultXScale(props) {
  return scaleBandSeries()
    .domain(getUniqueValues(props.data, props.xValue || defaultXValue))
    .series(isSeriesData(props.data) ? props.data.length : 1)
    .adjacent(!props.stacked);
}

Bars.properties = assign({},
  series.properties,
  xyValues.properties,
  {
    /**
      Scale to apply to x-values to position bars.
      Currently, only scales that support rangeBand are supported (used for determining bar width).
      This includes `d3.scale.ordinal()`, `d3.scaleBand()` (from [d3-scale](https://github.com/d3/d3-scale#scaleBand)), and `d3c.scaleBandSeries()`.
      The `range` for the scale is automatically set based on the bounds of the chart.

      @example
      ```
      bars({
        xScale: d3.scale.ordinal().domain(['a', 'b', 'c'])
      });

      bars({
        xScale: d3c.scaleBandSeries().domain(['a', 'b', 'c']).series(2)
      });
      ```
      @property xScale
      @type d3.scale.ordinal|d3.scaleBand|scaleBandSeries
    */
    xScale: {
      type: types.fn,
      getDefault: getDefaultXScale
    },

    /**
      Stack bars from separate series at each x value.
      Bars are stacked in series order and negative values are supported.

      @property stacked
      @type Boolean
      @default false
    */
    stacked: {
      type: types.boolean,
      getDefault: function() { return false; }
    },

    // TODO Need to decide the standard for what these apply to
    // (i.e. is this for the entire chart, each bar, all bars, etc.)
    className: types.any,
    style: types.any,

    // (internal)
    offset: {
      type: types.number,
      getDefault: function() { return 0; }
    },
    onMouseEnterBar: {
      type: types.fn,
      getDefault: function() { return function() {}; }
    },
    onMouseLeaveBar: {
      type: types.fn,
      getDefault: function() { return function() {}; }
    }
  }
);

// Connection
// ----------

export var mapState = function() {
  // TODO Get offset axis / offset from state
};
export var mapDispatch = function() {
  // TODO "bind" onMouseEnterBar and onMouseLeaveBar
}
export var connection = connect.map(mapState, mapDispatch);

/**
  bars
*/
var bars = connection(chart(Bars));
export default bars;

// Draw
// ----

export function select(props) {
  return this.selectAll('rect')
    .data(props.seriesValues, props.key);
}

export function enterVertical(props) {
  this.append('rect')
    .attr('y', function(d, i, j) {
      return bar0(props.yValue, props.yScale, props.offset, d, i, j);
    })
    .attr('height', 0)
    .on('mouseenter', props.onMouseEnterBar)
    .on('mouseleave', props.onMouseLeaveBar);
}

export function mergeVertical(props) {
  this
    .attr('x', function(d, i, j) {
      return barX(props.xValue, props.xScale, d, i, j);
    })
    .attr('width', barWidth(props.xScale))
    .attr('class', 'd3c-bar') // TODO props.className
    .style(props.style); // TODO Applies to all bars, update for (d, i)

  this.transition().call(prepareTransition(props.transition))
    .attr('y', function(d, i, j) {
      return barY(props.yValue, props.yScale, props.offset, props.stacked, d, i, j);
    })
    .attr('height', function(d, i, j) {
      return barHeight(props.yValue, props.yScale, props.offset, props.stacked, d, i, j);
    });
}

export function exitVertical(props) {
  this.transition().call(prepareTransition(props.transition))
    .attr('y', function(d, i, j) {
      return bar0(props.yValue, props.yScale, props.offset, d, i, j);
    })
    .attr('height', 0)
    .remove();
}

export function enterHorizontal(props) {
  this.append('rect')
    .attr('x', function(d, i, j) {
      return bar0(props.yValue, props.yScale, props.offset, d, i, j);
    })
    .attr('width', 0)
    .on('mouseenter', props.onMouseEnterBar)
    .on('mouseleave', props.onMouseLeaveBar);
}

export function mergeHorizontal(props) {
  this
    .attr('y', function(d, i, j) {
      return barX(props.xValue, props.xScale, d, i, j);
    })
    .attr('height', barWidth(props.xScale))
    .attr('class', 'd3c-bar') // TODO props.className
    .style(props.style); // TODO Applies to all bars, update for (d, i)

  this.transition().call(prepareTransition(props.transition))
    .attr('x', function(d, i, j) {
      return barY(props.yValue, props.yScale, props.offset, props.stacked, d, i ,j);
    })
    .attr('width', function(d, i, j) {
      return barHeight(props.yValue, props.yScale, props.offset, props.stacked, d, i, j);
    });
}

export function exitHorizontal(props) {
  this.transition().call(prepareTransition(props.transition))
    .attr('x', function(d, i, j) {
      return bar0(props.yValue, props.yScale, props.offset, d, i, j);
    })
    .attr('width', 0)
    .remove();
}

// Helpers
// -------

export function bar0(yValue, yScale, offset, d, i, j) {
  var y0 = yScale(0);
  var y = getValue(yValue, yScale, d, i, j);

  return y <= y0 ? y0 - offset : y0 + offset;
}

export function barX(xValue, xScale, d, i, j) {
  var x = getValue(xValue, xScale, d, i, j);

  if (!xScale.centered || !xScale.centered()) {
    return x;
  }

  // For ordinal-series scale, x is centered, get value at edge
  var width = getBandwidth(xScale);
  return x - (width / 2);
}

export function barY(yValue, yScale, offset, stacked, d, i, j) {
  var y0 = yScale(0);
  var y = getValue(yValue, yScale, d, i, j);

  if (stacked) {
    y0 = yScale(d.__previous || 0);
    offset = j === 0 ? offset : 0;
  }

  return y < y0 ? y : y0 + offset;
}

export function barWidth(xScale) {
  return getBandwidth(xScale);
}

export function barHeight(yValue, yScale, offset, stacked, d, i, j) {
  var y0 = yScale(0);
  var y = getValue(yValue, yScale, d, i, j);

  if (stacked) {
    y0 = yScale(d.__previous || 0);
    offset = j === 0 ? offset : 0;
  }

  var height = Math.abs(y0 - y - offset);
  return height > 0 ? height : 0;
}

export function prepareStackedBars(selection, props) {
  var stacked = props.stacked;
  var xValue = props.xValue;
  var yValue = props.yValue;
  var data = props.data;

  if (!stacked || !isSeriesData(data)) {
    return props;
  }

  // TODO Investigate using d3.stack
  // (here or on data before it's passed in, e.g. look for y0 on point)
  var grouped = {};
  data = data.map(function(series, j) {
    var values = series.values.map(function(d, i) {
      var x = xValue(d, i, j);
      var y = yValue(d, i, j);
      var previous, stackedY;

      if (!grouped[x]) {
        grouped[x] = {pos: 0, neg: 0};
      }

      if (y >= 0) {
        previous = grouped[x].pos;
        grouped[x].pos = stackedY = grouped[x].pos + y;
      } else {
        previous = grouped[x].neg;
        grouped[x].neg = stackedY = grouped[x].neg + y;
      }

      d = assign({}, d, {
        y: stackedY,
        __previous: previous
      });
      d[ORIGINAL_Y] = y;

      return d;
    });

    return assign({}, series, {values: values});
  });

  return assign({}, props, {
    data: data,
    yValue: function(d) { return d.y; }
  });
}
