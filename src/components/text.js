import {
  createDraw,
  getRotate,
  getTranslate,
  types
} from '../helpers';
import component from '../component';

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

Text.properties = {
  text: types.string,

  rotation: {
    type: types.number,
    getDefault: () => 0
  },

  textAlign: {
    type: types.enum('left', 'center', 'right'),
    getDefault: () => 'center'
  },

  verticalAlign: {
    type: types.enum('top', 'middle', 'bottom'),
    getDefault: () => 'middle'
  },

  anchor: {
    type: types.enum('start', 'middle', 'end', 'inherit'),
    getDefault: ({textAlign}) => {
      return {
        left: 'start',
        center: 'middle',
        right: 'end'
      }[textAlign || 'middle'];
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
