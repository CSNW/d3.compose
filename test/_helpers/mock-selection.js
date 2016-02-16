var mockElement = require('./mock-element');

module.exports = function mockSelection(options) {
  // client, attr, bbox, nodeName, empty
  options = options || {};
  const attr = options.attr || {width: 0, height: 0};
  const empty = 'empty' in options ? options.empty : false;
  const children = options.children || {};

  return {
    attr: function(key, value) {
      if (arguments.length > 1) {
        attr[key] = value;
        return this;
      }

      return attr[key];
    },
    node: function() {
      return mockElement({
        nodeName: options.nodeName,
        client: options.client,
        bbox: options.bbox
      });
    },
    append: function(type) {
      const child = mockSelection({nodeName: type});
      children[type] = child;
      return child;
    },
    select: function(selector) {
      return children[selector] || mockSelection({empty: true});
    },
    empty: function() {
      return empty;
    }
  };
};
