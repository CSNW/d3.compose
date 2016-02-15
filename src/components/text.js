import {
  createDraw,
  getRotate,
  getTranslate,
  types
} from '../helpers';
import component from '../component';

/**
  Text component

  @example
  ```js
  // Simple
  text({text: 'Simple'});

  // Full example
  text({
    text: 'Full',
    rotation: -90,
    textAlign: 'left',
    verticalAlign: 'top'
  });
  ```
  @class Text
*/
export const Text = createDraw({
  select({text}) {
    return this
      .classed('d3c-text', true)
      .selectAll('text').data(text ? [text] : []);
  },
  enter() {
    this.append('text');
  },
  merge({text, rotation, textAlign, verticalAlign, anchor, className, style, width, height}) {
    this
      .text(text)
      .attr('transform', getTransform(rotation, textAlign, verticalAlign, width, height))
      .attr('text-anchor', anchor)
      .attr('class', className)
      .style(style)
  }
});

export const defaultTextAlign = 'center';

Text.properties = {
  /**
    Text to display

    @property text
    @type String
  */
  text: types.string,

  /**
    Rotation of text

    @property rotation
    @type Number
    @default 0
  */
  rotation: {
    type: types.number,
    getDefault: () => 0
  },

  /**
    Horizontal text-alignment (`'left'`, `'center'`, or `'right'`)

    @property textAlign
    @type String
    @default 'center'
  */
  textAlign: {
    type: types.enum('left', 'center', 'right'),
    getDefault: () => defaultTextAlign
  },

  /**
    Vertical text-alignment (`'top'`, `'middle'`, `'bottom'`)

    @property verticalAlign
    @type String
    @default 'middle'
  */
  verticalAlign: {
    type: types.enum('top', 'middle', 'bottom'),
    getDefault: () => 'middle'
  },

  /**
    Text-anchor (`'start'`, `'middle'`, `'end'`, `'inherit'`)

    @property anchor
    @type String
    @default (set based on text-align)
  */
  anchor: {
    type: types.enum('start', 'middle', 'end', 'inherit'),
    getDefault: ({textAlign = defaultTextAlign}) => {
      return {
        left: 'start',
        center: 'middle',
        right: 'end'
      }[textAlign];
    }
  },

  className: types.any,
  style: types.any
};

const text = component(Text);
export default text;

// Helpers
// -------

export function getTransform(rotation, textAlign, verticalAlign, width, height) {
  const x = {
    left: 0,
    center: width / 2,
    right: width
  }[textAlign];

  const y = {
    top: 0,
    middle: height / 2,
    bottom: height
  }[verticalAlign];

  const transform = {
    translate: getTranslate(x, y),
    rotate: getRotate(rotation)
  };

  return `${transform.translate} ${transform.rotate}`;
}
