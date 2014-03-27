(function(global) {
  var data = global.data = {
    chart1: {
      deathsPrevented: [{
        key: 'deathsPrevented',
        name: 'CRC Deaths prevented',
        values: [
          {key: '1 year program', y: 12},
          {key: '2 year program', y: 23},
          {key: '3 year program', y: 35},
          {key: '5 year program', y: 58}
        ],
        'class': 'deaths-prevented'
      }],
      peopleParticipating: [{
        key: 'peopleParticipating',
        name: 'People participating',
        values: [
          {key: '1 year program', y: 1563},
          {key: '2 year program', y: 3127},
          {key: '3 year program', y: 4690},
          {key: '5 year program', y: 7817}
        ]
      }, {
        key: 'bars2',
        name: 'Bars 2',
        values: [
          {key: '1 year program', y: 1000},
          {key: '2 year program', y: 2000},
          {key: '3 year program', y: 4000},
          {key: '5 year program', y: 8000},
        ]
      }]
    }
  };
})(this);
