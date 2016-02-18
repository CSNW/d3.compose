const expect = require('expect');
const utils = require('../').utils;

const createSpy = expect.createSpy;
const assign = utils.assign;
const defaults = utils.defaults;
const extend = utils.extend;
const objectEach = utils.objectEach;
const difference = utils.difference;
const includes = utils.includes;
const toArray = utils.toArray;
const curry = utils.curry;
const isBoolean = utils.isBoolean;
const isObject = utils.isObject;
const isNumber = utils.isNumber;
const isString = utils.isString;
const isUndefined = utils.isUndefined;
const isFunction = utils.isFunction;

describe('utils', function() {
  it('assign: should assign own properties to target object', () => {
    const target = {};
    const a = {a: 1};

    const B = function() {
      this.b = 2;
    };
    B.prototype.c = 3;
    const b = new B();

    // TODO Test internal directly (rather than Object.assign if available)
    expect(assign(target, a, b)).toEqual({a: 1, b: 2});
  });

  it('defaults: should assign own + undefined properties to target object', () => {
    const target = {
      a: undefined,
      b: null,
      c: false
    };
    const a = {a: 1};
    const b = {b: 2, c: 3};

    expect(defaults(target, a, b)).toEqual({a: 1, b: null, c: false});
  });

  it('extend: should extend all properties to target object', () => {
    const target = {};
    const a = {a: 1};

    const B = function() {
      this.b = 2;
    };
    B.prototype.c = 3;
    const b = new B();

    expect(extend(target, a, b)).toEqual({a: 1, b: 2, c: 3});
  });

  it('objectEach: should loop through value, key for object', () => {
    const args = [];
    const obj = {
      a: 1,
      b: 3.14,
      c: true
    };

    objectEach(obj, (value, key, ref) => args.push([value, key, ref]));

    expect(args[0]).toEqual([1, 'a', obj]);
    expect(args[1]).toEqual([3.14, 'b', obj]);
    expect(args[2]).toEqual([true, 'c', obj]);
  });

  it('difference: should find unique values in given array', () => {
    expect(difference([1, 2, 3], [2, 3, 4])).toEqual([1]);
    expect(difference([1, 2, 3], [1, 2, 3])).toEqual([]);
  });

  it('includes: should check if array includes values', () => {
    expect(includes([1, 2, 3], 1)).toEqual(true);
    expect(includes([1, 2, 3], 4)).toEqual(false);
  });

  it('toArray: should convert value to array', () => {
    expect(() => arguments.push('Howdy')).toThrow();
    expect(() => toArray(arguments).push('Howdy')).toNotThrow();
  });

  it('curry: should prepend arguments to function while maintaining context', () => {
    const original = createSpy();
    const curried = curry(original, 3, 2);
    const context = {};

    curried.call(context, 1);

    expect(original).toHaveBeenCalledWith(3, 2, 1);
    expect(original.calls[0].context).toBe(context);
  });

  it('isBoolean', () => {
    expect(isBoolean(true)).toEqual(true);
    expect(isBoolean(false)).toEqual(true);

    expect(isBoolean(0)).toEqual(false);
    expect(isBoolean(1)).toEqual(false);
    expect(isBoolean([])).toEqual(false);
    expect(isBoolean({})).toEqual(false);
    expect(isBoolean(() => {})).toEqual(false);
  });

  it('isObject', () => {
    expect(isObject({})).toEqual(true);
    expect(isObject(() => {})).toEqual(true);
    expect(isObject([])).toEqual(true);

    expect(isObject(true)).toEqual(false);
    expect(isObject(1)).toEqual(false);
    expect(isObject('Howdy')).toEqual(false);
  });

  it('isNumber', () => {
    expect(isNumber(1)).toEqual(true);
    expect(isNumber(3.14)).toEqual(true);
    expect(isNumber(NaN)).toEqual(true);

    expect(isNumber(true)).toEqual(false);
    expect(isNumber('Howdy')).toEqual(false);
  });

  it('isString', () => {
    expect(isString('Howdy')).toEqual(true);
    expect(isString('')).toEqual(true);

    expect(isString(true)).toEqual(false);
    expect(isString(0)).toEqual(false);
    expect(isString({})).toEqual(false);
  });

  it('isUndefined', () => {
    expect(isUndefined(undefined)).toEqual(true);
    expect(isUndefined(void 0)).toEqual(true);
    expect(isUndefined()).toEqual(true);

    expect(isUndefined(null)).toEqual(false);
    expect(isUndefined({})).toEqual(false);
    expect(isUndefined([])).toEqual(false);
  });

  it('isFunction', () => {
    expect(isFunction(() => {})).toEqual(true);
    expect(isFunction(function() {})).toEqual(true);

    expect(isFunction({})).toEqual(false);
    expect(isFunction([])).toEqual(false);
  });
});
