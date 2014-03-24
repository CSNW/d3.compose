(function(global) {
  var data = global.data = {
    chart1: {
      deathsPrevented: [{
        key: 'deathsPrevented',
        values: [
          {key: '1 year program', y: 12},
          {key: '2 year program', y: 23},
          {key: '3 year program', y: 35},
          {key: '5 year program', y: 58}
        ]
      }],
      peopleParticipating: [{
        key: 'peopleParticipating',
        values: [
          {key: '1 year program', y: 1563},
          {key: '2 year program', y: 3127},
          {key: '3 year program', y: 4690},
          {key: '5 year program', y: 7817}
        ]
      }],
      legend: [
        {key: 'deathsPrevented', value: 'CRC Deaths prevented'},
        {key: 'peopleParticipating', value: 'People participating'}
      ]
    }
  };
})(this);
