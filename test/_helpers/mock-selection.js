var mockElement = require('./mock-element');

module.exports = function mockSelection(options) {
  // client, attr, bbox, nodeName, empty
  options = options || {};
  const attr = options.attr || {width: 0, height: 0};
  const empty = 'empty' in options ? options.empty : false;
  const children = options.children || {};

  return {
    attr(key, value) {
      if (arguments.length > 1) {
        attr[key] = value;
        return this;
      }

      return attr[key];
    },
    node() {
      return mockElement({
        nodeName: options.nodeName,
        client: options.client,
        bbox: options.bbox
      });
    },
    append(type) {
      const child = mockSelection({nodeName: type});
      children[type] = child;
      return child;
    },
    select(selector) {
      return children[selector] || mockSelection({empty: true});
    },
    empty() {
      return empty;
    },

    call(fn) {
      return fn.call(this);
    },
    enter() {
      const context = this;
      return {
        call(fn) {
          return fn.call(context);
        }
      };
    },
    exit() {
      const context = this;
      return {
        call(fn) {
          return fn.call(context);
        }
      }
    },
    remove() {}
  };
};
