import {assign} from '../utils';
import {types} from '../helpers';
import component, {Component} from '../component';
import {Text} from './text';

export var defaultPosition = 'top';
export var defaultMargin = 8;

/**
  Title component that extends Text with defaults for styling, margins, and rotation

  @example
  ```js
  // Simple
  title({text: 'Simple'});

  // Position sets defaults
  // left: updates margins and rotates -90
  title({text: 'Rotated', position: 'left'});

  // Full example
  title({
    text: 'Full',
    rotation: 90,
    textAlign: 'left',
    verticalAlign: 'top'
  });
  ```
  @class Title
*/
export var Title = Component.extend({
  render: function render() {
    this.base.classed('d3c-title', true);
    Text(this.base, this.props);
  },

  getMargin: function getMargin() {
    var position = this.props.position || defaultPosition;
    var top = 0;
    var right = 0;
    var bottom = 0;
    var left = 0;

    if (position == 'left' || position == 'right') {
      right = defaultMargin;
      left = defaultMargin;
    } else {
      top = defaultMargin;
      bottom = defaultMargin;
    }

    return {top: top, right: right, bottom: bottom, left: left};
  }
}, {
  properties: assign({},
    Text.properties,
    {
      /**
        "position" of title relative to chart
        (used to set defaults for margins and rotation)

        @property position
        @type String
        @default 'top'
      */
      position: {
        type: types.enum('top', 'right', 'bottom', 'left'),
        getDefault: function() { return defaultPosition; }
      },

      /**
        Rotation of title
        (position: left = -90, right = 90, top/bottom = 0)

        @property rotation
        @type Number
        @default (set based on position)
      */
      rotation: {
        type: types.number,
        getDefault: function(props) {
          var position = props.position || defaultPosition;
          var byPosition = {
            right: 90,
            left: -90
          };
          return byPosition[position] || 0;
        }
      }
    }
  )
});

var title = component(Title);
export default title;
