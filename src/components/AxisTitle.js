import { defaults } from '../utils';
import { property } from '../helpers';
import { textOptions } from './Text';
import Title from './Title';
var default_axis_title_margins = {top: 8, right: 8, bottom: 8, left: 8};

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
        override: defaults(values, default_axis_title_margins)
      };
    },
    default_value: function() {
      var margins_by_position = {
        top: {top: 4},
        right: {left: 4},
        bottom: {bottom: 4},
        left: {right: 4}
      };

      return defaults(margins_by_position[this.position()], default_axis_title_margins);
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
