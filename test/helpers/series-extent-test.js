const tape = require('tape');
const seriesExtent = require('../../').helpers.seriesExtent;

const getValue = d => d;
const seriesData = [
  {key: 'a', values: [1, 5, 2, 3, 4]},
  {key: 'b', values: [10, 50, 20, 30, 40]}
];
const nonSeriesData = [1, 5, 2, 3, 4];

tape('seriesExtent() calculates max and min for series data', t => {
  const extent = seriesExtent(seriesData, getValue);
  t.equal(extent[0], 1);
  t.equal(extent[1], 50);
  t.end();
});

tape('seriesExtent()  calculates max and min for non-series data', t => {
  const extent = seriesExtent(nonSeriesData, getValue);
  t.equal(extent[0], 1);
  t.equal(extent[1], 5);
  t.end();
});
