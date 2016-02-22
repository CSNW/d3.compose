const tape = require('tape');
const scaleBandSeries = require('../../').scaleBandSeries;

tape('scaleBandSeries() uses series', t => {
  var scale = scaleBandSeries()
    .domain([0, 1, 2, 3])
    .range([0, 100]);

  t.equal(scale(2, 1), 50 + (25 / 2));
  t.equal(scale.bandwidth(), 25);

  scale.series(2);

  t.equal(scale(2, 1), 50 + 12.5 + (12.5 / 2));
  t.equal(scale.bandwidth(), 12.5);
  t.end();
});

tape('scaleBandSeries() uses adjacent', t => {
  var scale = scaleBandSeries()
    .domain([0, 1, 2, 3])
    .range([0, 100])
    .series(2);

  t.equal(scale(2, 1), 50 + 12.5 + (12.5 / 2));
  t.equal(scale.bandwidth(), 12.5);

  scale.adjacent(false);

  t.equal(scale(2, 1), 50 + (25 / 2));
  t.equal(scale.bandwidth(), 25);
  t.end();
});

tape('scaleBandSeries() uses paddingSeries', t => {
  var scale = scaleBandSeries()
    .domain([0, 1, 2, 3])
    .range([0, 100])
    .series(2);

  t.equal(scale(2, 1), 50 + 12.5 + (12.5 / 2));
  t.equal(scale.bandwidth(), 12.5);

  scale.paddingSeries(0.1);

  var step = 25 / (2 - 0.1);
  var bandwidth = step - (0.1 * step);
  t.equal(scale(2, 1), 50 + step + (bandwidth / 2));
  t.equal(scale.bandwidth(), bandwidth);
  t.end();
});

tape('scaleBandSeries() treats missing series parameter as full width', t => {
  var scale = scaleBandSeries()
    .domain([0, 1, 2, 3])
    .range([0, 100])
    .series(2);

  t.equal(scale(2, 1), 50 + 12.5 + (12.5 / 2));
  t.equal(scale(2), 50 + (25 / 2));

  scale.adjacent(false);

  t.equal(scale(2, 1), 50 + (25 / 2));
  t.equal(scale(2), 50 + (25 / 2));

  scale.adjacent(true).centered(false);

  t.equal(scale(2, 1), 50 + 12.5);
  t.equal(scale(2), 50);

  t.end();
});
