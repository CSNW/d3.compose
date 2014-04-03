(function(global) {
  var data = global.data = {
    chart1: {
      input: [{
        key: 'input',
        name: 'Input',
        values: [
          {key: 'Year 1', y: 12},
          {key: 'Year 2', y: 23},
          {key: 'Year 3', y: 35},
          {key: 'Year 4', y: 58}
        ],
        'class': 'input'
      }],
      results: [{
        key: 'output',
        name: 'Output',
        values: [
          {key: 'Year 1', y: 1563},
          {key: 'Year 2', y: 3127},
          {key: 'Year 3', y: 4690},
          {key: 'Year 4', y: 7817}
        ]
      }, {
        key: 'normalized',
        name: 'Normalized Output',
        values: [
          {key: 'Year 1', y: 2000},
          {key: 'Year 2', y: 3000},
          {key: 'Year 3', y: 5000},
          {key: 'Year 5', y: 8000},
        ]
      }]
    }
  };
})(this);
