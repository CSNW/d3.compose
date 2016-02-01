import {
  assign
} from '../utils';
import {
  createPrepare,
  connect,
  prepareTransition,
  types
} from '../helpers';
import {
  series,
  xyValues
} from '../mixins';
import chart from '../chart';

const {
  getValue,
  getWidth
} = xyValues;

/**
  Bars
*/
export const Bars = series.createSeriesDraw({
  prepare: createPrepare(xyValues.prepare),

  select({seriesValues, key}) {
    return this.selectAll('rect')
      .data(seriesValues, key);
  },

  enter({yValue, yScale, offset, onMouseEnterBar, onMouseLeaveBar}) {
    this.append('rect')
      .attr('y', (d, i, j) => bar0(yValue, yScale, offset, d, i, j))
      .attr('height', 0)
      .on('mouseenter', onMouseEnterBar)
      .on('mouseleave', onMouseLeaveBar);
  },

  merge({xValue, yValue, xScale, yScale, offset, className, style, transition}) {
    this
      .attr('x', (d, i, j) => barX(xValue, xScale, d, i, j))
      .attr('width', barWidth(xScale))
      .attr('class', className)
      .style(style); // TODO Applies to all bars, update for (d, i)

    this.transition().call(prepareTransition(transition))
      .attr('y', (d, i, j) => barY(yValue, yScale, offset, d, i, j))
      .attr('height', (d, i, j) => barHeight(yValue, yScale, offset, d, i, j));
  },

  exit({yValue, yScale, offset, transition}) {
    this.transition().call(prepareTransition(transition))
      .attr('y', (d, i, j) => bar0(yValue, yScale, offset, d, i, j))
      .attr('height', 0)
      .remove();
  }
});

Bars.properties = assign({},
  series.properties,
  xyValues.properties,
  {
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

export const mapState = (state) => {
  // TODO Get offset axis / offset from state
};
export const mapDispatch = (dispatch) => {
  // TODO "bind" onMouseEnterBar and onMouseLeaveBar
}
export const connection = connect(mapState, mapDispatch);

/**
  bars
*/
const bars = chart(connection(Bars));
export default bars;

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

export function barY(yValue, yScale, offset, d, i, j) {
  const y0 = yScale(0);
  const y = getValue(yValue, yScale, d, i, j);

  return y < y0 ? y : y0 + offset;
}

export function barWidth(xScale) {
  return getWidth(xScale);
}

export function barHeight(yValue, yScale, offset, d, i, j) {
  const y0 = yScale(0);
  const y = getValue(yValue, yScale, d, i, j);

  const height = Math.abs(y0 - y - offset);
  return height > 0 ? height : 0;
}
