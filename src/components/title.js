import {assign} from '../utils';
import {types} from '../helpers';
import component, {Component} from '../component';
import {Text} from './text';

export const defaultPosition = 'top';
export const defaultMargin = 8;

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
export const Title = Component.extend({
  render() {
    this.base.classed('d3c-title', true);
    Text(this.base, this.props);
  },

  getMargin() {
    const {position = defaultPosition} = this.props;
    var top = 0, right = 0, bottom = 0, left = 0;

    if (position == 'left' || position == 'right') {
      right = defaultMargin;
      left = defaultMargin;
    } else {
      top = defaultMargin;
      bottom = defaultMargin;
    }

    return {top, right, bottom, left};
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
        getDefault: () => defaultPosition
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
        getDefault: ({position = defaultPosition}) => {
          const byPosition = {
            right: 90,
            left: -90
          };
          return byPosition[position] || 0;
        }
      }
    }
  )
});

const title = component(Title);
export default title;
