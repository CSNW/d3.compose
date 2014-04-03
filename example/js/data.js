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
    },

    chart2: {
      lines: [{
        key: 'a',
        name: 'Series A',
        values: [
          {x: 2000, y: 0},
          {x: 2005, y: 50},
          {x: 2010, y: 80},
          {x: 2015, y: 90},
          {x: 2020, y: 100}
        ]
      }, {
        key: 'b',
        name: 'Series B',
        values: [
          {x: 2000, y: 0},
          {x: 2005, y: 20},
          {x: 2010, y: 40},
          {x: 2015, y: 45},
          {x: 2020, y: 50}
        ]
      }, {
        key: 'c',
        name: 'Series C',
        values: [
          {x: 2000, y: 0},
          {x: 2005, y: 10},
          {x: 2010, y: 30},
          {x: 2015, y: 35},
          {x: 2020, y: 40}
        ]
      }, {
        key: 'd',
        name: 'Series D',
        values: [
          {x: 2000, y: 0},
          {x: 2005, y: 80},
          {x: 2010, y: 120},
          {x: 2015, y: 130},
          {x: 2020, y: 140}
        ]
      }],
      labels: [{
        key: 'labels',
        name: 'Labels',
        values: [
          {x: 2019, y: 100, key: 'a'},
          {x: 2019, y: 50, key: 'b'},
          {x: 2019, y: 40, key: 'c'},
          {x: 2019, y: 140, key: 'd'}
        ]
      }]
    },

    chart3: {
      bars: [
        {
          key: 'a',
          name: 'Series A',
          values: [{x: 0, y: 14707}]
        },
        {
          key: 'b',
          name: 'Series B',
          values: [{x: 0, y: 28295}]
        }
      ]
    }
  };
})(this);
