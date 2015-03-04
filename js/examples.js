(function(d3) {

  var helpers = d3.chart.helpers;
  var mixins = d3.chart.mixins;

  // Example 1: Line
  var example_1 = d3.select('.js-chart').append('svg')
    .chart('Multi', function(data) {
      var scales = {
        x: {data: data, key: 'x'},
        y: {data: data, key: 'y'}
      };

      return {
        charts: {
          line: {type: 'Line', data: data, xScale: scales.x, yScale: scales.y, interpolate: 'monotone'}
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

})(d3);