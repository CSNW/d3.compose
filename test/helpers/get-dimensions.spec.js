import expect, {spyOn, restoreSpies} from 'expect';
import getDimensions from '../../src/helpers/get-dimensions';

export function mockSelection(options) {
  // client, attr, bbox, nodeName
  var client = options.client || {width: 0, height: 0};
  var attr = options.attr || {width: 0, height: 0};
  var bbox = options.bbox || {width: 0, height: 0};
  var nodeName = options.nodeName || 'g';

  return {
    attr: function(key) {
      return attr[key];
    },
    node: function() {
      return {
        nodeName,
        clientWidth: client.width,
        clientHeight: client.height,
        getBBox: function() {
          return bbox;
        }
      };
    }
  };
}

describe('getDimensions', () => {
  beforeEach(() => {
    spyOn(window, 'getComputedStyle').andCall(function(element) {
      return {
        height: element.clientHeight,
        width: element.clientWidth,
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0
      };
    });
  });
  afterEach(restoreSpies);

  it('should find width/height of svg', () => {
    // width/height = client || attr

    // 1. client only
    var dimensions = getDimensions(mockSelection({
      client: {width: 20, height: 20},
      nodeName: 'svg'
    }));
    expect(dimensions.width).toEqual(20);
    expect(dimensions.height).toEqual(20);

    // 2. attr only
    dimensions = getDimensions(mockSelection({
      attr: {width: 600, height: 300},
      nodeName: 'svg'
    }));
    expect(dimensions.width).toEqual(600);
    expect(dimensions.height).toEqual(300);

    dimensions = getDimensions(mockSelection({
      client: {width: 800, height: 0},
      attr: {width: 600, height: 300},
      nodeName: 'svg'
    }));
    expect(dimensions.width).toEqual(800);
    expect(dimensions.height).toEqual(300);
  });

  it('should find width/height of element', () => {
    // width/height = max(client, attr || bbox)

    // 1. client only
    var dimensions = getDimensions(mockSelection({
      client: {width: 20, height: 20}
    }));
    expect(dimensions.width).toEqual(20);
    expect(dimensions.height).toEqual(20);

    // 2. attr + bbox
    var dimensions = getDimensions(mockSelection({
      attr: {width: 600, height: 300}
    }));
    expect(dimensions.width).toEqual(600);
    expect(dimensions.height).toEqual(300);

    // 3. bbox (no attr)
    var dimensions = getDimensions(mockSelection({
      bbox: {width: 200, height: 100}
    }));
    expect(dimensions.width).toEqual(200);
    expect(dimensions.height).toEqual(100);

    // 4. client max + attr
    var dimensions = getDimensions(mockSelection({
      client: {width: 800, height: 0},
      attr: {width: 600, height: 300}
    }));
    expect(dimensions.width).toEqual(800);
    expect(dimensions.height).toEqual(300);

    // 5. client max + bbox
    var dimensions = getDimensions(mockSelection({
      client: {width: 800, height: 0},
      bbox: {width: 600, height: 300}
    }));
    expect(dimensions.width).toEqual(800);
    expect(dimensions.height).toEqual(300);
  })
});
