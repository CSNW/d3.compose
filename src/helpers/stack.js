import { extend } from '../utils';
import { translate } from '../helpers';

/**
  Stack given array of elements vertically or horizontally

  @example
  ```js
  // Stack all text elements vertically, from the top, with 0px padding
  d3.selectAll('text').call(helpers.stack())

  // Stack all text elements horizontally, from the right, with 5px padding
  d3.selectAll('text').call(helpers.stack({
    direction: 'horizontal',
    origin: 'right',
    padding: 5
  }));
  ```
  @method stack
  @for helpers
  @param {Object} [options]
  @param {String} [options.direction=vertical] `"vertical"` or `"horizontal"`
  @param {String} [options.origin] `"top"`, `"right"`, `"bottom"`, or `"left"` (by default, `"top"` for `"vertical"` and `"left"` for `"horizontal"`)
  @param {Number} [options.padding=0] padding (in px) between elements
  @param {Number} [options.min_height=0] minimum spacing height (for vertical stacking)
  @param {Number} [options.min_width=0]  minimum spacing width (for horizontal stacking)
  @return {Function}
*/
export default function stack(options) {
  options = extend({
    direction: 'vertical',
    origin: 'top',
    padding: 0,
    min_height: 0,
    min_width: 0
  }, options);

  // Ensure valid origin based on direction
  if (options.direction == 'horizontal' && !(options.origin == 'left' || options.origin == 'right'))
    options.origin = 'left';
  else if (options.direction == 'vertical' && !(options.origin == 'top' || options.origin == 'bottom'))
    options.origin = 'top';

  function padding(i) {
    return i > 0 && options.padding ? options.padding : 0;
  }

  return function(elements) {
    if (elements && elements.attr) {
      var previous = 0;

      elements.attr('transform', function(d, i) {
        var element_dimensions = this.getBBox();
        var spacing_width = d3.max([element_dimensions.width, options.min_width]);
        var spacing_height = d3.max([element_dimensions.height, options.min_height]);
        var x = 0;
        var y = 0;
        var next_position;

        if (options.direction == 'horizontal') {
          next_position = previous + spacing_width + padding(i);

          if (options.origin == 'left')
            x = previous + padding(i);
          else
            x = next_position;

          previous = next_position;
        }
        else {
          next_position = previous + spacing_height + padding(i);

          if (options.origin == 'top')
            y = previous + padding(i);
          else
            y = next_position;

          previous = next_position;
        }

        return translate(x, y);
      });
    }
  };
}
