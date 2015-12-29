import {extend} from '../utils';
import {
  getMargins,

  createPrepare,
  getLayer,

  createProperties
} from '../helpers';
import { textOptions, prepareText } from './Text';
import Title from './Title';

/**
  Axis title component that extends Title with defaults (styling)

  @class AxisTitle
  @extends Title
*/
var AxisTitle = Title.extend({
  prepare: createPrepare(
    prepareMargins,
    prepareText
  ),

  setLayout: function(x, y, options) {
    Title.prototype.setLayout.call(this, x, y, options);
  },

  render: function() {
    Title.prototype.render.call(this);
    getLayer(this.base, 'text')
      .classed('chart-title', false)
      .classed('chart-axis-title', true);
  }
}, {
  properties: extend({}, Title.properties, {
    /**
      Margins (in pixels) around axis title

      @property margins
      @type Object
      @default (set based on `position`)
    */
    margins: extend({}, Title.properties.margins, {
      getDefault: function(selection, props) {
        return defaultMargins(props.position);
      }
    })
  })
});

// DEPRECATED Backwards compatibility for properties
createProperties(AxisTitle);

function prepareMargins(selection, props) {
  return extend({}, props, {
    margins: getMargins(props.margins, defaultMargins(props.position))
  });
}

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
