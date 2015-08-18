import {
  getMargins,
  property
} from '../helpers';
import { textOptions } from './Text';
import Title from './Title';

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
  })
});

function defaultMargins(position) {
  var default_margin = 8;
  var margins_by_position = {
    top: {top: default_margin / 2, bottom: default_margin},
    right: {left: default_margin / 2, right: default_margin},
    bottom: {bottom: default_margin / 2, top: default_margin},
    left: {right: default_margin / 2, left: default_margin}
  };

  return getMargins(margins_by_position[position]);
}

function axisTitle(id, options) {
  return textOptions(id, options, {type: 'AxisTitle'});
}

export {
  AxisTitle as default,
  axisTitle
};
