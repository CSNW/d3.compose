const tape = require('tape');
const d3c = require('../../');
const isChart = d3c.helpers.isChart;

tape('isChart() identifies subclasses of Chart', t => {
  t.ok(isChart(d3c.Chart));
  t.ok(isChart(d3c.Component));
  t.ok(isChart(d3c.Chart.extend()));
  t.ok(isChart(d3c.Component.extend()));

  t.notOk(isChart());
  t.notOk(isChart(() => {}));
  t.notOk(isChart({}));
  t.end();
});
