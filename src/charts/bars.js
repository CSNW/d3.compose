import {
  assign
} from '../utils';
import {
  createPrepare,
  connect,
  prepareTransition,
  scaleBandSeries,
  types
} from '../helpers';
import {
  createSeriesDraw,
  properties as seriesProperties,
  isSeriesData
} from '../mixins/series';
import {
  ORIGINAL_Y,
  defaultXValue
} from '../mixins/xy';
import {
  getValue,
  getWidth,
  getOrdinalDomain,
  properties as xyValuesProperties,
  prepare as xyValuesPrepare
} from '../mixins/xy-values';
import {prepare as xyValuesInvertedPrepare} from '../mixins/xy-values-inverted';
import chart from '../chart';

// Draw vertical bars (stacked and unstacked)
export const drawVerticalBars = createSeriesDraw({
  prepare: createPrepare(
    xyValuesPrepare,
    prepareStackedBars
  ),
  select,
  enter: enterVertical,
  merge: mergeVertical,
  exit: exitVertical
});

// Draw horizontal bars (stacked and unstacked)
export const drawHorizontalBars = createSeriesDraw({
  prepare: createPrepare(
    xyValuesInvertedPrepare,
    prepareStackedBars
  ),
  select,
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
    xScale: d3c.scaleBandSeries().domain(['a', 'b', 'c']).seriesCount(2)
  });

  // Handling non-ordinal scales
  bars({

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
      .domain(['a', 'b', 'c']).seriesCount(2).adjacent(false),
    yScale: d3.scale.linear().domain([0, 50]),

    horizontal: true,
    stacked: true
  })
  ```
  @class Bars
*/
export function Bars(selection, props) {
  if (props.horizontal) {
    drawHorizontalBars(selection, props);
  } else {
    drawVerticalBars(selection, props);
  }
}

export function getDefaultXScale({data, xValue, stacked}) {
  return scaleBandSeries()
    .domain(getOrdinalDomain(data, xValue || defaultXValue))
    .seriesCount(isSeriesData(data) ? data.length : 1)
    .adjacent(!stacked);
}

Bars.properties = assign({},
  seriesProperties,
  xyValuesProperties,
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
        xScale: d3c.scaleBandSeries().domain(['a', 'b', 'c']).seriesCount(2)
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
      Draw bars horizontally,
      with x aligned vertically (increasing bottom to top) and y aligned horizontally (increasing left to right)

      @property horizontal
      @type Boolean
      @default false
    */
    horizontal: {
      type: types.boolean,
      getDefault: () => false
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
      getDefault: () => false
    },

    // TODO Need to decide the standard for what these apply to
    // (i.e. is this for the entire chart, each bar, all bars, etc.)
    className: types.any,
    style: types.any,

    // (internal)
    offset: {
      type: types.number,
      getDefault: () => 0
    },
    onMouseEnterBar: {
      type: types.fn,
      getDefault: () => () => {}
    },
    onMouseLeaveBar: {
      type: types.fn,
      getDefault: () => () => {}
    }
  }
);

// Connection
// ----------

export const mapState = () => {
  // TODO Get offset axis / offset from state
};
export const mapDispatch = () => {
  // TODO "bind" onMouseEnterBar and onMouseLeaveBar
}
export const connection = connect(mapState, mapDispatch);

/**
  bars
*/
const bars = connection(chart(Bars));
export default bars;

// Draw
// ----

export function select({seriesValues, key}) {
  return this.selectAll('rect')
    .data(seriesValues, key);
}

export function enterVertical({yValue, yScale, offset, onMouseEnterBar, onMouseLeaveBar}) {
  this.append('rect')
    .attr('y', (d, i, j) => bar0(yValue, yScale, offset, d, i, j))
    .attr('height', 0)
    .on('mouseenter', onMouseEnterBar)
    .on('mouseleave', onMouseLeaveBar);
}

export function mergeVertical({xValue, yValue, xScale, yScale, offset, className, style, stacked, transition}) {
  this
    .attr('x', (d, i, j) => barX(xValue, xScale, d, i, j))
    .attr('width', barWidth(xScale))
    .attr('class', className)
    .style(style); // TODO Applies to all bars, update for (d, i)

  this.transition().call(prepareTransition(transition))
    .attr('y', (d, i, j) => barY(yValue, yScale, offset, stacked, d, i, j))
    .attr('height', (d, i, j) => barHeight(yValue, yScale, offset, stacked, d, i, j));
}

export function exitVertical({yValue, yScale, offset, transition}) {
  this.transition().call(prepareTransition(transition))
    .attr('y', (d, i, j) => bar0(yValue, yScale, offset, d, i, j))
    .attr('height', 0)
    .remove();
}

export function enterHorizontal({yValue, yScale, offset, onMouseEnterBar, onMouseLeaveBar}) {
  this.append('rect')
    .attr('x', (d, i, j) => bar0(yValue, yScale, offset, d, i, j))
    .attr('width', 0)
    .on('mouseenter', onMouseEnterBar)
    .on('mouseleave', onMouseLeaveBar);
}

export function mergeHorizontal({xValue, xScale, yValue, yScale, offset, className, style, stacked, transition}) {
  this
    .attr('y', (d, i, j) => barX(xValue, xScale, d, i, j))
    .attr('height', barWidth(xScale))
    .attr('class', className)
    .style(style); // TODO Applies to all bars, update for (d, i)

  this.transition().call(prepareTransition(transition))
    .attr('x', (d, i, j) => barY(yValue, yScale, offset, stacked, d, i ,j))
    .attr('width', (d, i, j) => barHeight(yValue, yScale, offset, stacked, d, i, j));
}

export function exitHorizontal({yValue, yScale, offset, transition}) {
  this.transition().call(prepareTransition(transition))
    .attr('x', (d, i, j) => bar0(yValue, yScale, offset, d, i, j))
    .attr('width', 0)
    .remove();
}

// Helpers
// -------

export function bar0(yValue, yScale, offset, d, i, j) {
  const y0 = yScale(0);
  const y = getValue(yValue, yScale, d, i, j);

  return y <= y0 ? y0 - offset : y0 + offset;
}

export function barX(xValue, xScale, d, i, j) {
  const x = getValue(xValue, xScale, d, i, j);

  // TODO Look for centered on scale (set in scaleBandSeries)
  if (!xScale._ordinalSeries) {
    return x;
  }

  // For ordinal-series scale, x is centered, get value at edge
  const width = getWidth(xScale);
  return x - (width / 2);
}

export function barY(yValue, yScale, offset, stacked, d, i, j) {
  var y0 = yScale(0);
  const y = getValue(yValue, yScale, d, i, j);

  if (stacked) {
    y0 = yScale(d.__previous || 0);
    offset = j === 0 ? offset : 0;
  }

  return y < y0 ? y : y0 + offset;
}

export function barWidth(xScale) {
  return getWidth(xScale);
}

export function barHeight(yValue, yScale, offset, stacked, d, i, j) {
  var y0 = yScale(0);
  const y = getValue(yValue, yScale, d, i, j);

  if (stacked) {
    y0 = yScale(d.__previous || 0);
    offset = j === 0 ? offset : 0;
  }

  const height = Math.abs(y0 - y - offset);
  return height > 0 ? height : 0;
}

export function prepareStackedBars(selection, props) {
  const {stacked, xValue, yValue} = props;
  var {data} = props;

  if (!stacked || !isSeriesData(data)) {
    return props;
  }

  // TODO Investigate using d3.stack
  // (here or on data before it's passed in, e.g. look for y0 on point)
  const grouped = {};
  data = data.map((series, j) => {
    const values = series.values.map((d, i) => {
      const x = xValue(d, i, j);
      const y = yValue(d, i, j);
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

    return assign({}, series, {values});
  });

  return assign({}, props, {
    data,
    yValue: d => d.y
  });
}
