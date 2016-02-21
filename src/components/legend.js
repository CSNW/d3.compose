import d3 from 'd3';
import {
  alignText,
  createDraw,
  stack,
  getTranslate,
  types
} from '../helpers';
import component from '../component';

/**
  Legend component

  @class Legend
*/
export var Legend = createDraw({
  select: function select(props) {
    return this.selectAll('.d3c-legend-group')
      .data(props.data || [], props.key);
  },

  enter: function enter(props) {
    var group = this.append('g')
      .attr('class', 'd3c-legend-group');

    // TODO width/height per data item
    group.append('g')
      .attr('width', props.swatchDimensions.width)
      .attr('height', props.swatchDimensions.height)
      .attr('class', 'd3c-legend-swatch');
    group.append('text')
      .attr('class', 'd3c-legend-label');

    group.append('rect')
      .attr('class', 'd3c-legend-hover')
      .style({visibility: 'hidden'});
  },

  merge: function merge(props) {
    var swatchWidth = props.swatchDimensions.width;
    var swatchHeight = props.swatchDimensions.height;

    // Swatch: Remove existing swatch, set class, and create swatch
    var swatch = this.select('.d3c-legend-swatch');
    swatch.selectAll('*').remove();
    swatch
      .attr('class', swatchClass)
      .each(createSwatch(Legend.swatches, props.swatchDimensions));

    // Label: Set text and vertically center
    this.select('.d3c-legend-label')
      .text(labelText)
      .attr('transform', function() {
        var offset = alignText(this, swatchHeight);
        return getTranslate(swatchWidth + 5, offset);
      });

    // Position legend items after positioning swatch/label
    this.call(stack({
      direction: props.stackDirection,
      origin: 'top',
      padding: 5,
      minHeight: swatchHeight,
      minWidth: swatchWidth
    }));

    // Position hover listeners
    var sizes = [];
    this.each(function() {
      var bbox = {
        width: swatchWidth,
        height: swatchHeight
      };
      try {
        bbox = this.getBBox();
      } catch (ex) {}

      sizes.push(bbox);
    });
    this.select('.d3c-legend-hover')
      .attr('width', function(d, i) { return sizes[i].width; })
      .attr('height', function (d, i) { return sizes[i].height; })
      .attr('transform', function(d, i) {
        var transform = null;
        if (sizes[i].height > swatchHeight) {
          var offset = (sizes[i].height - swatchHeight) / 2;
          transform = getTranslate(0, -offset);
        }

        return transform;
      });
  }
});

export var defaultStackDirection = 'vertical';
export var defaultSwatchDimensions = {width: 20, height: 20};

Legend.properties = {
  /**
    Direction to "stack" legend, `'vertical'` or `'horizontal'`.

    @property stackDirection
    @type String
    @default 'vertical'
  */
  stackDirection: {
    type: types.enum('vertical', 'horizontal'),
    getDefault: function() { return defaultStackDirection; }
  },

  /**
    Dimensions of "swatch" in px

    @property swatchDimensions
    @type Object
    @default {width: 20, height: 20}
  */
  swatchDimensions: {
    type: types.object,
    getDefault: function() { return defaultSwatchDimensions; }
  }
};

Legend.swatches = {
  'default': function(swatchDimensions) {
    this.append('circle')
      .attr('cx', swatchDimensions.width / 2)
      .attr('cy', swatchDimensions.height / 2)
      .attr('r', d3.min([swatchDimensions.width, swatchDimensions.height]) / 2)
      .attr('class', 'd3c-swatch');
  }
};

Legend.registerSwatch = function(types, create) {
  if (!Array.isArray(types)) {
    types = [types];
  }

  types.forEach(function(type) {
    this.swatches[type] = create;
  })
};

var legend = component(Legend);
export default legend;

// Helpers
// -------

export function key(d) {
  return d.key;
}

export function swatchClass(d) {
  return 'd3c-legend-swatch' + (d['class'] ? ' ' + d['class'] : '');
}

export function labelText(d) {
  return d.text;
}

export function createSwatch(swatches, swatchDimensions) {
  return function(d, i, j) {
    var swatch = d && d.type && swatches[d.type] || swatches['default'];
    if (!swatch) {
      return;
    }

    var selection = d3.select(this);
    swatch.call(selection, swatchDimensions, d, i, j);
  }
}
