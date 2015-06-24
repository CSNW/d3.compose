(function(examples, d3, helpers, mixins) {

// Line
examples.line = {};
examples.line.options = function(data) {
  var scales = {
    x: {data: data, key: 'x'},
    y: {data: data, key: 'y'}
  };

  return {
    charts: {
      line: {
        type: 'Lines',
        data: data,
        xScale: scales.x,
        yScale: scales.y,
        interpolate: 'monotone'
      }
    },
    components: {
      'axis.x': {
        type: 'Axis',
        position: 'bottom',
        scale: scales.x,
        ticks: 5
      },
      'axis.y': {
        type: 'Axis',
        position: 'left',
        scale: scales.y,
        ticks: 5
      },
      title: {
        type: 'Title',
        position: 'top',
        text: 'Line Chart',
        'class': 'chart-title-main',
        margins: {top: 4, bottom: 4}
      }
    }
  };
};
examples.line.data = [
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
];

// Line-Bar Values
examples['line-bar-values'] = {};
examples['line-bar-values'].options = function(data) {
  var input = data.input;
  var results = data.results;
  var scales = {
    x: {type: 'ordinal', data: results, key: 'x', adjacent: true},
    y: {data: input, key: 'y'},
    y2: {data: results, key: 'y', domain: [0, 100]}
  };

  return d3.compose.xy({
    charts: {
      input: {
        type: 'Lines',
        data: input,
        xScale: scales.x,
        yScale: scales.y
      },
      results: {
        type: 'Bars',
        data: results,
        xScale: scales.x,
        yScale: scales.y2
      }
    },
    axes: {
      x: {
        scale: scales.x
      },
      y: {
        scale: scales.y,
        title: 'Input'
      },
      y2: {
        scale: scales.y2,
        title: 'Results'
      }
    },
    title: {
      text: 'Input vs. Output'
    }
  });
};
examples['line-bar-values'].data = {
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
};

})(examples, d3, d3.compose.helpers, d3.compose.mixins);
