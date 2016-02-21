const tape = require('tape');
const sinon = require('sinon');
const mockSelection = require('../_helpers/mock-selection');
const getDimensions = require('../../').helpers.getDimensions;

function stubStyle() {
  if (!global.window) {
    global.window = {getComputedStyle: () => {}};
  }

  sinon.stub(global.window, 'getComputedStyle', element => {
    return {
      height: element.clientHeight,
      width: element.clientWidth,
      borderTopWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0
    };    
  });
}

function restoreStyle() {
  global.window.getComputedStyle.restore();
}

tape('getDimensions() finds width/height of svg', t => {
  // width/height = client || attr
  
  stubStyle();

  // 1. client only
  var dimensions = getDimensions(mockSelection({
    client: {width: 20, height: 20},
    nodeName: 'svg'
  }));
  t.equal(dimensions.width, 20);
  t.equal(dimensions.height, 20);

  // 2. attr only
  dimensions = getDimensions(mockSelection({
    attr: {width: 600, height: 300},
    nodeName: 'svg'
  }));
  t.equal(dimensions.width, 600);
  t.equal(dimensions.height, 300);

  dimensions = getDimensions(mockSelection({
    client: {width: 800, height: 0},
    attr: {width: 600, height: 300},
    nodeName: 'svg'
  }));
  t.equal(dimensions.width, 800);
  t.equal(dimensions.height, 300);

  restoreStyle();
  t.end();
});

tape('getDimensions() finds width/height of element', t => {
  stubStyle();

  // width/height = max(client, attr || bbox)

  // 1. client only
  var dimensions = getDimensions(mockSelection({
    client: {width: 20, height: 20}
  }));
  t.equal(dimensions.width, 20);
  t.equal(dimensions.height, 20);

  // 2. attr + bbox
  dimensions = getDimensions(mockSelection({
    attr: {width: 600, height: 300}
  }));
  t.equal(dimensions.width, 600);
  t.equal(dimensions.height, 300);

  // 3. bbox (no attr)
  dimensions = getDimensions(mockSelection({
    bbox: {width: 200, height: 100}
  }));
  t.equal(dimensions.width, 200);
  t.equal(dimensions.height, 100);

  // 4. client max + attr
  dimensions = getDimensions(mockSelection({
    client: {width: 800, height: 0},
    attr: {width: 600, height: 300}
  }));
  t.equal(dimensions.width, 800);
  t.equal(dimensions.height, 300);

  // 5. client max + bbox
  dimensions = getDimensions(mockSelection({
    client: {width: 800, height: 0},
    bbox: {width: 600, height: 300}
  }));
  t.equal(dimensions.width, 800);
  t.equal(dimensions.height, 300);

  restoreStyle();
  t.end();
});
