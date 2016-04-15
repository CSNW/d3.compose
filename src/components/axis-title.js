import {assign} from '../utils';
import component, {Component} from '../component';
import {Text} from './text';
import {
  Title,
  defaultMargin,
  defaultPosition
} from './title';

/**
  Axis title component that extends Title with defaults for styling and margins

  @example
  ```js
  // Simple
  axisTitle({text: 'Simple'});

  // Position sets defaults
  // left: updates margins and rotates -90
  axisTitle({text: 'Rotated', position: 'left'});

  // Full example
  axisTitle({
    text: 'Full',
    rotation: 90,
    textAlign: 'left',
    verticalAlign: 'top'
  });
  ```
  @class AxisTitle
*/
export var AxisTitle = Component.extend({
  render: function render() {
    this.base.classed('d3c-axis-title', true);
    Text(this.base, this.props);
  },

  getMargin: function getMargin() {
    var position = this.props.position || defaultPosition;
    var top = 0;
    var right = 0;
    var bottom = 0;
    var left = 0;

    if (position == 'left') {
      right = defaultMargin / 2;
      left = defaultMargin;
    } else if (position == 'right') {
      right = defaultMargin;
      left = defaultMargin / 2;
    } else if (position == 'bottom') {
      top = defaultMargin / 2;
      bottom = defaultMargin;
    } else {
      top = defaultMargin;
      bottom = defaultMargin / 2;
    }

    return {top: top, right: right, bottom: bottom, left: left};
  }
}, {
  properties: assign({}, Title.properties)
});

var axisTitle = component(AxisTitle);
export default axisTitle;
