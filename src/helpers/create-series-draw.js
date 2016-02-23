import {assign} from '../utils';
import createDraw from './create-draw';
import isSeriesData from './is-series-data';

export default function createSeriesDraw(steps) {
  var prepare = steps.prepare;
  var drawValues = createDraw(assign({}, steps, {prepare: undefined}));
  var draw = function(selection, props) {
    if (prepare) {
      props = prepare(selection, props);
    }

    var data = props.data;
    if (!isSeriesData(data)) {
      data = [{values: data}];
    }

    // Create series layers
    var series = selection.selectAll('[data-series]')
      .data(data, props.seriesKey);

    series.enter().append('g');

    series
      .attr('class', props.seriesClass)
      .attr('data-series', function(d, i) { return i; })
      .style(props.seriesStyle);

    // TODO Exit items then exit series layer
    series.exit().remove();

    drawValues(series, props);
  };

  assign(draw, steps);

  return draw;
}
