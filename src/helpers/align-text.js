export default function alignText(element, lineHeight) {
  var offset = 0;
  try {
    var height = element.getBBox().height;

    var elementStyle = window.getComputedStyle(element);
    var cssFontSize = parseFloat(elementStyle['font-size']);
    var cssLineHeight = parseFloat(elementStyle['line-height']);

    // If line-height: normal, use estimate 1.14em
    // (actual line-height depends on browser and font)
    if (isNaN(cssLineHeight)) {
      cssLineHeight = 1.15 * cssFontSize;
    }

    var cssAdjustment = -(cssLineHeight - cssFontSize) / 2;

    // Add additional line-height, if specified
    var heightAdjustment = 0;
    if (lineHeight && lineHeight > 0) {
      heightAdjustment = (lineHeight - height) / 2;
    }

    offset = height + (cssAdjustment || 0) + (heightAdjustment || 0);
  }
  catch (ex) {
    // Errors can occur from getBBox and getComputedStyle
    // No useful information for offset, do nothing
  }

  return offset;
}
