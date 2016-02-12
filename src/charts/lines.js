import d3 from 'd3';
import {assign} from '../utils';
import {
  types,
  createPrepare,
  connect
} from '../helpers';
import {
  createSeriesDraw,
  properties as seriesProperties
} from '../mixins/series';
import {
  getValue,
  prepare as xyPrepare,
  properties as xyProperties
} from '../mixins/xy';
import chart from '../chart';

/**
  Lines
*/
export const Lines = createSeriesDraw({
  prepare: createPrepare(xyPrepare),

  select({seriesValues, key}) {
    return this.selectAll('path')
      .data((d, i, j) => {
        return [seriesValues.call(this, d, i, j)];
      }, key);
  },

  enter() {
    this.append('path');
  },

  merge({xValue, xScale, yValue, yScale, interpolate}) {
    const line = d3.svg.line()
      .x((d, i, j) => getValue(xValue, xScale, d, i, j))
      .y((d, i, j) => getValue(yValue, yScale, d, i, j));

    if (interpolate) {
      line.interpolate(interpolate);
    }

    this.attr('d', (d) => line(d));
  }
});

Lines.properties = assign({},
  seriesProperties,
  xyProperties,
  {
    interpolate: {
      type: types.any,
      getDefault: () => 'monotone'
    }
  }
);

// Connection
// ----------

export const connection = connect();

/**
  lines
*/
const lines = chart(connection(Lines));
export default lines;
