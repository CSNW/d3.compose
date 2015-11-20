import {extend} from '../utils';
import {
  dimensions,
  translate,
  createHelper,

  types,
  getLayer
} from '../helpers';
import Legend from './Legend';

/**
  Legend positioned within chart bounds.

  @class InsetLegend
  @extends Legend
*/
var InsetLegend = Legend.extend({
  render: function() {
    Legend.prototype.render.call(this);

    var layer = getLayer(this.base, 'legend');
    var transform = getTransform(layer, this.props);

    layer.attr('transform', transform);
  },

  skip_layout: true
}, {
  properties: extend({}, Legend.properties, {
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
    translation: {
      type: types.object,
      getDefault: function() {
        return {x: 10, y: 0, relative_to: 'left-top'};
      }
    }
  }),

  layer_type: 'chart'
});

function getTransform(layer, props) {
  var value = props.translation;
  var x = value.x || 0;
  var y = value.y || 0;
  var relative_to_x = (value.relative_to && value.relative_to.split('-')[0]) || 'left';
  var relative_to_y = (value.relative_to && value.relative_to.split('-')[1]) || 'top';
  var size = dimensions(layer);

  if (relative_to_x === 'right')
    x = props.width - size.width - x;
  if (relative_to_y === 'bottom')
    y = props.height - size.height - y;

  return translate(x, y);
}

var insetLegend = createHelper('InsetLegend');

export {
  InsetLegend as default,
  insetLegend
};
