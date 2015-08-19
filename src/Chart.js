import Base from './Base';

/**
  Common base for creating charts.
  Standard `d3.chart` charts can be used with d3.compose, but extending `d3.chart('Chart')` includes helpers for properties and "di" functions.

  ### Extending

  To take advantage of "di"-binding (automatically injects `chart` into "di" methods)
  and automatically setting properties from `options`, use `d3.compose.helpers.di`
  and `d3.compose.helpers.property` when creating your chart.

  @example
  ```js
  var helpers = d3.compose.helpers;

  d3.chart('Chart').extend('Pie', {
    initialize: function() {
      // same as d3.chart
    },
    transform: function(data) {
      // same as d3.chart
    },

    color: helpers.di(function(chart, d, i) {
      // "di" function with parent chart injected ("this" = element)
    }),

    centered: helpers.property({
      default_value: true
      // can be automatically set from options object
    })
  });
  ```
  @class Chart
  @extends Base
*/
var Chart = Base.extend({}, {
  /**
    Default z-index for chart
    (Components are 50 by default, so Chart = 100 is above component by default)

    @example
    ```js
    d3.chart('Chart').extend('BelowComponentLayers', {
      // ...
    }, {
      z_index: 40
    });
    ```
    @attribute z_index
    @static
    @type Number
    @default 100
  */
  z_index: 100,
  layer_type: 'chart'
});

d3.chart().Chart = Chart;
export default Chart;
