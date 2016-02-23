const tape = require('tape');
const isSeriesData = require('../../').helpers.isSeriesData;

const seriesData = [
  {key: 'a', values: [1, 5, 2, 3, 4]},
  {key: 'b', values: [10, 50, 20, 30, 40]}
];
const nonSeriesData = [1, 5, 2, 3, 4];

tape('isSeriesData() distinguishes between series and non-series data', t => {
  t.ok(isSeriesData(seriesData));
  t.notOk(isSeriesData(nonSeriesData));
  t.end();
});
