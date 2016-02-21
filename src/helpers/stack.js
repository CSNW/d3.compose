import d3 from 'd3';
import getTranslate from './get-translate';

export default function stack(options) {
  options = options || {};
  var direction = options.direction || 'vertical';
  var origin = options.origin || 'top';
  var minHeight = options.minHeight || 0;
  var minWidth = options.minWidth || 0;

  // Ensure valid origin based on direction
  if (direction == 'horizontal' && !(origin == 'left' || origin == 'right')) {
    origin = 'left';
  } else if (direction == 'vertical' && !(origin == 'top' || origin == 'bottom')) {
    origin = 'top';
  }

  function padding(i) {
    return i > 0 && options.padding ? options.padding : 0;
  }

  return function(elements) {
    if (elements && elements.attr) {
      var previous = 0;

      elements.attr('transform', function(d, i) {
        var dimensions = {width: 0, height: 0};
        try {
          dimensions = this.getBBox();
        } catch (ex) {}

        var width = d3.max([dimensions.width, minWidth]);
        var height = d3.max([dimensions.height, minHeight]);
        var x = 0;
        var y = 0;
        var nextPosition;

        if (direction == 'horizontal') {
          nextPosition = previous + width + padding(i);

          if (origin == 'left') {
            x = previous + padding(i);
          } else {
            x = nextPosition;
          }

          previous = nextPosition;
        } else {
          nextPosition = previous + height + padding(i);

          if (origin == 'top') {
            y = previous + padding(i);
          } else {
            y = nextPosition;
          }

          previous = nextPosition;
        }

        return getTranslate(x, y);
      });
    }
  };
}
