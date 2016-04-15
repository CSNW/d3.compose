import d3 from 'd3';
import {
  assign,
  isUndefined
} from '../utils';
import {
  createPrepare,
  createSeriesDraw,
  getValue,
  types
} from '../helpers';
import series from '../mixins/series';
import xy from '../mixins/xy';
import connect from '../connect';
import chart from '../chart';

/**
  Lines chart for single or series xy data.

  @example
  ```js
  // Automatic scaling
  lines({data: [1, 2, 3]});

  // Full example
  lines({
    // Series values
    data: [
      {values: [{a: 1, b: 10}, {a: 2, b: 20}, {a: 3, b: 30}]},
      {values: [{a: 1, b: 30}, {a: 2, b: -10}, {a: 3, b: 10}]}
    ],

    xValue: d => d.a,
    yValue: d => d.b,
    xScale: d3.scale.linear().domain([1, 3]),
    yScale: d3.scale.linear().domain([-30, 30]),
    interpolate: 'cardinal',
    tension: 0.5
  });
  ```
  @class Lines
*/
export var Lines = createSeriesDraw({
  prepare: createPrepare(series.prepare, xy.prepare),

  select: function select(props) {
    return this.selectAll('path')
      .data(function(d, i, j) {
        return [props.seriesValues.call(this, d, i, j)];
      }, props.key);
  },

  enter: function enter() {
    this.append('path');
  },

  merge: function merge(props) {
    var line = d3.svg.line()
      .x(function(d, i, j) {
        return getValue(props.xValue, props.xScale, d, i, j);
      })
      .y(function(d, i, j) {
        return getValue(props.yValue, props.yScale, d, i, j);
      });

    if (props.interpolate) {
      line.interpolate(props.interpolate);
    }
    if (!isUndefined(props.tension)) {
      line.tension(props.tension);
    }

    this
      .attr('d', function(d) { return line(d); })
      .attr('class', 'd3c-line');
  }
});

Lines.properties = assign({},
  series.properties,
  xy.properties,
  {
    /**
      Set interpolation mode for line

      - See [line.interpolate](https://github.com/mbostock/d3/wiki/SVG-Shapes#line_interpolate)
      - Set to `null` or `'linear'` for no interpolation

      @property interpolate
      @type String|Function
      @default monotone
    */
    interpolate: {
      type: types.any,
      getDefault: function() { return 'monotone'; }
    },

    /**
      Set tension (Cardinal spline interpolation tension) for line

      - See [line.tension](https://github.com/mbostock/d3/wiki/SVG-Shapes#line_tension)

      @property tension
      @type Number
      @default d3.line default (0.7)
    */
    tension: {
      type: types.number,
      getDefault: function() { return null; }
    }
  }
);

// Connection
// ----------

// TODO Connect to dispatch closest points
export var connection = connect.map();

// lines
var lines = connection(chart(Lines));
export default lines;
