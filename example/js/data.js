(function(global, _, data) {
  'use strict';

  // === START FIXTURES
  // DISCLAIMER This fixture data is just for example and should not be used for reference
  data.example = {}
  var store = data.example.store = new data.Store();

  // Setup FIXTURE
  store.FIXTURE = {
    meta: {
      year: {range: [2000, 2050], increment: 5},
      x: {range: [0, 100], round: true, increment: 5},
      a: {range: [0, 100], round: true, count: 2},
      b: {range: [1000, 10000], round: true, count: 2},
      c: {range: [0, 1000], round: true, count: 4},
      d: {range: [0, 1], round: false},
      gender: {choices: ['male', 'female']}
    },
    createRow: function() {
      var newRow = {};
      var rows = store.rows();
      var previousRow = rows[rows.length - 1];

      _.each(this.meta, function(options, key) {
        var choices = options.choices || [];
        var min = options.range ? options.range[0] : 0;
        var max = options.range ? options.range[1] : 1;
        var count = options.count || 1;
        var itemKey;

        for (var i = 0; i <= count; i += 1) {
          itemKey = (count > 1) ? key + i : key;

          if (options.increment) {
            if (previousRow) {
              newRow[itemKey] = previousRow[itemKey] + options.increment;
            }
            else {
              newRow[itemKey] = min;
            }
          }
          else if (choices.length) {
            newRow[itemKey] = choices[Math.floor(Math.random() * choices.length)];
          }
          else if (options.round) {
            newRow[itemKey] = Math.floor(Math.random() * (max - min + 1) + min);
          }
          else {
            newRow[itemKey] = Math.random() & (max - min) + min;
          }
        }
      });

      return newRow;
    },
    setup: function(cache) {
      _.each(cache, function(rows, filename) {
        store.data(filename).raw = store.data(filename).values = rows;
      });
    }
  };

  // Load fixture rows manually
  store.FIXTURE.setup({
    'chart1.csv': [
      {year: 2000, input: 14, normalizedInput: 22, output: 1563, normalizedOutput: 2000},
      {year: 2005, input: 23, normalizedInput: 35, output: 3127, normalizedOutput: 3000},
      {year: 2010, input: 35, normalizedInput: 45, output: 4690, normalizedOutput: 5000},
      {year: 2015, input: 58, normalizedInput: 75, output: 7817, normalizedOutput: 6000},
      {year: 2020,                                 output: 0,    normalizedOutput: 8000}
    ],

    'chart2.csv': [
      {year: 2000, a: 0, b: 0, c: 0, d: 0},
      {year: 2005, a: 50, b: 20, c: 10, d: 80},
      {year: 2010, a: 80, b: 40, c: 30, d: 120},
      {year: 2015, a: 90, b: 45, c: 35, d: 130},
      {year: 2020, a: 100, b: 50, c: 40, d: 140}
    ]
  });

  // Create separate denormalizers by filename
  data.example.denormalize = {
    /*
      Raw: year, input, normalizedInput, output, normalizedOutput
      Denormalize (at store level):
        year -> transform('Year ' + (year - 2000)) -> x
        input, normalizedInput, output, normalizedOutput -> y, {
          input: {input: true, output: false, normalized: false},
          normalizedInput: {input: true, output: false, normalized: true},
          output: {input: false, output: true, normalized: false},
          normalizedOutput: {input: false, output: true, normalized: true},
        }
        
        x, y, input, output, normalized, _filename = chart1.csv
    */
    'chart1.csv': store._generateDenormalize({
      x: 'relativeYear',
      y: {
        columns: ['input', 'normalizedInput', 'output', 'normalizedOutput'],
        categories: {
          input: {input: true, output: false, normalized: false},
          normalizedInput: {input: true, output: false, normalized: true},
          output: {input: false, output: true, normalized: false},
          normalizedOutput: {input: false, output: true, normalized: true}
        }
      }
    }),

    /*
      Raw: year, a, b, c, d
      Denormalize (at store level):
        year -> x
        a, b, c, d -> y, 'type'
        
        x, y, type (a, b, c, d), _filename = chart2.csv
    */
    'chart2.csv': store._generateDenormalize({
      x: 'year',
      y: {
        columns: ['a', 'b', 'c', 'd'],
        category: 'type'
      }
    })
  };

  // Add relative year to all rows
  store.normalize(function(row) {
    row.relativeYear = 'Year ' + ((row.year - 2000) / 5 + 1);
    return row;
  });

  // Denormalize all rows (by filename)
  store.denormalize(function(row) {
    return data.example.denormalize[row.__filename](row);
  });

  // === END FIXTURES

})(this, _, data);
