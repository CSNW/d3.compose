import d3 from 'd3';
import {
  assign,
  isUndefined
} from '../utils';
import {
  alignText,
  getTranslate,
  prepareTransition,
  types
} from '../helpers';
import {
  createSeriesDraw,
  properties as seriesProperties
} from '../mixins/series';
import {
  ORIGINAL_Y,
  getValue,
  prepare as xyPrepare,
  properties as xyProperties
} from '../mixins/xy';
import chart from '../chart';

/**
  Labels
*/
export const Labels = createSeriesDraw({
  prepare: xyPrepare,

  select({seriesValues, key}) {
    return this.selectAll('g')
      .data(seriesValues, key);
  },

  enter() {
    const group = this.append('g');

    group.append('rect')
      .attr('class', 'd3c-label-bg');
    group.append('text')
      .attr('class', 'd3c-label-text');
  },

  merge(props) {
    const {className, style, format, yValue, transition} = props;

    // Write text before calculating layout
    this
      .attr('class', className)
      .style(style) // TODO Applies to all labels, update for (d, i)
      .select('text')
        .text((d, i) => getText(format, yValue, d, i));

    const layout = calculateLayout(this, props);

    this
      .attr('opacity', 0)
      .call(applyLayout(layout));

    this.transition().call(prepareTransition(transition))
      .attr('opacity', 1);
  }
});

Labels.properties = assign({},
  seriesProperties,
  xyProperties,
  {
    className: types.any,
    style: types.any,
    format: types.any,
    position: types.any,
    offset: types.any,
    padding: types.any,
    anchor: types.any,
    alignment: types.any
  }
);

/**
  labels
*/
const labels = chart(Labels);
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
  const labels = [];

  selection.each(function(d, i, j) {
    if (!labels[j]) {
      labels[j] = [];
    }

    const label = prepareLabel(this, props, d, i, j);
    labels[j].push(label);
  });

  // TODO Collision detection

  return labels;
}

export function applyLayout(layout) {
  return function() {
    this.each(function(d, i, j) {
      const label = layout[j][i];
      const group = d3.select(this);

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
  const {xValue, xScale, yValue, yScale} = props;
  const textElement = d3.select(element).select('text').node();

  const x = getValue(xValue, xScale, d, i, j);
  const y = getValue(yValue, yScale, d, i, j);
  const layout = calculateLabelLayout(textElement, x, y, props);

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
  const {padding = 0, anchor, alignment} = props;
  const offset = assign({x: 0, y: 0}, props.offset);

  const textBounds = textElement.getBBox();
  const width = textBounds.width + (2 * padding);
  const height = textBounds.height + (2 * padding);
  const layout = {x, y, width, height};

  // Adjust text to be top-aligned (default is baseline)
  const textYAdjustment = alignText(textElement);

  // Adjust x, y by anchor/alignment
  if (anchor == 'end') {
    layout.x -= layout.width;
  } else if (anchor == 'middle') {
    layout.x -= (layout.width / 2);
  }

  if (alignment == 'bottom') {
    layout.y -= layout.height;
  } else if (alignment == 'middle') {
    layout.y -= (layout.height / 2);
  }

  layout.bg = {
    x: offset.x,
    y: offset.y,
    width,
    height
  };

  layout.text = {
    x: offset.x + (layout.width / 2) - (textBounds.width / 2),
    y: offset.y + (layout.height / 2) - (textBounds.height / 2) + textYAdjustment
  };

  return layout;
}
