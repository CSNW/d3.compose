import {
  contains,
  extend,
  isString
} from '../utils';
import {
  property,
  style,
  translate,
  rotate,
  mixin
} from '../helpers';
import { StandardLayer } from '../mixins';
import Component from '../Component';

/**
  Add text to a chart.

  ### Extending

  To extend the `Text` component, the following methods are available:

  - `onDataBind`
  - `onInsert`
  - `onEnter`
  - `onEnterTransition`
  - `onUpdate`
  - `onUpdateTransition`
  - `onMerge`
  - `onMergeTransition`
  - `onExit`
  - `onExitTransition`

  @example
  ```js
  d3.select('#chart')
    .chart('Compose', function(data) {
      return {
        components: {
          title: {
            type: 'Text',
            position: 'top'
            text: 'Main Title',
            textAlign: 'left',
            'class': 'title'
          },
          notes: {
            type: 'Text',
            position: 'bottom',
            text: 'Notes',
            'class': 'notes'
          }
        }
      };
    });
  ```
  @class Text
  @extends Component, StandardLayer
*/
var Text = mixin(Component, StandardLayer).extend({
  initialize: function(options) {
    this._super.initialize.call(this, options);

    // Use standard layer for extensibility
    this.standardLayer('Text', this.base.append('g').classed('chart-text', true));
  },

  /**
    Text to display

    @property text
    @type String
  */
  text: property(),

  /**
    Rotation of text

    @property rotation
    @type Number
    @default 0
  */
  rotation: property({
    default_value: 0
  }),

  /**
    Horizontal text-alignment of text (`"left"`, `"center"`, or `"right"`)

    @property textAlign
    @type String
    @default "center"
  */
  textAlign: property({
    default_value: 'center',
    validate: function(value) {
      return contains(['left', 'center', 'right'], value);
    }
  }),

  /**
    text-anchor for text (`"start"`, `"middle"`, or `"end"`)

    @property anchor
    @type String
    @default (set by `textAlign`)
  */
  anchor: property({
    default_value: function() {
      return {
        left: 'start',
        center: 'middle',
        right: 'end'
      }[this.textAlign()];
    },
    validate: function(value) {
      return contains(['start', 'middle', 'end', 'inherit'], value);
    }
  }),

  /**
    Vertical aligment for text (`"top"`, `"middle"`, `"bottom"`)

    @property verticalAlign
    @type String
    @default "middle"
  */
  verticalAlign: property({
    default_value: 'middle',
    validate: function(value) {
      return contains(['top', 'middle', 'bottom'], value);
    }
  }),

  /**
    Style object containing styles for text

    @property style
    @type Object
    @default {}
  */
  style: property({
    default_value: {},
    get: function(value) {
      return style(value) || null;
    }
  }),

  onDataBind: function onDataBind(selection) {
    return selection.selectAll('text')
      .data([0]);
  },
  onInsert: function onInsert(selection) {
    return selection.append('text');
  },
  onMerge: function onMerge(selection) {
    selection
      .attr('transform', this.transformation())
      .attr('style', this.style())
      .attr('text-anchor', this.anchor())
      .attr('class', this.options()['class'])
      .text(this.text());
  },

  transformation: function() {
    var x = {
      left: 0,
      center: this.width() / 2,
      right: this.width()
    }[this.textAlign()];
    var y = {
      top: 0,
      middle: this.height() / 2,
      bottom: this.height()
    }[this.verticalAlign()];

    var translation = translate(x, y);
    var rotation = rotate(this.rotation());

    return translation + ' ' + rotation;
  }
}, {
  z_index: 70
});

function textOptions(id, options, default_options) {
  if (!options) {
    options = id;
    id = undefined;
  }
  if (isString(options))
    options = {text: options};

  return extend({id: id}, default_options, options);
}

function text(id, options) {
  return textOptions(id, options, {type: 'Text'});
}

d3.chart().Text = Text;
export {
  Text as default,
  text,
  textOptions
};
