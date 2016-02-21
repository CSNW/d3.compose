// Many utils inlined from Underscore.js
// 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors

// Objects
// -------

export function _assign(target, extensions, undefinedOnly) {
  extensions.forEach(function(extension) {
    if (!extension) {
      return;
    }

    var keys = Object.keys(extension);
    var key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (!undefinedOnly || target[key] === void 0) {
        target[key] = extension[key];
      }
    }
  });

  return target;
}

export var assign = Object.assign || function(obj) {
  return _assign(obj, slice.call(arguments, 1));
};

export function defaults(obj) {
  return _assign(obj, slice.call(arguments, 1), true);
}

export function extend(target) {
  var extensions = slice.call(arguments, 1);
  extensions.forEach(function(extension) {
    for (var key in extension) {
      target[key] = extension[key];
    }
  });

  return target;
}

export function objectEach(obj, fn) {
  if (!obj) {
    return;
  }

  var keys = Object.keys(obj);
  for (var i = 0, length = keys.length; i < length; i++) {
    fn(obj[keys[i]], keys[i], obj);
  }
}

// Arrays
// ------

var slice = Array.prototype.slice;

export function difference(a, b) {
  return a.filter(function(value) { return b.indexOf(value) < 0; });
}

export function includes(arr, item) {
  return arr.indexOf(item) >= 0;
}

export function toArray(arr) {
  return slice.call(arr);
}

// Functions
// ---------

export function curry(fn) {
  var values = slice.call(arguments, 1);

  return function() {
    var args = slice.call(arguments);
    return fn.apply(this, values.concat(args));
  };
}

// Checks
// ------

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

var utils = {
  assign: assign,
  defaults: defaults,
  extend: extend,
  objectEach: objectEach,
  difference: difference,
  includes: includes,
  toArray: toArray,
  curry: curry,
  isBoolean: isBoolean,
  isObject: isObject,
  isNumber: isNumber,
  isString: isString,
  isUndefined: isUndefined,
  isFunction: isFunction,
  inherits: inherits
};
export default utils;
