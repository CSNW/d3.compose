import {assign} from '../utils';
import {
  createPrepare,
  prepareTransition
} from '../helpers';
import {
  createSeriesDraw,
  isSeriesData
} from '../mixins/series';
import {getValue} from '../mixins/xy-values';
import {
  Bars,
  barX,
  barY,
  barWidth
} from './bars';
import chart from '../chart';

/**
  StackedBars
*/
export const StackedBars = createSeriesDraw({
  prepare: createPrepare(
    Bars.prepare,
    prepareStackedBars
  ),
  select: Bars.select,
  enter: Bars.enter,

  merge({xValue, yValue, xScale, yScale, offset, className, style, transition}) {
    this
      .attr('x', (d, i, j) => barX(xValue, xScale, d, i, j))
      .attr('width', barWidth(xScale))
      .attr('class', className)
      .style(style);

    this.transition().call(prepareTransition(transition))
      .attr('y', (d, i, j) => barY(yValue, yScale, offset, d, i, j))
      .attr('height', (d, i, j) => barHeight(yValue, yScale, offset, d, i, j));
  },

  exit: Bars.exit
});

StackedBars.properties = assign({}, Bars.properties);

/**
  stackedBars
*/
const stackedBars = chart(StackedBars);
export default stackedBars;

// Helpers
// -------

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

export function barHeight(yValue, yScale, offset, d, i, j) {
  const yPrevious = yScale(d.__previous || 0);
  const y = getValue(yValue, yScale, d, i, j);
  offset = j === 0 ? offset : 0;

  const height = Math.abs(yPrevious - y - offset);
  return height > 0 ? height : 0;
}