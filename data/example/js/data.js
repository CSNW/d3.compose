(function(global, _, data) {
  'use strict';

  // === START FIXTURES
  // DISCLAIMER This fixture data is just for example and should not be used for reference

  // Setup FIXTURE
  data.FIXTURE = {
    meta: {
      'chart1.csv': {
        year: {range: [2000, 2050], increment: 5},
        input: {range: [0, 100], round: true},
        normalizedInput: {range: [0, 100], round: true},
        output: {range: [0, 1000], round: true},
        normalizedOutput: {range: [0, 1000], round: true}
      },
      'chart2.csv': {
        year: {range: [2000, 2050], increment: 5},
        a: {range: [0, 200], round: true},
        b: {range: [0, 200], round: true},
        c: {range: [0, 200], round: true},
        d: {range: [0, 200], round: true}
      },
      'chart3.csv': {
        x: {range: [0, 10], increment: 1},
        a: {range: [10000, 20000], round: true},
        b: {range: [10000, 20000], round: true},
      }
    },
    createRow: function(filename) {
      var newRow = {};
      var rows = data.cache(filename).raw;
      var previousRow = rows[rows.length - 1];

      _.each(this.meta[filename], function(options, key) {
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
    addRows: function(count) {
      _.each(this.meta, function(meta, filename) {
        var cache = data.cache(filename);
        _.times(count || 1, function() {
          var row = this.createRow(filename);  
          cache.raw.push(row);
        }, this);
      }, this);

      // Call underlying store helpers to simulate load
      data._process();
      data._notify('load');
    },
    setup: function(cache) {
      _.each(cache, function(options, filename) {
        var cache = data.cache(filename);
        if (options.cast) {
          cache.meta.cast = options.cast
          cache.meta._cast = data._generateCast(options.cast);
        }
        if (options.map) {
          cache.meta.map = options.map;
          cache.meta._map = data._generateMap(options.map);
        }

        cache.meta.loaded = true;
        cache.raw = options.raw || [];
        cache.values = options.values || data._processRows(cache.raw, cache.meta);
      });
    }
  };

  // Load fixture rows manually
  data.FIXTURE.setup({
    'chart1.csv': {
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
      cast: function(row) {
        row.relativeYear = 'Year ' + ((row.year - 2000) / 5 + 1);
        return row;
      },
      map: {
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
      },
      raw: [
        {year: 2000, input: 14, normalizedInput: 22, output: 1563, normalizedOutput: 2000},
        {year: 2005, input: 23, normalizedInput: 35, output: 3127, normalizedOutput: 3000},
        {year: 2010, input: 35, normalizedInput: 45, output: 4690, normalizedOutput: 5000},
        {year: 2015, input: 58, normalizedInput: 75, output: 7817, normalizedOutput: 6000},
        {year: 2020,                                 output: 0,    normalizedOutput: 8000}
      ]
    },

    'chart2.csv': {
      /*
        Raw: year, a, b, c, d
        Denormalize (at store level):
          year -> x
          a, b, c, d -> y, 'type'
          
          x, y, type (a, b, c, d), _filename = chart2.csv
      */
      map: {
        x: 'year',
        y: {
          columns: ['a', 'b', 'c', 'd'],
          category: 'type'
        },
        key: 'type'
      },
      raw: [
        {year: 2000, a: 0, b: 0, c: 0, d: 0},
        {year: 2005, a: 50, b: 20, c: 10, d: 80},
        {year: 2010, a: 80, b: 40, c: 30, d: 120},
        {year: 2015, a: 90, b: 45, c: 35, d: 130},
        {year: 2020, a: 100, b: 50, c: 40, d: 140}
      ]
    },

    'chart3.csv': {
      map: {
        y: {
          columns: ['a', 'b'],
          category: 'type'
        }
      },
      raw: [
        {x: 0, a: 10000, b: 14000}
      ]
    }
  });
  // === END FIXTURES

})(this, _, d3.data);
