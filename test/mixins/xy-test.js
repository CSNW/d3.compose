const tape = require('tape');
const sinon = require('sinon');
const mockSelection = require('../_helpers/mock-selection');
const d3 = require('d3');
const d3c = require('../../');
const xy = d3c.mixins.xy;

function generateProps(selection, props) {
  const dimensions = d3c.helpers.getDimensions(selection);
  const defaultProps = {
    xScale: d3.scale.linear(),
    xScalePadding: 0,
    xScaleOuterPadding: 0,
    yScale: d3.scale.linear()
  };

  return Object.assign({}, dimensions, defaultProps, props);
}

tape('xy.prepare() sets range for xScale', t => {
  const xScale = {
    copy() {
      return this;
    },
    range: sinon.spy()
  };

  const selection = mockSelection({client: {width: 200, height: 100}});
  const props = generateProps(selection, {xScale});
  xy.prepare(selection, props);

  t.ok(xScale.range.called);
  t.deepEqual(xScale.range.args[0][0], [0, 200]);
  t.end();
});

tape('xy.prepare() sets range for yScale', t => {
  const yScale = {
    copy() {
      return this;
    },
    range: sinon.spy()
  };

  const selection = mockSelection({client: {width: 200, height: 100}});
  const props = generateProps(selection, {yScale});
  xy.prepare(selection, props);

  t.ok(yScale.range.called);
  t.deepEqual(yScale.range.args[0][0], [100, 0]);
  t.end();
});

tape('xy.getValue() gets value for given values and scale', t => {
  const scale = d3c.scaleBandSeries()
    .series(2)
    .domain([1, 2, 3, 4])
    .range([0, 100]);
  const value = d => d.x;
  const bandWidth = 25/2;

  t.equal(xy.getValue(value, scale, {x: 3}, 2, 1), 50 + bandWidth + (bandWidth/2));
  t.end();
});

tape('xy.getMinMaxDomain() gets series max and min', t => {
  const data = [
    {values: [100, 0, -100]},
    {values: [-50, 0, 50, 100, 150, 200]}
  ];
  const getValue = (d) => d;

  t.deepEqual(xy.getMinMaxDomain(data, getValue), [-100, 200]);
  t.end();
});
