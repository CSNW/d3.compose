import isSeriesData from './is-series-data';

export default function getUniqueValues(data, fn, compare) {
  if (!isSeriesData(data)) {
    return data.map(fn);
  }

  var values = data.reduce(function(memo, series) {
    var unique = series.values
      .map(fn)
      .filter(function(value) { return memo.indexOf(value) < 0; });

    return memo.concat(unique);
  }, []);

  var sorted = values.sort(compare);
  return sorted;
}
