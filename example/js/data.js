(function(global, _) {
  'use strict';

  global.data = {
    'chart-1': {
      input: [
        {key: 'input', name: 'Input', values: [
          {x: 2000, y: 14},
          {x: 2005, y: 23},
          {x: 2010, y: 35},
          {x: 2015, y: 58}
        ]},
        {key: 'normalized-input', name: 'Normalized Input', values: [
          {x: 2000, y: 22},
          {x: 2005, y: 35},
          {x: 2010, y: 45},
          {x: 2015, y: 75}
        ]}
      ],
      results: [
        {key: 'results', name: 'Results', values: [
          {x: 2000, y: 1563},
          {x: 2005, y: 3127},
          {x: 2010, y: 4690},
          {x: 2015, y: 7817},
          {x: 2020, y: 0}
        ]},
        {key: 'normalized-results', name: 'Normalized Results', values: [
          {x: 2000, y: 2000},
          {x: 2005, y: 3000},
          {x: 2010, y: 5000},
          {x: 2015, y: 6000},
          {x: 2020, y: 8000}
        ]}
      ]
    },

    'chart-2': {
      lines: [
        {key: 'a', name: 'A', values: [
          {x: 2000, y: 0},
          {x: 2005, y: 50},
          {x: 2010, y: 80},
          {x: 2015, y: 90},
          {x: 2020, y: 100}
        ]},
        {key: 'b', name: 'B', values: [
          {x: 2000, y: 0},
          {x: 2005, y: 20},
          {x: 2010, y: 40},
          {x: 2015, y: 45},
          {x: 2020, y: 50}
        ]},
        {key: 'c', name: 'C', values: [
          {x: 2000, y: 0},
          {x: 2005, y: 10},
          {x: 2010, y: 30},
          {x: 2015, y: 35},
          {x: 2020, y: 40}
        ]},
        {key: 'd', name: 'D', values: [
          {x: 2000, y: 0},
          {x: 2005, y: 80},
          {x: 2010, y: 120},
          {x: 2015, y: 130},
          {x: 2020, y: 140}
        ]},
      ],
      labels: [
        {key: 'labels', name: 'Labels', values: [
          {x: 2020, y: 100, key: 'a'},
          {x: 2020, y: 50, key: 'b'},
          {x: 2020, y: 40, key: 'c'},
          {x: 2020, y: 140, key: 'd'}
        ]}
      ]
    },

    'chart-3': {
      bars: [
        {key: 'a', name: 'A', values: [{y: 10000}]},
        {key: 'b', name: 'B', values: [{y: 20000}]}
      ]
    },

    // Specs
    'spec-1': {
      lines: [
        {
          key: 'a',
          name: 'A',
          values: [
            {x: 0, y: 0},
            {x: 20, y: 20},
            {x: 40, y: 40},
            {x: 60, y: 60},
            {x: 80, y: 80},
            {x: 100, y: 100}
          ]
        },
        {
          key: 'b',
          name: 'B',
          values: [
            {x: 0, y: 100},
            {x: 20, y: 80},
            {x: 40, y: 60},
            {x: 60, y: 40},
            {x: 80, y: 20},
            {x: 100, y: 0}
          ]
        },
        {
          key: 'c',
          name: 'C',
          values: [
            {x: 0, y: 30},
            {x: 20, y: 45},
            {x: 40, y: 50},
            {x: 60, y: 50},
            {x: 80, y: 45},
            {x: 100, y: 30}
          ]
        }
      ]
    }
  };

})(this, _);
