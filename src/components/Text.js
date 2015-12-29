import {
  contains,
  extend,
  isString
} from '../utils';
import {
  style,
  translate,
  rotate,
  mixin,

  architecture,
  types,
  createPrepare,
  getLayer,

  createProperties
} from '../helpers';
import Component from '../Component';

/**
  Add text to a chart.

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
var Mixed = mixin(Component, architecture);
var Text = Mixed.extend({
  prepare: createPrepare(
    prepareText
  ),

  render: function() {
    // TODO Move to lifecycle
    this.update(this.base, this.options());

    var layer = getLayer(this.base, 'text')
      .classed('chart-text', true);
    var props = this.prepare();

    drawText(layer, props);
  },

  // === TODO Remove, compatibility with current system
  initialize: function() {
    Mixed.prototype.initialize.apply(this, arguments);
    this.attached = {};
  },
  draw: function() {
    this.render();
  }
  // ===
}, {
  properties: extend({}, Component.properties, {
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
      getDefault: function() {
        return 0;
      }
    },

    /**
      Horizontal text-alignment of text (`"left"`, `"center"`, or `"right"`)

      @property textAlign
      @type String
      @default "center"
    */
    textAlign: {
      type: types.string,
      validate: function(value) {
        return contains(['left', 'center', 'right'], value);
      },
      getDefault: function() {
        return 'center';
      }
    },

    /**
      text-anchor for text (`"start"`, `"middle"`, or `"end"`)

      @property anchor
      @type String
      @default (set by `textAlign`)
    */
    anchor: {
      type: types.string,
      validate: function(value) {
        return contains(['start', 'middle', 'end', 'inherit'], value);
      },
      getDefault: function(selection, props) {
        return {
          left: 'start',
          center: 'middle',
          right: 'end'
        }[props.textAlign];
      }
    },

    /**
      Vertical aligment for text (`"top"`, `"middle"`, `"bottom"`)

      @property verticalAlign
      @type String
      @default "middle"
    */
    verticalAlign: {
      type: types.string,
      validate: function(value) {
        return contains(['top', 'middle', 'bottom'], value);
      },
      getDefault: function() {
        return 'middle';
      }
    },

    /**
      Style object containing styles for text

      @property style
      @type Object
      @default {}
    */
    style: {
      type: types.object,
      getDefault: function() {
        return {};
      }
    }
  }),

  z_index: 70
});

// DEPRECATED Backwards compatibility for properties
createProperties(Text);

function prepareText(selection, props) {
  // Calculate transform
  var x = {
    left: 0,
    center: props.width / 2,
    right: props.width
  }[props.textAlign];
  var y = {
    top: 0,
    middle: props.height / 2,
    bottom: props.height
  }[props.verticalAlign];

  var translation = translate(x, y);
  var rotation = rotate(props.rotation);
  var transform = translation + ' ' + rotation;

  return extend({}, props, {
    transform: transform
  });
}

function drawText(selection, props) {
  var text_selection = selection.selectAll('text');

  if (text_selection.empty())
    text_selection = selection.append('text');

  text_selection
    .attr('transform', props.transform)
    .attr('style', style(props.style))
    .attr('text-anchor', props.anchor)
    .attr('class', props['class'])
    .text(props.text);
}

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

export {
  Text as default,
  text,
  textOptions,
  prepareText,
  drawText
};
