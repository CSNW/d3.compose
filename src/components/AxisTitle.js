import { defaults } from '../utils';
import { property } from '../helpers';
import { textOptions } from './Text';
import Title from './Title';
var default_axis_title_margin = 8;
var zero_axis_title_margins = {top: 0, right: 0, bottom: 0, left: 0};

/**
  Axis title component that extends Title with defaults (styling)

  @class AxisTitle
  @extends Title
*/
var AxisTitle = Title.extend('AxisTitle', {
  initialize: function() {
    this.base.select('.chart-text')
      .classed('chart-title', false)
      .classed('chart-axis-title', true);
  },

  /**
    Margins (in pixels) around axis title

    @property margins
    @type Object
    @default (by position)
  */
  margins: property('margins', {
    set: function(values) {
      return {
        override: defaults(values, zero_axis_title_margins)
      };
    },
    default_value: function() {
      var margins_by_position = {
        top: {top: default_axis_title_margin / 2, bottom: default_axis_title_margin},
        right: {left: default_axis_title_margin / 2, right: default_axis_title_margin},
        bottom: {bottom: default_axis_title_margin / 2, top: default_axis_title_margin},
        left: {right: default_axis_title_margin / 2, left: default_axis_title_margin}
      };

      return defaults(margins_by_position[this.position()], zero_axis_title_margins);
    }
  })
});

function axisTitle(id, options) {
  return textOptions(id, options, {type: 'AxisTitle'});
}

export {
  AxisTitle as default,
  axisTitle
};
