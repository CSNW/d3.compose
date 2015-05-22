(function($) {
  $(document.body).scrollspy({
    target: '.docs-sidebar'
  });

  $('.docs-sidebar').affix({
    offset: {
      top: 50
    }
  });
}(jQuery));

(function(d3) {

  var helpers = d3.compose.helpers;
  var mixins = d3.compose.mixins;

  // Example 1: Line
  var example_1 = d3.select('#js-example-1').append('svg')
    .chart('Compose', function(data) {
      var scales = {
        x: {data: data, key: 'x'},
        y: {data: data, key: 'y'}
      };

      return {
        charts: {
          line: {type: 'Lines', data: data, xScale: scales.x, yScale: scales.y, interpolate: 'monotone'}
        },
        components: {
          'axis.x': {type: 'Axis', position: 'bottom', scale: scales.x, ticks: 5},
          'axis.y': {type: 'Axis', position: 'left', scale: scales.y, ticks: 5},
          title: {type: 'Title', position: 'top', text: 'Line Chart', margins: {top: 0.5, bottom: 0.4}}
        }
      };
    })
    .margins({top: 0, right: 15, bottom: 5, left: 5});

  example_1.draw([
    {
      key: 'a', values: [
        {x: 0, y: 10}, {x: 10, y: 20}, {x: 20, y: 50}, {x: 30, y: 100}
      ]
    },
    {
      key: 'b', values: [
        {x: 0, y: 50}, {x: 10, y: 45}, {x: 20, y: 15}, {x: 30, y: 10}
      ]
    }
  ]);

  // Example 2: XY Extension
  var example_2 = d3.select('#js-example-2').append('svg')
    .chart('Compose', function(data) {
      var scales = {
        x: {data: data, key: 'x'},
        y: {data: data, key: 'y'}
      };

      return d3.compose.xy({
        charts: {
          line: {type: 'Lines', data: data, xScale: scales.x, yScale: scales.y, interpolate: 'monotone'}
        },
        axes: {
          x: {scale: scales.x, ticks: 5},
          y: {scale: scales.y, ticks: 5}
        },
        title: {text: 'Line Chart', margins: {top: 0.5, bottom: 0.5}}
      });
    })
    .margins({top: 0, right: 15, bottom: 5, left: 5});

  example_2.draw([
    {
      key: 'a', values: [
        {x: 0, y: 10}, {x: 10, y: 20}, {x: 20, y: 50}, {x: 30, y: 100}
      ]
    },
    {
      key: 'b', values: [
        {x: 0, y: 50}, {x: 10, y: 45}, {x: 20, y: 15}, {x: 30, y: 10}
      ]
    }
  ]);

  // Example 3: Line-Bar Values
  var example_3 = d3.select('#js-example-3').append('svg')
    .chart('Compose', function(data) {
      var input = data.input;
      var results = data.results;
      var scales = {
        x: {type: 'ordinal', data: input, key: 'x'},
        y: {data: input, key: 'y'},
        y2: {data: results, key: 'y', domain: [0, 100]}
      };

      return d3.compose.xy({
        charts: {
          input: {type: 'Lines', data: input, xScale: scales.x, yScale: scales.y},
          results: {type: 'Bars', data: results, xScale: scales.x, yScale: scales.y2}
        },
        axes: {
          x: {type: 'Axis', position: 'bottom', scale: scales.x},
          y: {position: 'left', scale: scales.y, title: 'Input'},
          y2: {position: 'right', scale: scales.y2, title: 'Results'}
        },
        title: {text: 'Input vs. Output', margins: {top: 0.5, bottom: 0.5}}
      });
    })
    .margins({top: 0, right: 15, bottom: 5, left: 5});

  example_3.draw({
    input: [
      {
        key: 'input',
        values: [{x: 'a', y: 100}, {x: 'b', y: 200}, {x: 'c', y: 300}]
      }
    ],
    results: [
      {
        key: 'run-1',
        values: [{x: 'a', y: 10}, {x: 'b', y: 30}, {x: 'c', y: 20}]
      },
      {
        key: 'run-2',
        values: [{x: 'a', y: 15}, {x: 'b', y: 25}, {x: 'c', y: 20}]
      }
    ]
  });

  // Example 4: Custom Chart
  d3.chart('Chart').extend('Dots', helpers.mixin(mixins.Series, mixins.XY, {
    initialize: function() {
      // seriesLayer wraps series functionality
      // so that standard layer approach can be used
      this.seriesLayer('Dots', this.base.append('g').classed('chart-dots', true), {
        dataBind: function(data) {
          return this.selectAll('circle')
            .data(data, this.chart().keyValue);
        },
        insert: function() {
          return this.append('circle');
        },
        events: {
          merge: function() {
            var chart = this.chart();
            this
              .attr('cx', chart.x)
              .attr('cy', chart.y)
              .attr('r', chart.r);
          }
        }
      });
    },

    // helpers.di binds chart to "di" functions
    // so that "this" refers to the element (as expected)
    r: helpers.di(function(chart, d, i) {
      return chart.rValue();
    }),

    // helpers.property creates get/set property
    rValue: helpers.property('rValue', {
      default_value: 5
    })
  }));

  example_4 = d3.select('#js-example-4').append('svg')
    .chart('Compose', function(data) {
      var scales = {
        x: {data: data, key: 'x'},
        y: {data: data, key: 'y'}
      };

      return {
        charts: {
          line: {type: 'Lines', data: data, xScale: scales.x, yScale: scales.y},
          dots: {type: 'Dots', data: data, xScale: scales.x, yScale: scales.y}
        }
      }
    })
    .margins({top: 25, right: 15, bottom: 10, left: 15});

  example_4.draw([
    {
      key: 'a',
      values: [{x: 0, y: 10}, {x: 10, y: 100}, {x: 50, y: 0}]
    },
    {
      key: 'b',
      values: [{x: 50, y: 10}, {x: 30, y: 70}, {x: 0, y: 0}]
    }
  ]);

  // Example 5: Custom Component
  d3.chart('Component').extend('Key', {
    initialize: function() {
      this.layer('Key', this.base, {
        dataBind: function(data) {
          return this.selectAll('text')
            .data(data);
        },
        insert: function() {
          return this.append('text');
        },
        events: {
          merge: function() {
            this.text(this.chart().keyText)
          }
        }
      })
    },

    keyText: helpers.di(function(chart, d, i) {
      return d.abbr + ' = ' + d.value;
    })
  });

  var example_5 = d3.select('#js-example-5').append('svg')
    .chart('Compose', function(data) {
      var scales = {
        x: {type: 'ordinal', data: data.values, key: 'x'},
        y: {domain: [0, 20]}
      }

      return d3.compose.xy({
        charts: {
          bars: {type: 'Bars', data: data.values, xScale: scales.x, yScale: scales.y}
        },
        axes: {
          x: {type: 'Axis', scale: scales.x}
        },
        components: {
          key: {type: 'Key', data: data.key, position: 'right'}
        }
      });
    })
    .margins({top: 10, right: 10, bottom: 10, left: 10});

  example_5.draw({
    values: [{
      key: 'a',
      values: [{x: 'js', y: 10}]
    }],
    key: [{abbr: 'js', value: 'javascript'}]
  });

})(d3);
