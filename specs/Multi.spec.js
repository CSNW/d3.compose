(function(d3, _, helpers, mixins) {

  describe('Multi', function() {    
    var data = {
      a: [
        {key: 'a1', values: [{x:0,y:100}, {x:25,y:200}, {x:50,y:300}, {x:75,y:500}]},
        {key: 'a2', values: [{x:0,y:-100}, {x:25,y:-200}, {x:50,y:-300}, {x:100,y:-800}]}
      ],
      b: [
        {key: 'b', values: [{x:-10,y:1}, {x:-20,y:2}, {x:-30,y:3}, {x:-40,y:4}]}
      ],
      c: [
        {key: 'c', values: [{x:-10,y:1}, {x:-20,y:2}, {x:-30,y:3}, {x:-40,y:4}]}
      ]
    };
    var values = {
      a: [
        {key: 'a1', values: [{x:'a',y:100}, {x:'b',y:200}, {x:'c',y:300}, {x:'d',y:500}]},
        {key: 'a2', values: [{x:'a',y:-100}, {x:'b',y:-200}, {x:'c',y:-300}, {x:'e',y:-800}]}
      ],
      b: [
        {key: 'b', values: [{x:'-a',y:1}, {x:'-b',y:2}, {x:'-c',y:3}, {x:'-d',y:4}]}
      ],
      c: [
        {key: 'c', values: [{x:'-a',y:1}, {x:'-b',y:2}, {x:'-c',y:3}, {x:'-d',y:4}]}
      ]
    };
    var chart, fixture, selection, configuration;

    function setupChart(config) {
      chart = selection.chart('Multi', config);

      _.each(chart.axes(), function(axis) {
        axis.setScales();
      });

      return chart;
    }

    beforeEach(function() {
      fixture = setFixtures('<div id="chart"></div>');
      selection = d3.select('#chart')
        .append('svg');

      configuration = {
        type: 'Values',
        charts: [
          {type: 'Bars', dataKey: 'a'},
          {type: 'Line', dataKey: 'b'}
        ],
        axes: {
          x: {scale: {type: 'ordinal', domain: ['a', 'b', 'c'], roundRangeBands: [[0, 600]]}},
          y: {scale: {domain: [0, 1000], range: [400, 0]}}
        },
        legend: {},
        title: ''
      };

      setupChart(configuration);
    });

    describe('axes', function() {
      
    });

    describe('data', function() {
      
    });
  });

})(d3, _, d3.chart.helpers, d3.chart.mixins);
