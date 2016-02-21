export default function alignText(element, lineHeight) {
  var offset = 0;
  try {
    var bbox = element.getBBox();

    // Add additional line-height, if specified
    var heightAdjustment = 0;
    if (lineHeight && lineHeight > 0) {
      heightAdjustment = (lineHeight - bbox.height) / 2;
    }

    return -bbox.y + (heightAdjustment || 0);
  }
  catch (ex) {
    // Errors can occur from getBBox, no useful information, do nothing
  }

  return offset;
}
