import d3 from 'd3';
import {
  assign,
  isFunction
} from '../utils';
import {
  createPrepare,
  createSeriesDraw,
  getTranslate,
  getValue,
  types
} from '../helpers';
import series from '../mixins/series';
import xy from '../mixins/xy';
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
export var Scatter = createSeriesDraw({
  prepare: createPrepare(series.prepare, xy.prepare),

  select: function select(props) {
    return this.selectAll('g')
      .data(props.seriesValues, props.key);
  },

  enter: function enter() {
    var group = this.append('g');
    group.append('path');
  },

  merge: function merge(props) {
    this
      .attr('transform', function(d, i, j) {
        var x = getValue(props.xValue, props.xScale, d, i, j);
        var y = getValue(props.yValue, props.yScale, d, i, j);
        return getTranslate(x, y);
      });

    var symbol;
    if (isFunction(props.type) || isFunction(props.size)) {
      symbol = function(d, i, j) {
        var typeFn = isFunction(props.type) ? props.type : function() { return props.type; };
        var sizeFn = isFunction(props.size) ? props.size : function() { return props.size; };
        return d3.svg.symbol()
          .type(typeFn.call(this, d, i, j))
          .size(sizeFn.call(this, d, i, j))(d, i, j);
      }
    } else {
      symbol = d3.svg.symbol().type(props.type).size(props.size);
    }

    this.select('path')
      .attr('d', symbol);
  }
});

Scatter.properties = assign({},
  series.properties,
  xy.properties,
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
      getDefault: function() { return 'circle'; }
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
      getDefault: function() { return 64; }
    }

    // TODO className
    // TODO style
  }
);

var scatter = chart(Scatter);
export default scatter;
