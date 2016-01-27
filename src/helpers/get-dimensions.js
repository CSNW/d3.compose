import d3 from 'd3';

/**
  Helper for robustly determining width/height of given selector.
  Checks dimensions from css, attributes, and bounding box.

  @method getDimensions
  @for helpers
  @param {d3.selection} selection
  @return {Object} `{width, height}`
*/
export default function getDimensions(selection) {
  // 1. Get width/height set via css (only valid for svg and some other elements)
  var client = clientDimensions(selection);

  if (client.width && client.height)
    return client;

  // 2. Get width/height set via attribute
  var attr = attrDimensions(selection);

  if (isSVG(selection)) {
    return {
      width: client.width != null ? client.width : attr.width || 0,
      height: client.height != null ? client.height : attr.height || 0
    };
  }
  else {
    var bbox = bboxDimensions(selection);

    // Size set by css -> client (only valid for svg and some other elements)
    // Size set by svg -> attr override or bounding_box
    // -> Take maximum
    return {
      width: d3.max([client.width, attr.width || bbox.width]) || 0,
      height: d3.max([client.height, attr.height || bbox.height]) || 0
    };
  }
}

function clientDimensions(selection) {
  var element = selection.node();
  var width = element && element.clientWidth;
  var height = element && element.clientHeight;

  // Issue: Firefox does not correctly calculate clientWidth/clientHeight for svg
  //        calculate from css
  //        http://stackoverflow.com/questions/13122790/how-to-get-svg-element-dimensions-in-firefox
  //        Note: This makes assumptions about the box model in use and that width/height are not percent values
  if (isSVG(selection) && (!element.clientWidth || !element.clientHeight) && typeof window !== 'undefined' && window.getComputedStyle) {
    var styles = window.getComputedStyle(element);
    height = parseFloat(styles.height) - parseFloat(styles.borderTopWidth) - parseFloat(styles.borderBottomWidth);
    width = parseFloat(styles.width) - parseFloat(styles.borderLeftWidth) - parseFloat(styles.borderRightWidth);
  }

  return {
    width: width && !isNaN(width) ? width : null,
    height: height && !isNaN(height) ? height : null
  };
}

function attrDimensions(selection) {
  return {
    width: selection && selection.attr && parseFloat(selection.attr('width')),
    height: selection && selection.attr && parseFloat(selection.attr('height'))
  };
}

function bboxDimensions(selection) {
  var element = selection.node();
  var bbox;
  try {
    bbox = element && typeof element.getBBox == 'function' && element.getBBox();
  }
  catch(ex) {
    // Firefox throws error when calling getBBox when svg hasn't been displayed
    // Ignore error and set to empty
    bbox = {width: 0, height: 0};
  }

  return bbox;
}

function isSVG(selection) {
  return selection.node().nodeName == 'svg';
}
