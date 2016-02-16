module.exports = function mockElement(options) {
  // client, bbox, nodeName
  options = options || {};
  const client = options.client || {width: 0, height: 0};
  const bbox = options.bbox || {width: 0, height: 0};
  const nodeName = options.nodeName || 'g';

  return {
    nodeName,
    clientWidth: client.width,
    clientHeight: client.height,
    getBBox: function() {
      return bbox;
    }
  };
};
