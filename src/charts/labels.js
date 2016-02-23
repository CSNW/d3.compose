import d3 from 'd3';
import {
  assign,
  isFunction,
  isNumber,
  isUndefined
} from '../utils';
import {
  alignText,
  createPrepare,
  createSeriesDraw,
  getTranslate,
  getValue,
  prepareTransition,
  types
} from '../helpers';
import series from '../mixins/series';
import xy, {ORIGINAL_Y} from '../mixins/xy';
import chart from '../chart';

/**
  Labels chart for single or series xy data

  @example
  ```js
  // Automatic scaling and labels use given y-values
  labels({data: [1, 2, 3]});

  // Use 'label' in data to specify label text
  labels({
    data: [
      {x: 0, y: 1, label: 'a'},
      {x: 1, y: 2, label: 'b'},
      {x: 2, y: 3, label: 'c'}
    ]
  });

  // Full example
  labels({
    // Series values
    data: [
      {values: [{a: 1, b: 10}, {a: 2, b: 20}, {a: 3, b: 30}]},
      {values: [{a: 1, b: 30}, {a: 2, b: -10}, {a: 3, b: 10}]}
    ],
    xValue: d => d.a,
    yValue: d => d.b,
    xScale: d3.scale.linear().domain([1, 3]),
    yScale: d3.scale.linear().domain([-30, 30]),

    // Format string passed to d3.format, formats y-value or label
    // (or pass in custom function)
    format: '.1f',

    // Position relative to the data point
    // (right for y >= 0, left for y < 0)
    position: 'right|left',

    offset: {x: 10, y: 5},
    padding: 10,
    anchor: d => d >= 0 ? 'start' : 'end',
    alignment: 'top'
  });
  ```
*/
export var Labels = createSeriesDraw({
  prepare: createPrepare(series.prepare, xy.prepare),

  select: function select(props) {
    return this.selectAll('g')
      .data(props.seriesValues, props.key);
  },

  enter: function enter() {
    var group = this.append('g');

    group.append('rect')
      .attr('class', 'd3c-label-bg');
    group.append('text')
      .attr('class', 'd3c-label-text');
  },

  merge: function merge(props) {
    // Write text before calculating layout
    this
      .attr('class', props.className)
      .style(props.style) // TODO Applies to all labels, update for (d, i)
      .select('text')
        .text(function(d, i) {
          return getText(props.format, props.yValue, d, i);
        });

    var layout = calculateLayout(this, props);

    this
      .attr('opacity', 0)
      .call(applyLayout(layout));

    this.transition().call(prepareTransition(props.transition))
      .attr('opacity', 1);
  }
});

Labels.properties = assign({},
  series.properties,
  xy.properties,
  {
    className: types.any,
    style: types.any,

    /**
      Format function or string (that is passed to `d3.format`) that is passed label values.
      (label value = d.label or y-value)

      @property format
      @type String|Function
    */
    format: types.any,

    /**
      Label position relative to data point
      (top, right, bottom, or left)

      Additionally, `(a)|(b)` can be used to set position to `a` if y-value >= 0 and `b` otherwise,
      where `a` and `b` are `top`, `right`, `bottom`, or `left`

      For more advanced positioning, a "di" function can be specified to set position per label

      @example
      ```js
      labels({position: 'top'}); // top for all values
      labels({position: 'top|bottom'}); // top for y-value >= 0, bottom otherwise
      labels({position: d => d.x >= 0 ? 'right' : 'left'});
      ```

      @property position
      @type String|Function
      @default 'top|bottom'
    */
    position: {
      type: types.any,
      getDefault: function() { return 'top|bottom'; }
    },

    /**
      Offset between data point and label
      (if `Number` is given, offset is set based on position)

      @example
      ```js
      // 5px x-offset between point and label
      labels({position: 'right', offset: 5});

      // 5px x 10px offset between point and label
      labels({offset: {x: 5, y: 10}})
      ```
      @property offset
      @type Number|Object
      @default 0
    */
    offset: {
      type: types.any,
      getDefault: function() { return 0; }
    },

    /**
      Padding between text and label background

      @property padding
      @type Number
      @default 1
    */
    padding: {
      type: types.number,
      getDefault: function() { return 1; }
    },

    /**
      Horizontal text anchor (start, middle, or end)

      @property anchor
      @type String
      @default (set based on label position)
    */
    anchor: types.enum('start', 'middle', 'end'),

    /**
      Vertical text alignment (top, middle, or bottom)

      @property alignment
      @type String
      @default (set based on label position)
    */
    alignment: types.enum('top', 'middle', 'bottom')
  }
);

/**
  labels
*/
var labels = chart(Labels);
export default labels;

// Helpers
// -------

export function getText(format, yValue, d, i) {
  var value;
  if (d && !isUndefined(d.label)) {
    value = d.label;
  } else if (d && !isUndefined(d[ORIGINAL_Y])) {
    value = d[ORIGINAL_Y];
  } else {
    value = yValue(d, i);
  }

  return format ? format(value) : value;
}

export function calculateLayout(selection, props) {
  var labels = [];

  selection.each(function(d, i, j) {
    if (!labels[j]) {
      labels[j] = [];
    }

    var label = prepareLabel(this, props, d, i, j);
    labels[j].push(label);
  });

  // TODO Collision detection

  return labels;
}

export function applyLayout(layout) {
  return function() {
    this.each(function(d, i, j) {
      var label = layout[j][i];
      var group = d3.select(this);

      group
        .attr('transform', getTranslate(label.x, label.y))
      group.select('text')
        .attr('transform', getTranslate(label.text.x, label.text.y));
      group.select('rect')
        .attr('transform', getTranslate(label.bg.x, label.bg.y))
        .attr('width', label.bg.width)
        .attr('height', label.bg.height);
    });
  };
}

export function prepareLabel(element, props, d, i, j) {
  var labelProps = getProps(props, element, d, i, j);
  var textElement = d3.select(element).select('text').node();

  var x = getValue(props.xValue, props.xScale, d, i, j);
  var y = getValue(props.yValue, props.yScale, d, i, j);
  var layout = calculateLabelLayout(textElement, x, y, labelProps);

  return {
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
    text: layout.text,
    bg: layout.bg
  };
}

export function calculateLabelLayout(textElement, x, y, props) {
  var textBounds = textElement.getBBox();
  var width = textBounds.width + (2 * props.padding);
  var height = textBounds.height + (2 * props.padding);
  var layout = {x: x, y: y, width: width, height: height};

  // Adjust text to be top-aligned (default is baseline)
  var textYAdjustment = alignText(textElement);

  // Adjust x, y by anchor/alignment
  if (props.anchor == 'end') {
    layout.x -= layout.width;
  } else if (props.anchor == 'middle') {
    layout.x -= (layout.width / 2);
  }

  if (props.alignment == 'bottom') {
    layout.y -= layout.height;
  } else if (props.alignment == 'middle') {
    layout.y -= (layout.height / 2);
  }

  layout.bg = {
    x: props.offset.x,
    y: props.offset.y,
    width: width,
    height: height
  };

  layout.text = {
    x: props.offset.x + (layout.width / 2) - (textBounds.width / 2),
    y: props.offset.y + (layout.height / 2) - (textBounds.height / 2) + textYAdjustment
  };

  return layout;
}

export function getProps(props, element, d, i, j) {
  // Load values for position, offset, padding, anchor, and alignment
  var position = props.position;
  var offset = props.offset;
  var padding = props.padding;
  var anchor = props.anchor;
  var alignment = props.alignment;

  // Position
  if (isFunction(position)) {
    position = position.call(element, d, i, j);
  }
  if (position && position.indexOf('|') >= 0) {
    var parts = position.split('|');
    var y = props.yValue(d, i, j);
    position = y >= 0 ? parts[0] : parts[1];
  }

  // Offset
  if (isNumber(offset)) {
    offset = {
      top: {x: 0, y: -offset},
      right: {x: offset, y: 0},
      bottom: {x: 0, y: offset},
      left: {x: -offset, y: 0}
    }[position];
  }
  offset = assign({x: 0, y: 0}, offset);

  // Padding
  if (isFunction(padding)) {
    padding = padding.call(element, d, i, j);
  }

  // Anchor
  if (isFunction(anchor)) {
    anchor = anchor.call(element, d, i, j);
  } else if (isUndefined(anchor)) {
    anchor = {
      top: 'middle',
      right: 'start',
      bottom: 'middle',
      left: 'end'
    }[position];
  }

  // Alignment
  if (isFunction(alignment)) {
    alignment = alignment.call(element, d, i, j);
  } else if (isUndefined(alignment)) {
    alignment = {
      top: 'bottom',
      right: 'middle',
      bottom: 'top',
      left: 'middle'
    }[position];
  }

  return {position: position, offset: offset, padding: padding, anchor: anchor, alignment: alignment};
}
