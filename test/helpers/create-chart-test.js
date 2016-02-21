const tape = require('tape');
const sinon = require('sinon');
const mockSelection = require('../_helpers/mock-selection');
const d3c = require('../../');
const createChart = d3c.helpers.createChart;

tape('createChart() passes through chart class', t => {
  const Custom = d3c.Chart.extend({});

  t.equal(createChart(Custom), Custom);
  t.end();
});

tape('createChart() wraps chart function in Chart', t => {
  const Draw = sinon.spy();
  Draw.properties = {};

  const Wrapped = createChart(Draw, d3c.Chart);

  const selection = mockSelection();
  const props = {};
  const instance = new Wrapped(selection, props);

  t.equal(Wrapped.properties, Draw.properties);

  instance.render();
  t.ok(Draw.called);
  t.equal(Draw.args[0][0], selection);
  t.deepEqual(Draw.args[0][1], props);
  t.end();
});
