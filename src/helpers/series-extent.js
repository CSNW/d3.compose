import d3 from 'd3';
import isSeriesData from './is-series-data';

export default function seriesExtent(data, fn) {
  var getExtent = function(values) { return values && d3.extent(values, fn); };

  if (!isSeriesData(data)) {
    return getExtent(data);
  }

  return data.reduce(function(memo, series) {
    if (!series || !Array.isArray(series.values)) {
      return memo;
    }

    var extent = getExtent(series.values);
    return [
      extent[0] < memo[0] ? extent[0] : memo[0],
      extent[1] > memo[1] ? extent[1] : memo[1]
    ];
  }, [Infinity, -Infinity]);
}
