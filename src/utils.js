// Many utils inlined from Underscore.js
// (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors

export var slice = Array.prototype.slice;
export var toString = Object.prototype.toString;

function _extend(target, extensions, undefined_only) {
  for (var i = 0, length = extensions.length; i < length; i++) {
    for (var key in extensions[i]) {
      if (!undefined_only || target[key] === void 0)
        target[key] = extensions[i][key];
    }
  }

  return target;
}

export function contains(arr, item) {
  return arr.indexOf(item) >= 0;
}

export function compact(arr) {
  return arr.filter(function(item) {
    return item;
  });
}

export function difference(a, b) {
  return a.filter(function(value) {
    return b.indexOf(value) < 0;
  });
}

export function defaults(target) {
  return _extend(target, slice.call(arguments, 1), true);
}

export function extend(target) {
  return _extend(target, slice.call(arguments, 1));
}

export function flatten(arr) {
  // Assumes all items in arr are arrays and only flattens one level
  return arr.reduce(function(memo, item) {
    return memo.concat(item);
  }, []);
}

export function find(arr, fn, context) {
  if (!arr) return;
  for (var i = 0, length = arr.length; i < length; i++) {
    if (fn.call(context, arr[i], i, arr))
      return arr[i];
  }
}

export function first(arr, n) {
  if (arr == null) return void 0;
  if (n == null) return arr[0];
  return Array.prototype.slice.call(arr, 0, n);
}

export function isBoolean(obj) {
  return obj === true || obj === false;
}
export function isObject(obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
}
export function isNumber(obj) {
  return toString.call(obj) === '[object Number]';
}
export function isString(obj) {
  return toString.call(obj) === '[object String]';
}
export function isUndefined(obj) {
  return obj === void 0;
}

export var isFunction = function(obj) {
  return toString.call(obj) === '[object Function]';
};
if (typeof /./ != 'function' && typeof Int8Array != 'object') {
  isFunction = function(obj) {
    return typeof obj == 'function' || false;
  };
}

export function objectEach(obj, fn, context) {
  if (!obj) return;
  var keys = Object.keys(obj);
  for (var i = 0, length = keys.length; i < length; i++) {
    fn.call(context, obj[keys[i]], keys[i], obj);
  }
}

export function objectFind(obj, fn, context) {
  if (!obj) return;
  var keys = Object.keys(obj);
  for (var i = 0, length = keys.length; i < length; i++) {
    if (fn.call(context, obj[keys[i]], keys[i], obj))
      return obj[keys[i]];
  }
}

export function pluck(objs, key) {
  if (!objs) return [];
  return objs.map(function(obj) {
    return obj[key];
  });
}

export function uniq(arr) {
  var result = [];
  for (var i = 0, length = arr.length; i < length; i++) {
    if (result.indexOf(arr[i]) < 0)
      result.push(arr[i]);
  }
  return result;
}

export function inherits(Child, Parent) {
  Child.prototype = Object.create(Parent.prototype, {
    constructor: {
      value: Child,
      enumerable: false,
      writeable: true,
      configurable: true
    }
  });

  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(Child, Parent);
  }
  else {
    Child.__proto__ = Parent; //eslint-disable-line no-proto

    // __proto__ isn't supported in IE,
    // use one-time copy of static properties to approximate
    defaults(Child, Parent);
  }
}

// If value isn't `undefined`, return `value`, otherwise use `default_value`
//
// @method valueOrDefault
// @param {Any} [value]
// @param {Any} default_value
// @return {Any}
export function valueOrDefault(value, default_value) {
  return !isUndefined(value) ? value : default_value;
}

var utils = {
  slice: slice,
  toString: toString,
  contains: contains,
  compact: compact,
  difference: difference,
  defaults: defaults,
  extend: extend,
  flatten: flatten,
  find: find,
  first: first,
  isBoolean: isBoolean,
  isFunction: isFunction,
  isObject: isObject,
  isNumber: isNumber,
  isString: isString,
  isUndefined: isUndefined,
  objectEach: objectEach,
  objectFind: objectFind,
  pluck: pluck,
  uniq: uniq,
  inherits: inherits,
  valueOrDefault: valueOrDefault
};
export default utils;
