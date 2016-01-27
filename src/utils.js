const slice = Array.prototype.slice;

export function _assign(obj, extensions, undefinedOnly) {
  extensions.forEach((extension) => {
    Object.keys(extension).forEach((key) => {
      if (!undefinedOnly || obj[key] === void 0) {
        obj[key] = extension[key];
      }
    });
  });

  return obj;
}

export const assign = Object.assign || function(obj) {
  return _assign(obj, slice.call(arguments, 1));
};

export function defaults(obj) {
  return _assign(obj, slice.call(arguments, 1), true);
}

export function objectEach(obj, fn) {
  if (!obj) {
    return;
  }

  Object.keys(obj).forEach((key) => {
    fn(obj[key], key, obj);
  });
}

export function curry(fn) {
  const values = slice.call(arguments, 1);

  return function() {
    var args = slice.call(arguments);
    return fn.apply(this, values.concat(args));
  };
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

const utils = {
  assign,
  defaults,
  objectEach,
  curry,
  isBoolean,
  isObject,
  isNumber,
  isString,
  isUndefined,
  isFunction,
  inherits
};
export default utils;
