import d3 from 'd3';
import {assign, isUndefined} from '../utils';
import {types, createDraw} from '../helpers';

// TODO Move to series "mixin"
const defaultSeriesKey = (d, i) => !isUndefined(d && d.key) ? d.key : i;
const defaultSeriesClass = (d, i) => `d3c-series d3c-index-${i}` + (d['class'] ? ' ' + d['class'] : '');
const defaultSeriesStyle = (d, i) => d.style || null;
const defaultSeriesValues = (d, i) => d.values || [];

export const properties = {
  seriesKey: {
    type: types.fn,
    getDefault: () => defaultSeriesKey
  },
  seriesClass: {
    type: types.any,
    getDefault: () => defaultSeriesClass
  },
  seriesStyle: {
    type: types.any,
    getDefault: () => defaultSeriesStyle
  },
  seriesValues: {
    type: types.fn,
    getDefault: () => defaultSeriesValues
  }
}

export function createSeriesDraw(steps) {
  const {prepare} = steps;
  const drawValues = createDraw(assign({}, steps, {prepare: undefined}));
  const draw = (selection, props) => {
    if (prepare)
      props = prepare(selection, props);

    const {
      seriesKey,
      seriesClass,
      seriesStyle
    } = props;
    var {data} = props;

    if (!isSeriesData(data))
      data = [{values: data}];

    // Create series layers
    const series = selection.selectAll('[data-series]')
      .data(data, seriesKey);

    series.enter().append('g');

    series
      .attr('class', seriesClass)
      .attr('data-series', (d, i) => i)
      .style(seriesStyle);

    // TODO Exit items then exit series layer
    series.exit().remove();

    drawValues(series, props);
  };

  assign(draw, steps);

  return draw;
}

export function isSeriesData(data) {
  return Array.isArray(data) && data[0] && Array.isArray(data[0].values);
}

export function getSeriesMax(data, getValue) {
  const getMax = (values) => values && d3.extent(values, getValue)[1];

  if (isSeriesData(data)) {
    return data.reduce((memo, series) => {
      if (series && Array.isArray(series.values)) {
        const seriesMax = getMax(series.values);
        return seriesMax > memo ? seriesMax : memo;
      } else {
        return memo;
      }
    }, -Infinity);
  } else {
    return getMax(data);
  }
}

export function getSeriesMin(data, getValue) {
  const getMin = (values) => values && d3.extent(values, getValue)[0];

  if (isSeriesData(data)) {
    return data.reduce((memo, series) => {
      if (series && Array.isArray(series.values)) {
        const seriesMin = getMin(series.values);
        return seriesMin < memo ? seriesMin : memo;
      } else {
        return memo;
      }
    }, Infinity);
  } else {
    return getMin(data);
  }
}

const series = {
  defaultSeriesKey,
  defaultSeriesClass,
  defaultSeriesStyle,
  defaultSeriesValues,
  properties,
  createSeriesDraw,
  isSeriesData,
  getSeriesMax,
  getSeriesMin
}
export default series;
