import d3 from 'd3';
import {
  assign,
  isUndefined
} from '../utils';
import {
  types,
  createDraw
} from '../helpers';

var defaultSeriesKey = function(d, i) { return !isUndefined(d && d.key) ? d.key : i; };
var defaultSeriesClass = function(d, i) { return 'd3c-series d3c-index-' + i + (d['class'] ? ' ' + d['class'] : ''); };
var defaultSeriesStyle = function(d) { return d.style || null; };
var defaultSeriesValues = function(d) { return d.values || []; };

export var properties = {
  seriesKey: {
    type: types.fn,
    getDefault: function() { return defaultSeriesKey; }
  },
  seriesClass: {
    type: types.any,
    getDefault: function() { return defaultSeriesClass; }
  },
  seriesStyle: {
    type: types.any,
    getDefault: function() { return defaultSeriesStyle; }
  },
  seriesValues: {
    type: types.fn,
    getDefault: function() { return defaultSeriesValues; }
  }
}

export function createSeriesDraw(steps) {
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

export function isSeriesData(data) {
  return Array.isArray(data) && data[0] && Array.isArray(data[0].values);
}

export function getSeriesMax(data, getValue) {
  var getMax = function(values) { return values && d3.extent(values, getValue)[1]; };

  if (isSeriesData(data)) {
    return data.reduce(function(memo, series) {
      if (series && Array.isArray(series.values)) {
        var seriesMax = getMax(series.values);
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
  var getMin = function(values) { return values && d3.extent(values, getValue)[0]; };

  if (isSeriesData(data)) {
    return data.reduce(function(memo, series) {
      if (series && Array.isArray(series.values)) {
        var seriesMin = getMin(series.values);
        return seriesMin < memo ? seriesMin : memo;
      } else {
        return memo;
      }
    }, Infinity);
  } else {
    return getMin(data);
  }
}

var series = {
  defaultSeriesKey: defaultSeriesKey,
  defaultSeriesClass: defaultSeriesClass,
  defaultSeriesStyle: defaultSeriesStyle,
  defaultSeriesValues: defaultSeriesValues,
  properties: properties,
  createSeriesDraw: createSeriesDraw,
  isSeriesData: isSeriesData,
  getSeriesMax: getSeriesMax,
  getSeriesMin: getSeriesMin
}
export default series;
