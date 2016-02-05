import {assign} from '../utils';
import {
  createPrepare,
  prepareTransition
} from '../helpers';
import {createSeriesDraw} from '../mixins/series';
import {getValue} from '../mixins/xy-values';
import {prepare as xyValuesInvertedPrepare} from '../mixins/xy-values-inverted';
import {
  barX,
  barWidth
} from './bars';
import {HorizontalBars} from './horizontal-bars';
import {prepareStackedBars} from './stacked-bars';
import chart from '../chart';

/**
  HorizontalStackedBars
*/
export const HorizontalStackedBars = createSeriesDraw({
  prepare: createPrepare(
    xyValuesInvertedPrepare,
    prepareStackedBars
  ),

  select: HorizontalBars.select,
  enter: HorizontalBars.enter,

  merge({xValue, xScale, yValue, yScale, offset, className, style, transition}) {
    this
      .attr('y', (d, i, j) => barX(xValue, xScale, d, i, j))
      .attr('height', barWidth(xScale))
      .attr('class', className)
      .style(style); // TODO Applies to all bars, update for (d, i)

    this.transition().call(prepareTransition(transition))
      .attr('x', (d, i, j) => barY(yValue, yScale, offset, d, i ,j))
      .attr('width', (d, i, j) => barHeight(yValue, yScale, offset, d, i, j));
  },

  exit: HorizontalBars.exit
});

HorizontalStackedBars.properties = assign({}, HorizontalBars.properties);

/**
  horizontalStackedBars
*/
const horizontalStackedBars = chart(HorizontalStackedBars);
export default horizontalStackedBars;

// Helpers
// -------

export function barY(yValue, yScale, offset, d, i, j) {
  const yPrevious = yScale(d.__previous || 0);
  const y = getValue(yValue, yScale, d, i, j);

  return y < yPrevious ? y : yPrevious + offset;
}

export function barHeight(yValue, yScale, offset, d, i, j) {
  const yPrevious = yScale(d.__previous || 0);
  const y = getValue(yValue, yScale, d, i, j);

  const height = Math.abs(yPrevious - y - offset);
  return height > 0 ? height : 0;
}
