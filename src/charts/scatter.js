import d3 from 'd3';
import {
  assign,
  isFunction
} from '../utils';
import {
  types,
  createPrepare,
  getTranslate
} from '../helpers';
import {
  createSeriesDraw,
  properties as seriesProperties
} from '../mixins/series';
import {
  getValue,
  prepare as xyPrepare,
  properties as xyProperties
} from '../mixins/xy';
import chart from '../chart';

/**
  Scatter chart for single or series xy data.

  @example
  ```js
  // Automatic scaling with circles
  scatter({data: [1, 2, 3]})

  // Full example
  scatter({
    // Series values
    data: [
      {values: [{a: 1, b: 10}, {a: 2, b: 20}, {a: 3, b: 30}]},
      {values: [{a: 1, b: 30}, {a: 2, b: -10}, {a: 3, b: 10}]}
    ],

    xValue: d => d.a,
    yValue: d => d.b,
    xScale: d3.scale.linear().domain([1, 3]),
    yScale: d3.scale.linear().domain([-30, 30]),
    size: d => 64 * d.scale,
    type: 'diamond'
  });
  ```
  @class Scatter
*/
export const Scatter = createSeriesDraw({
  prepare: createPrepare(xyPrepare),

  select({seriesValues, key}) {
    return this.selectAll('g')
      .data(seriesValues, key);
  },

  enter() {
    const group = this.append('g');
    group.append('path');
  },

  merge({xValue, yValue, xScale, yScale, type, size}) {
    this
      .attr('transform', (d, i, j) => {
        const x = getValue(xValue, xScale, d, i, j);
        const y = getValue(yValue, yScale, d, i, j);
        return getTranslate(x, y);
      });

    var symbol;
    if (isFunction(type) || isFunction(size)) {
      symbol = function(d, i, j) {
        const typeFn = isFunction(type) ? type : () => type;
        const sizeFn = isFunction(size) ? size : () => size;
        return d3.svg.symbol()
          .type(typeFn.call(this, d, i, j))
          .size(sizeFn.call(this, d, i, j))(d, i, j);
      }
    } else {
      symbol = d3.svg.symbol().type(type).size(size);
    }

    this.select('path')
      .attr('d', symbol);
  }
});

Scatter.properties = assign({},
  seriesProperties,
  xyProperties,
  {
    /**
      Symbol type for data points

      - See [symbol.type](https://github.com/mbostock/d3/wiki/SVG-Shapes#symbol_type)

      @example
      ```js
      scatter({type: 'diamond'});

      // By series index
      scatter({type: (d, i, j) => d3.svg.symbolTypes[j]});
      ```
      @property type
      @type String|Function
      @default 'circle'
    */
    type: {
      type: types.any,
      getDefault: () => 'circle'
    },

    /**
      Symbol size (in square pixels)

      - See [symbol.size](https://github.com/mbostock/d3/wiki/SVG-Shapes#symbol_size)

      @example
      ```js
      scatter({size: 128});

      // From data
      scatter({size: d => 64 * d.scale});
      ```
      @property size
      @type Number
      @default 64
    */
    size: {
      type: types.number,
      getDefault: () => 64
    }

    // TODO className
    // TODO style
  }
);

const scatter = chart(Scatter);
export default scatter;
