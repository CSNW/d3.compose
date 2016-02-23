import {isUndefined} from '../utils';
import {types} from '../helpers';

export var defaultSeriesKey = function(d, i) { return !isUndefined(d && d.key) ? d.key : i; };
export var defaultSeriesClass = function(d, i) { return 'd3c-series d3c-index-' + i + (d['class'] ? ' ' + d['class'] : ''); };
export var defaultSeriesStyle = function(d) { return d.style || null; };
export var defaultSeriesValues = function(d) { return d.values || []; };

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
};

export function prepare(selection, props) {
  return props;
}

var series = {
  properties: properties,
  prepare: prepare
};
export default series;
