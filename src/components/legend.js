import d3 from 'd3';
import {isFunction} from '../utils';
import {alignText, createDraw, stack, getTranslate, types} from '../helpers';
import component from '../component';

export const Legend = createDraw({
  select({data}) {
    return this.selectAll('.d3c-legend-group')
      .data(data || [], key);
  },

  enter({swatchDimensions}) {
    const group = this.append('g')
      .attr('class', 'd3c-legend-group');

    // TODO width/height per data item
    group.append('g')
      .attr('width', swatchDimensions.width)
      .attr('height', swatchDimensions.height)
      .attr('class', 'd3c-legend-swatch');
    group.append('text')
      .attr('class', 'd3c-legend-label');

    group.append('rect')
      .attr('class', 'd3c-legend-hover')
      .style({visibility: 'hidden'});
  },

  merge({swatchDimensions, stackDirection}) {
    const swatchWidth = swatchDimensions.width;
    const swatchHeight = swatchDimensions.height;

    // Swatch: Remove existing swatch, set class, and create swatch
    const swatch = this.select('.d3c-legend-swatch');
    swatch.selectAll('*').remove();
    swatch
      .attr('class', swatchClass)
      .each(createSwatch(Legend.swatches, swatchDimensions));

    // Label: Set text and vertically center
    this.select('.d3c-legend-label')
      .text(labelText)
      .attr('transform', function(d, i, j) {
        const offset = alignText(this, swatchHeight);
        return getTranslate(swatchWidth + 5, offset);
      });

    // Position legend items after positioning swatch/label
    this.call(stack({
      direction: stackDirection,
      origin: 'top',
      padding: 5,
      minHeight: swatchHeight,
      minWidth: swatchWidth
    }));

    // Position hover listeners
    const sizes = [];
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
      .attr('width', (d, i) => sizes[i].width)
      .attr('height', (d, i) => sizes[i].height)
      .attr('transform', (d, i) => {
        var transform = null;
        if (sizes[i].height > swatchHeight) {
          const offset = (sizes[i].height - swatchHeight) / 2;
          transform = getTranslate(0, -offset);
        }

        return transform;
      });
  }
});

export const defaultStackDirection = 'vertical';
export const defaultSwatchDimensions = {width: 20, height: 20};

Legend.properties = {
  stackDirection: {
    type: types.enum('vertical', 'horizontal'),
    getDefault: () => defaultStackDirection
  },
  swatchDimensions: {
    type: types.object,
    getDefault: () => defaultSwatchDimensions
  }
};

Legend.swatches = {
  'default': function({width, height}) {
    this.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', d3.min([width, height]) / 2)
      .attr('class', 'd3c-swatch');
  }
};

Legend.registerSwatch = function(types, create) {
  if (!Array.isArray(types)) {
    types = [types];
  }

  types.forEach((type) => {
    this.swatches[type] = create;
  })
};

const legend = component(Legend);
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
    const swatch = d && d.type && swatches[d.type] || swatches['default'];
    if (!swatch) {
      return;
    }

    const selection = d3.select(this);
    swatch.call(selection, swatchDimensions, d, i, j);
  }
}
