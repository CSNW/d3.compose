import { defaults } from '../utils';
import { property } from '../helpers';
import Text, { textOptions } from './Text';
var default_title_margin = 8;
var zero_title_margins = {top: 0, right: 0, bottom: 0, left: 0};

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
    @default {top: 8, right: 8, bottom: 8, left: 8}
  */
  margins: property('margins', {
    set: function(values) {
      return {
        override: defaults(values, zero_title_margins)
      };
    },
    default_value: function() {
      var margins_by_position = {
        top: {top: default_title_margin, bottom: default_title_margin},
        right: {right: default_title_margin, left: default_title_margin},
        bottom: {top: default_title_margin, bottom: default_title_margin},
        left: {right: default_title_margin, left: default_title_margin}
      };
      return defaults(margins_by_position[this.position()], zero_title_margins);
    }
  }),

  /**
    Rotation of title. (Default is `-90` for `position = "right"`, `90` for `position = "left"`, and `0` otherwise).

    @property rotation
    @type Number
    @default (set based on `position`)
  */
  rotation: property('rotation', {
    default_value: function() {
      var rotate_by_position = {
        right: 90,
        left: -90
      };

      return rotate_by_position[this.position()] || 0;
    }
  })
});

function title(id, options) {
  return textOptions(id, options, {type: 'Title'});
}

export {
  Title as default,
  title
};
