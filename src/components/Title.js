import {
  getMargins,
  property
} from '../helpers';
import Text, { textOptions } from './Text';

/**
  Title component that extends Text with defaults (styling, sensible margins, and rotated when positioned left or right)

  @class Title
  @extends Text
*/
var Title = Text.extend('Title', {
  initialize: function() {
    this.base.select('.chart-text').classed('chart-title', true);
  },

  /**
    Margins (in pixels) around Title

    @property margins
    @type Object
    @default (set based on `position`)
  */
  margins: property({
    set: function(values) {
      return {
        override: getMargins(values, defaultMargins(this.position()))
      };
    },
    default_value: function() {
      return defaultMargins(this.position());
    }
  }),

  /**
    Rotation of title. (Default is `-90` for `position = "right"`, `90` for `position = "left"`, and `0` otherwise).

    @property rotation
    @type Number
    @default (set based on `position`)
  */
  rotation: property({
    default_value: function() {
      var rotate_by_position = {
        right: 90,
        left: -90
      };

      return rotate_by_position[this.position()] || 0;
    }
  })
});

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
