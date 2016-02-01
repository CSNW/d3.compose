import d3 from 'd3';
import {
  assign
} from '../utils';
import {
  types,
  createPrepare,
  connect
} from '../helpers';
import {
  series,
  xy
} from '../mixins';
import chart from '../chart';

/**
  Lines
*/
export const Lines = series.createSeriesDraw({
  prepare: createPrepare(xy.prepare),

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
      .x((d, i, j) => xy.getValue(xValue, xScale, d, i, j))
      .y((d, i, j) => xy.getValue(yValue, yScale, d, i, j));

    if (interpolate) {
      line.interpolate(interpolate);
    }

    this.attr('d', (d) => line(d));
  }
});

Lines.properties = assign({},
  series.properties,
  xy.properties,
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
