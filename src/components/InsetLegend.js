import {
  property,
  dimensions,
  translate,
  createHelper
} from '../helpers';
import Legend from './Legend';

/**
  Legend positioned within chart bounds.

  @class InsetLegend
  @extends Legend
*/
var InsetLegend = Legend.extend({
  initialize: function(options) {
    Legend.prototype.initialize.call(this, options);
    this.on('draw', function() {
      // Position legend on draw
      // (Need actual width/height for relative_to)
      var translation = this.translation();
      this.legend_base.attr('transform', translate(translation.x, translation.y));
    }.bind(this));
  },

  /**
    Position legend within chart layer `{x, y, relative_to}`
    Use `relative_to` to use x,y values relative to x-y origin
    (e.g. `"left-top"` is default)

    @example
    ```js
    d3.select('#chart')
      .chart('Compose', function(data) {
        return {
          components: {
            legend: {
              type: 'InsetLegend',
              // Position legend 10px away from right-bottom corner of chart
              translation: {x: 10, y: 10, relative_to: 'right-bottom'}
            }
          }
        }
      });
    ```
    @property translation
    @type Object {x,y}
    @default {x: 10, y: 10, relative_to: 'left-top'}
  */
  translation: property({
    default_value: {x: 10, y: 0, relative_to: 'left-top'},
    get: function(value) {
      var x = value.x || 0;
      var y = value.y || 0;
      var relative_to_x = (value.relative_to && value.relative_to.split('-')[0]) || 'left';
      var relative_to_y = (value.relative_to && value.relative_to.split('-')[1]) || 'top';

      if (relative_to_x === 'right') {
        x = this.width() - dimensions(this.legend_base).width - x;
      }
      if (relative_to_y === 'bottom') {
        y = this.height() - dimensions(this.legend_base).height - y;
      }

      return {
        x: x,
        y: y
      };
    }
  }),

  skip_layout: true
}, {
  layer_type: 'chart'
});

var insetLegend = createHelper('InsetLegend');

export {
  InsetLegend as default,
  insetLegend
};
