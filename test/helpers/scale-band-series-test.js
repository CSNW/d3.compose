const tape = require('tape');
const scaleBandSeries = require('../../').scaleBandSeries;

tape('scaleBandSeries() uses seriesCount', t => {
  var scale = scaleBandSeries()
    .domain([0, 1, 2, 3])
    .rangeRoundBands([0, 100]);

  t.equal(scale(2, 1), 50 + (25 / 2));
  t.equal(scale.rangeBand(), 25);

  scale.seriesCount(2);

  t.equal(scale(2, 1), 50 + 12.5 + (12.5 / 2));
  t.equal(scale.rangeBand(), 12.5);
  t.end();
});

tape('scaleBandSeries() uses adjacent', t => {
  var scale = scaleBandSeries()
    .domain([0, 1, 2, 3])
    .rangeRoundBands([0, 100])
    .seriesCount(2);

  t.equal(scale(2, 1), 50 + 12.5 + (12.5 / 2));
  t.equal(scale.rangeBand(), 12.5);

  scale.adjacent(false);

  t.equal(scale(2, 1), 50 + (25 / 2));
  t.equal(scale.rangeBand(), 25);
  t.end();
});

tape('scaleBandSeries() uses seriesPadding', t => {
  var scale = scaleBandSeries()
    .domain([0, 1, 2, 3])
    .rangeRoundBands([0, 100])
    .seriesCount(2);

  t.equal(scale(2, 1), 50 + 12.5 + (12.5 / 2));
  t.equal(scale.rangeBand(), 12.5);

  scale.seriesPadding(0.1);

  t.equal(scale(2, 1), 50 + 12.5 + (12.5 / 2));
  t.equal(scale.rangeBand(), 12.5 - 1.25);
  t.end();
});
