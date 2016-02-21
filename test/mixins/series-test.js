const tape = require('tape');
const series = require('../../').mixins.series;

const getValue = (d) => d;
const seriesData = [
  {key: 'a', values: [1, 5, 2, 3, 4]},
  {key: 'b', values: [10, 50, 20, 30, 40]}
];
const nonSeriesData = [1, 5, 2, 3, 4]

tape('series.isSeriesData() determines series data', t => {
  t.ok(series.isSeriesData(seriesData));
  t.notOk(series.isSeriesData(nonSeriesData));
  t.end();
});

tape('series.getSeriesMax() calculates max for series data', t => {
  t.equal(series.getSeriesMax(seriesData, getValue), 50);
  t.end();
});

tape('series.getSeriesMax()  calculates max for non-series data', t => {
  t.equal(series.getSeriesMax(nonSeriesData, getValue), 5);
  t.end();
});

tape('series.getSeriesMin() calculates min for series data', t => {
  t.equal(series.getSeriesMin(seriesData, getValue), 1);
  t.end();
});

tape('series.getSeriesMin() calculates min for non-series data', t => {
  t.equal(series.getSeriesMin(nonSeriesData, getValue), 1);
  t.end();
});
