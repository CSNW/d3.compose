import {assign} from '../utils';
import {
  connect,
  createPrepare,
  prepareTransition,
  types
} from '../helpers';
import {
  series,
  xyValuesInverted
} from '../mixins';
import chart from '../chart';
import {
  Bars,
  bar0,
  barX,
  barY,
  barWidth,
  barHeight
} from './bars';

/**
  HorizontalBars
*/
export const HorizontalBars = series.createSeriesDraw({
  prepare: createPrepare(xyValuesInverted.prepare),

  select({seriesValues, key}) {
    return this.selectAll('rect')
      .data(seriesValues, key);
  },

  enter({yValue, yScale, offset, onMouseEnterBar, onMouseLeaveBar}) {
    this.append('rect')
      .attr('x', (d, i, j) => bar0(yValue, yScale, offset, d, i, j))
      .attr('width', 0)
      .on('mouseenter', onMouseEnterBar)
      .on('mouseleave', onMouseLeaveBar);
  },

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

  exit({yValue, yScale, offset, transition}) {
    this.transition().call(prepareTransition(transition))
      .attr('x', (d, i, j) => bar0(yValue, yScale, offset, d, i, j))
      .attr('height', 0)
      .remove();
  }
});

HorizontalBars.properties = assign({},
  Bars.properties
);

// Connection
// ----------

export const mapState = (state) => {
  // TODO Get offset axis from state
};
export const mapDispatch = (dispatch) => {
  // TODO "bind" onMouseEnterBar and onMouseLeaveBar
};
export const connection = connect(mapState, mapDispatch);

/**
  horizontalBars
*/
const horizontalBars = chart(connection(HorizontalBars));
export default horizontalBars;
