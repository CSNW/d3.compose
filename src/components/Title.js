import {extend} from '../utils';
import {
  getMargins,
  types,
  createPrepare,
  getLayer
} from '../helpers';
import Text, { textOptions, prepareText } from './Text';

/**
  Title component that extends Text with defaults (styling, sensible margins, and rotated when positioned left or right)

  @class Title
  @extends Text
*/
var Title = Text.extend({
  prepare: createPrepare(
    prepareMargins,
    prepareText
  ),

  render: function() {
    Text.prototype.render.call(this);
    getLayer(this.base, 'text').classed('chart-title', true);
  },

  // === TODO Remove, compatibility with current system
  margins: function() {
    return this.props.margins;
  }
  // ===
}, {
  properties: extend({}, Text.properties, {
    /**
      Margins (in pixels) around Title

      @property margins
      @type Object
      @default (set based on `position`)
    */
    margins: {
      type: types.any,
      getDefault: function(selection, props) {
        return defaultMargins(props.position);
      }
    },

    /**
      Rotation of title. (Default is `-90` for `position = "right"`, `90` for `position = "left"`, and `0` otherwise).

      @property rotation
      @type Number
      @default (set based on `position`)
    */
    rotation: extend({}, Text.properties.rotation, {
      getDefault: function(selection, props) {
        var rotate_by_position = {
          right: 90,
          left: -90
        };

        return rotate_by_position[props.position] || 0;
      }
    })
  })
});

function prepareMargins(selection, props) {
  return extend({}, props, {
    margins: getMargins(props.margins, defaultMargins(props.position))
  });
}

function defaultMargins(position) {
  var default_margin = 8;
  var margins_by_position = {
    top: {top: default_margin, bottom: default_margin},
    right: {right: default_margin, left: default_margin},
    bottom: {top: default_margin, bottom: default_margin},
    left: {right: default_margin, left: default_margin}
  };
  return getMargins(margins_by_position[position]);
}

function title(id, options) {
  return textOptions(id, options, {type: 'Title'});
}

export {
  Title as default,
  title
};
