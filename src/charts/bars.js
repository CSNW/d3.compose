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
import {defaultXValue} from '../mixins/xy';
import {
  getValue,
  getWidth,
  getOrdinalDomain,
  properties as xyValuesProperties,
  prepare as xyValuesPrepare
} from '../mixins/xy-values';
import {prepare as xyValuesInvertedPrepare} from '../mixins/xy-values-inverted';
import chart from '../chart';

export const drawBars = createSeriesDraw({
  prepare: createPrepare(xyValuesPrepare),
  select,
  enter: enterVertical,
  merge: mergeVertical,
  exit: exitVertical
});

export const drawHorizontalBars = createSeriesDraw({
  prepare: createPrepare(xyValuesInvertedPrepare),
  select,
  enter: enterHorizontal,
  merge: mergeHorizontal,
  exit: exitHorizontal
});

export const drawStackedBars = createSeriesDraw({
  prepare: createPrepare(
    xyValuesPrepare,
    prepareStackedBars
  ),
  select,
  enter: enterVertical,
  merge: mergeVertical,
  exit: exitVertical
});

export const drawHorizontalStackedBars = createSeriesDraw({
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
  Bars
*/
export function Bars(selection, props) {
  if (props.horizontal && props.stacked) {
    drawHorizontalStackedBars(selection, props);
  } else if (props.stacked) {
    drawStackedBars(selection, props);
  } else if (props.horizontal) {
    drawHorizontalBars(selection, props);
  } else {
    drawBars(selection, props);
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
    xScale: {
      type: types.fn,
      getDefault: getDefaultXScale
    },
    horizontal: {
      type: types.boolean,
      getDefault: () => false
    },
    stacked: {
      type: types.boolean,
      getDefault: () => false
    },
    className: {
      type: types.any
    },
    style: {
      type: types.any
    },
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
const bars = chart(connection(Bars));
export default bars;

// Draw
// ----

export function select({seriesValues, key}) {
  return this.selectAll('rect')
    .data(seriesValues, key);
}

export function enterVertical({yValue, yScale, offset, onMouseEnterBar, onMouseLeaveBar, width, height}) {
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
    .attr('height', 0)
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
  const {xValue, yValue} = props;
  var {data} = props;

  if (isSeriesData(data)) {
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

        return assign({}, d, {
          y: stackedY,
          __previous: previous,
          __original_y: y
        });
      });

      return assign({}, series, {values});
    });
  }

  return assign({}, props, {data});
}
