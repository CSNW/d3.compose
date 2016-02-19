const tape = require('tape');
const sinon = require('sinon');
const mockSelection = require('../_helpers/mock-selection');
const createDraw = require('../../').helpers.createDraw;

tape('createDraw() selects in draw function', t => {
  const selection = mockSelection();
  const subselection = mockSelection();
  const props = {};

  const select = sinon.stub().returns(subselection);
  const enter = sinon.spy();

  const draw = createDraw({
    select,
    enter
  });

  draw(selection, props);

  t.equal(select.thisValues[0], selection);
  t.ok(select.calledWith(props));

  t.equal(enter.thisValues[0], subselection);
  t.ok(enter.calledWith(props));
  t.end();
});

tape('createDraw() enters in draw function', t => {
  const selection = mockSelection();
  const subselection = mockSelection();
  const props = {};

  const enter = sinon.spy();
  const draw = createDraw({
    select: () => subselection,
    enter
  });

  draw(selection, props);

  t.equal(enter.thisValues[0], subselection);
  t.ok(enter.calledWith(props));
  t.end();
});

tape('createDraw() updates in draw function', t => {
  const selection = mockSelection();
  const subselection = mockSelection();
  const props = {};

  const update = sinon.spy();
  const draw = createDraw({
    select: () => subselection,
    update
  });

  draw(selection, props);

  t.equal(update.thisValues[0], subselection);
  t.ok(update.calledWith(props));
  t.end();
});

tape('createDraw() merges in draw function', t => {
  const selection = mockSelection();
  const subselection = mockSelection();
  const props = {};

  const merge = sinon.spy();
  const draw = createDraw({
    select: () => subselection,
    merge
  });

  draw(selection, props);

  t.equal(merge.thisValues[0], subselection);
  t.ok(merge.calledWith(props));
  t.end();
});

tape('createDraw() exits in draw function', t => {
  const selection = mockSelection();
  const subselection = mockSelection();
  const props = {};

  const exit = sinon.spy();
  const draw = createDraw({
    select: () => subselection,
    exit
  });

  draw(selection, props);

  t.equal(exit.thisValues[0], subselection);
  t.ok(exit.calledWith(props));
  t.end();
});

tape('createDraw() combines all steps into draw function', t => {
  const selection = mockSelection();
  const subselection = mockSelection();
  const props = {};

  const select = sinon.mock().returns(subselection);
  const enter = sinon.spy();
  const update = sinon.spy();
  const merge = sinon.spy();
  const exit = sinon.spy();

  const draw = createDraw({
    select,
    enter,
    update,
    merge,
    exit
  });

  draw(selection, props);

  t.equal(select.thisValues[0], selection);
  t.ok(select.calledWith(props));

  t.equal(enter.thisValues[0], subselection);
  t.ok(enter.calledWith(props));

  t.equal(update.thisValues[0], subselection);
  t.ok(update.calledWith(props));

  t.equal(merge.thisValues[0], subselection);
  t.ok(merge.calledWith(props));

  t.equal(exit.thisValues[0], subselection);
  t.ok(exit.calledWith(props));
  t.end();
});
