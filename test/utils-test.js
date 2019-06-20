const tape = require('tape');
const sinon = require('sinon');
const utils = require('../').utils;

tape('utils.assign() assigns own properties to target object', t => {
  const target = {};
  const a = {a: 1};

  const B = function() {
    this.b = 2;
  };
  B.prototype.c = 3;
  const b = new B();

  // TODO Test internal directly (rather than Object.assign if available)
  const result = utils.assign(target, a, b);
  t.deepEqual(result, {a: 1, b: 2});
  t.equal(result, target);
  t.end();
});

tape('utils.defaults() assigns own + undefined properties to target object', t => {
  const target = {
    a: undefined,
    b: null,
    c: false
  };
  const a = {a: 1};
  const b = {b: 2, c: 3};

  const result = utils.defaults(target, a, b);
  t.deepEqual(result, {a: 1, b: null, c: false});
  t.equal(result, target);
  t.end();
});

tape('utils.extend() extends all properties to target object', t => {
  const target = {};
  const a = {a: 1};

  const B = function() {
    this.b = 2;
  };
  B.prototype.c = 3;
  const b = new B();

  const result = utils.extend(target, a, b);
  t.deepEqual(result, {a: 1, b: 2, c: 3});
  t.equal(result, target);
  t.end();
});

tape('utils.objectEach() loops through value, key for object', t => {
  const args = [];
  const obj = {
    a: 1,
    b: 3.14,
    c: true
  };

  utils.objectEach(obj, (value, key, ref) => args.push([value, key, ref]));

  t.deepEqual(args[0], [1, 'a', obj]);
  t.deepEqual(args[1], [3.14, 'b', obj]);
  t.deepEqual(args[2], [true, 'c', obj]);
  t.end();
});

tape('utils.difference() finds unique values in given array', t => {
  t.deepEqual(utils.difference([1, 2, 3], [2, 3, 4]), [1]);
  t.deepEqual(utils.difference([1, 2, 3], [1, 2, 3]), []);
  t.end();
});

tape('utils.includes() checks if array includes values', t => {
  t.equal(utils.includes([1, 2, 3], 1), true);
  t.equal(utils.includes([1, 2, 3], 4), false);
  t.end();
});

tape('utils.toArray() converts value to array', t => {
  t.throws(function() { arguments.push('Howdy'); });
  t.doesNotThrow(function() { utils.toArray(arguments).push('Howdy'); });

  const original = [1, 2, 3];
  const result = utils.toArray(original);
  t.deepEqual(result, [1, 2, 3]);
  t.notEqual(result, original);
  t.end();
});

tape('utils.curry() prepends arguments to function while maintaining context', t => {
  const original = sinon.spy();
  const curried = utils.curry(original, 3, 2);
  const context = {};

  curried.call(context, 1);

  t.deepEqual(original.args[0], [3, 2, 1]);
  t.equal(original.thisValues[0], context);
  t.end();
});

tape('utils.isBoolean()', t => {
  t.equal(utils.isBoolean(true), true);
  t.equal(utils.isBoolean(false), true);

  t.equal(utils.isBoolean(0), false);
  t.equal(utils.isBoolean(1), false);
  t.equal(utils.isBoolean([]), false);
  t.equal(utils.isBoolean({}), false);
  t.equal(utils.isBoolean(() => {}), false);
  t.end();
});

tape('utils.isObject()', t => {
  t.equal(utils.isObject({}), true);
  t.equal(utils.isObject(() => {}), true);
  t.equal(utils.isObject([]), true);

  t.equal(utils.isObject(true), false);
  t.equal(utils.isObject(1), false);
  t.equal(utils.isObject('Howdy'), false);
  t.end();
});

tape('utils.isNumber()', t => {
  t.equal(utils.isNumber(1), true);
  t.equal(utils.isNumber(3.14), true);
  t.equal(utils.isNumber(NaN), true);

  t.equal(utils.isNumber(true), false);
  t.equal(utils.isNumber('Howdy'), false);
  t.end();
});

tape('utils.isString()', t => {
  t.equal(utils.isString('Howdy'), true);
  t.equal(utils.isString(''), true);

  t.equal(utils.isString(true), false);
  t.equal(utils.isString(0), false);
  t.equal(utils.isString({}), false);
  t.end();
});

tape('utils.isUndefined()', t => {
  t.equal(utils.isUndefined(undefined), true);
  t.equal(utils.isUndefined(void 0), true);
  t.equal(utils.isUndefined(), true);

  t.equal(utils.isUndefined(null), false);
  t.equal(utils.isUndefined({}), false);
  t.equal(utils.isUndefined([]), false);
  t.end();
});

tape('utils.isFunction()', t => {
  t.equal(utils.isFunction(() => {}), true);
  t.equal(utils.isFunction(function() {}), true);

  t.equal(utils.isFunction({}), false);
  t.equal(utils.isFunction([]), false);
  t.end();
});
