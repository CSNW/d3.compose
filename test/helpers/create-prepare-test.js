const tape = require('tape');
const sinon = require('sinon');
const createPrepare = require('../../').helpers.createPrepare;

tape('createPrepare() calls each step', t => {
  const selection = {};
  const props = {};

  const a = {};
  const b = {};
  const c = {};
  const aFn = sinon.mock().returns(a);
  const bFn = sinon.mock().returns(b);
  const cFn = sinon.mock().returns(c);

  const prepared = createPrepare(aFn, bFn, cFn);
  const result = prepared(selection, props);

  t.ok(aFn.calledWith(selection, props));
  t.ok(bFn.calledWith(selection, a));
  t.ok(bFn.calledWith(selection, b));
  t.equal(result, c);
  t.end();
});
