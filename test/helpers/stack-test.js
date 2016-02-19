const tape = require('tape');
const mockElement = require('../_helpers/mock-element');
const d3c = require('../../');
const getTranslate = d3c.helpers.getTranslate;
const stack = d3c.helpers.stack;

function getElements() {
  const children = [
    mockElement({
      bbox: {width: 100, height: 20}
    }),
    mockElement({
      bbox: {width: 50, height: 50}
    })
  ];
  const attr = {};

  return {
    attr(key, value) {
      if (d3c.utils.isFunction(value)) {
        attr[key] = children.map((child, i) => {
          return value.call(child, {}, i, 0);
        });
        return;
      }

      return attr[key];
    }
  };
}

function getTransform(options, elements) {
  stack(options)(elements);
  return elements.attr('transform');
}

tape('stack() stacks vertically (with origin = top)', t => {
  const transform = getTransform({}, getElements());

  t.equal(transform[0], getTranslate(0, 0));
  t.equal(transform[1], getTranslate(0, 20));
  t.end();
});

tape('stack() stacks vertically (with origin = bottom)', t => {
  const transform = getTransform({origin: 'bottom'}, getElements());

  t.equal(transform[0], getTranslate(0, 20));
  t.equal(transform[1], getTranslate(0, 70));
  t.end();
});

tape('stack() stacks horizontally (with origin = left)', t => {
  const transform = getTransform({direction: 'horizontal'}, getElements());

  t.equal(transform[0], getTranslate(0, 0));
  t.equal(transform[1], getTranslate(100, 0));
  t.end();
});

tape('stack() stacks horizontally (with origin = right)', t => {
  const transform = getTransform({direction: 'horizontal', origin: 'right'}, getElements());

  t.equal(transform[0], getTranslate(100, 0));
  t.equal(transform[1], getTranslate(150, 0));
  t.end();
});

tape('stack() uses padding', t => {
  const transform = getTransform({padding: 10}, getElements());

  t.equal(transform[0], getTranslate(0, 0));
  t.equal(transform[1], getTranslate(0, 30));
  t.end();
});

tape('stack() uses minHeight', t => {
  const transform = getTransform({minHeight: 40}, getElements());

  t.equal(transform[0], getTranslate(0, 0));
  t.equal(transform[1], getTranslate(0, 40));
  t.end();
});

tape('stack() uses minWidth', t => {
  const transform = getTransform({direction: 'horizontal', minWidth: 150}, getElements());

  t.equal(transform[0], getTranslate(0, 0));
  t.equal(transform[1], getTranslate(150, 0));
  t.end();
});
