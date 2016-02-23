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
