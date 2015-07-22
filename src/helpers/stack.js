import { translate } from './index';

/**
  Stack given array of elements vertically or horizontally

  @example
  ```js
  // Stack all text elements vertically, from the top, with 0px padding
  d3.selectAll('text').call(helpers.stack)

  // Stack all text elements horizontally, from the right, with 5px padding
  d3.selectAll('text').call(helpers.stack.bind(this, {
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
*/
export default function stack(options, elements) {
  if (options && !elements) {
    elements = options;
    options = {
      direction: 'vertical',
      origin: 'top',
      padding: 0
    };
  }

  function padding(d, i) {
    return i > 0 && options.padding ? options.padding : 0;
  }

  if (elements && elements.attr) {
    var previous = 0;
    elements
      .attr('transform', function(d, i) {
        var element_dimensions = this.getBBox();
        var x = 0;
        var y = 0;

        if (options.direction == 'horizontal') {
          if (!(options.origin == 'left' || options.origin == 'right'))
            options.origin = 'left';

          if (options.origin == 'left')
            x = previous + padding(d, i);
          else
            x = previous + element_dimensions.width + padding(d, i);

          previous = previous + element_dimensions.width + padding(d, i);
        }
        else {
          if (!(options.origin == 'top' || options.origin == 'bottom'))
            options.origin = 'top';

          if (options.origin == 'top')
            y = previous + padding(d, i);
          else
            y = previous + element_dimensions.height + padding(d, i);

          previous = previous + element_dimensions.height + padding(d, i);
        }

        return translate(x, y);
      });
  }
}
