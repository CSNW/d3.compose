const tape = require('tape');
const d3c = require('../../');

tape('getValue() gets value for given values and scale', t => {
  const scale = d3c.scaleBandSeries()
    .series(2)
    .domain([1, 2, 3, 4])
    .range([0, 100]);
  const value = d => d.x;
  const bandWidth = 25/2;

  t.equal(d3c.helpers.getValue(value, scale, {x: 3}, 2, 1), 50 + bandWidth + (bandWidth/2));
  t.end();
});
