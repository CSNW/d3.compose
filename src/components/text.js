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
export var Text = createDraw({
  select: function select(props) {
    return this
      .classed('d3c-text', true)
      .selectAll('text').data(props.text ? [props.text] : []);
  },
  enter: function enter() {
    this.append('text');
  },
  merge: function merge(props) {
    var transform = getTransform(props.rotation, props.textAlign, props.verticalAlign, props.width, props.height);
    this
      .text(props.text)
      .attr('transform', transform)
      .attr('text-anchor', props.anchor)
      .attr('class', props.className)
      .style(props.style);
  }
});

export var defaultTextAlign = 'center';

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
    getDefault: function() { return 0; }
  },

  /**
    Horizontal text-alignment (`'left'`, `'center'`, or `'right'`)

    @property textAlign
    @type String
    @default 'center'
  */
  textAlign: {
    type: types.enum('left', 'center', 'right'),
    getDefault: function() { return defaultTextAlign; }
  },

  /**
    Vertical text-alignment (`'top'`, `'middle'`, `'bottom'`)

    @property verticalAlign
    @type String
    @default 'middle'
  */
  verticalAlign: {
    type: types.enum('top', 'middle', 'bottom'),
    getDefault: function() { return 'middle'; }
  },

  /**
    Text-anchor (`'start'`, `'middle'`, `'end'`, `'inherit'`)

    @property anchor
    @type String
    @default (set based on text-align)
  */
  anchor: {
    type: types.enum('start', 'middle', 'end', 'inherit'),
    getDefault: function(props) {
      return {
        left: 'start',
        center: 'middle',
        right: 'end'
      }[props.textAlign || defaultTextAlign];
    }
  },

  className: types.any,
  style: types.any
};

var text = component(Text);
export default text;

// Helpers
// -------

export function getTransform(rotation, textAlign, verticalAlign, width, height) {
  var x = {
    left: 0,
    center: width / 2,
    right: width
  }[textAlign];

  var y = {
    top: 0,
    middle: height / 2,
    bottom: height
  }[verticalAlign];

  var translate = getTranslate(x, y);
  var rotate = getRotate(rotation);

  return translate + ' ' + rotate;
}
