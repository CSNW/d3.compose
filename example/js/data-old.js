(function(global, _) {
  'use strict';

  // Attach properties to global data object
  var data = global.data = {};

  /**
    Store
    Generic data store with collection of rows
    includes events, add, remove, load, normalize, etc

    (Similar to Backbone.Collection)

    var store = new data.Store();
    store.normalize(function(row) {
      row.avg = (row.a + row.b) / 2;
      return row;
    });
  */
  var Store = data.Store = function Store() {
    this.raw = [];
    this._rows = [];

    this._normalize = function(row, index, rows) { return row; };
    this._filter = function(row, index, rows) { return true; };
    this._transform = function(row, index, rows) { return row; };
  };

  // TODO Add events
  _.extend(Store.prototype, {
    values: function(callback) {
      this._processRows();
      var rows = this._rows;

      _.defer(function() {
        callback(rows);
      }, this);
    },

    /**
      Normalize all raw data as it comes in
    */
    normalize: function normalize(iterator, context) {
      this._normalize = function(row, index, rows) {
        return iterator.call(context || this, row, index, rows);
      };

      return this;
    },

    /**
      Filter all data
    */
    filter: function filter(iterator, context) {
      this._filter = function(row, index, rows) {
        return iterator.call(context || this, row, index, rows);
      };

      return this;
    },

    /**
      Transform all data before it is returned
    */
    transform: function transform(iterator, context) {
      this._transform = function(row, index, rows) {
        return iterator.call(context || this, row, index, rows);
      };

      return this;
    },

    /**
      subset
      Get subset of data store to work with
    */
    subset: function subset() {
      return new Subset(this);
    },
    
    /**
      Process data
    */
    _processRows: function _processRows() {
      // 1. Normalize all data
      this._rows = _.map(this.raw, this._normalize);

      // 2. Remove empty rows
      this._rows = _.compact(_.flatten(this._rows));

      // 3. Add index to rows
      _.each(this._rows, function(row, index, rows) {
        row.index = row.index || index;
      });

      // 4. Filter rows
      this._rows = _.filter(this._rows, this._filter);

      // 5. Transform returned rows
      this._rows = _.map(this._rows, this._transform);
    }
  });
  
  /**
    Subset
    Work with subset of data store that doesn't propogate changes to store
  */
  var Subset = data.Subset = function Subset(store) {
    this.store = store;
    this.operations = [];

    // TODO investigate better default processing
    this._process = function _process(rows) { return Series(rows); };
  };

  _.extend(Subset.prototype, {
    filter: function(iterator, context) {
      this.operations.push(function(rows) {
        return _.filter(rows, iterator, context || this);
      });

      return this;
    },
    transform: function(iterator, context) {
      this.operations.push(function(rows) {
        var mapped = _.map(rows, iterator, context || this);

        // Shallow flatten in case map returned array for any items
        mapped = _.flatten(mapped, true);

        return mapped;
      });

      return this;
    },
    process: function(processor, context) {
      this._process = function _process(rows) {
        return processor.call(context, rows);
      };

      return this;
    },

    // TODO Add actual promises
    values: function(success, fail) {
      var rows = this.store.values(function(rows) {
        // Perform operations
        _.each(this.operations, function(operation) {
          rows = operation.call(this, rows);
        }, this);

        var processed = this._process(rows);

        success(processed);
      }.bind(this), fail);

      // TODO return promise
      return this;
    },

    /**
      Subscribe to changes in subset and callback when changes occur

      @param {Function} callback when changes occur
      @param {Object} [context] for callback
      @return {Object} subscription with dispose()
    */
    subscribe: function(callback, context) {
      var subscription = {
        callback: callback,
        context: context,
        dispose: function() {
          // TODO
        }
      };

      // TODO register subscriber

      return this;
    }
  });

  /**
    Series
    Work with data store to extract series data
    
    @param {Store} store
  */
  var Series = data.Series = function Series(rows) {
    if (!(this instanceof Series)) return new Series(rows);

    this.raw = rows;
    this.operations = [];

    this._key = function(row, index, rows) { return row.index; };
    this._x = function(row, index, rows) { return row.x; };
    this._y = [{
      yValue: function(row, index, rows) { return row.y; },
      series: {}
    }];
    
    // TODO listen to store changes
  };

  _.extend(Series.prototype, {
    keyJoin: '-',
    nameJoin: ', ',
    joinKeys: function(originalKey, newKey) {
      return _.compact([originalKey, newKey]).join(this.keyJoin);
    },
    joinNames: function(originalName, newName) {
      return _.compact([originalName, newName]).join(this.nameJoin);
    },

    /**
      Filter data store rows

      @param {Function} iterator
      @param {Object} [context]
    */
    filter: function filter(iterator, context) {
      this.operations.push(function(sets) {
        return _.map(sets, function(set) {
          var filtered = _.filter(set, iterator, context || this);
          
          // Transfer set meta
          filtered.key = set.key;
          filtered.name = set.name;

          return filtered;
        }, this);
      });

      return this;
    },

    /**
      Map data store rows

      @param {Function} iterator
      @param {Object} [context]
    */
    transform: function transform(iterator, context) {
      this.operations.push(function(sets) {
        return _.map(sets, function(set) {
          var mapped = _.map(set, iterator, context || this);
          
          // Shallow flatten in case map returned array for any items
          mapped = _.flatten(mapped, true);

          // Transfer set meta
          mapped.key = set.key;
          mapped.name = set.name;

          return mapped;
        }, this);
      });

      return this;
    },

    /**
      Reduce rows to single row

      @param {Function} iterator
      @param {Object} memo
      @param {Object} [context]
    */
    reduce: function reduce(iterator, memo, context) {
      this.operations.push(function(sets) {
        return _.map(sets, function(set) {
          var reduced = [_.reduce(set, iterator, memo, context || this)];

          // Transfer set meta
          reduced.key = set.key;
          reduced.name = set.name;

          return reduced;
        }, this);
      });

      return this;
    },

    /**
      Group data into separate series

      @param {Object|Function|String} options or group value iterator/key
      - {Function|String} groupValue function or string to group by
      - {Object} [series] series options
        - {Function} [key] (given group key, return series key), default is group key
        - {Function} [name] (given group key, return series name), default is capitalized group key
      @param {Object} [context]
    */
    groupBy: function groupBy(options, context) {
      var iterator = _.isObject(options) ? options.groupValue : options;
      var series = _.defaults({}, options.series, {
        key: function(group) { return group; },
        name: function(group) {
          return (group + '').charAt(0).toUpperCase() + (group + '').slice(1);
        }
      });

      this.operations.push(function(sets) {
        var groupedSets = _.map(sets, function(set) {
          var originalKey = set.key;
          var originalName = set.name;
          var grouped = _.groupBy(set, iterator, context || this);

          return _.map(grouped, function(set, groupKey) {
            set.key = this.joinKeys(originalKey, series.key.call(this, groupKey));
            set.name = this.joinNames(originalName, series.name.call(this, groupKey));

            return set;
          }, this);
        }, this);

        // Flatten grouped sets one level
        return _.flatten(groupedSets, true);
      });

      return this;
    },

    /**
      Get key for returned rows

      @param {Function|String} iterator (or object key)
      @param {Object} [context]
    */
    key: function key(iterator, context) {
      this._key = function(row, index, rows) {
        return _.isFunction(iterator) ? iterator.apply(context || this, arguments) : row[iterator];
      };

      return this;
    },

    /**
      Get x-value for returned rows

      @param {Function|String} iterator (or object key)
      @param {Object} [context]
    */
    x: function x(iterator, context) {
      this._x = function(row, index, rows) {
        return _.isFunction(iterator) ? iterator.apply(context || this, arguments) : row[iterator];
      };

      return this;
    },

    /**
      Get y-value for returned rows

      @param {Array|Object|Function|String} iterators array of options / keys (iterator or object key) or options or iterator or object key
        Options:
        - {Function|String} yValue iterator or object key for getting y-value
        - {Object} [series] options for series (key, name)
      @param {Object} [context]
    */
    y: function y(iterators, context) {
      iterators = _.isArray(iterators) ? iterators : [iterators];
      iterators = _.map(iterators, function(iterator, index) {
        iterator = _.isObject(iterator) ? iterator : {yValue: iterator};

        if (!_.isFunction(iterator.yValue)) {
          var key = iterator.yValue;
          iterator.yValue = function(row, index, rows) { return row[key]; };
        }

        iterator.series = iterator.series || {};
        iterator.context = context;
        
        return iterator;
      });

      this._y = iterators;
      return this;
    },

    /**
      Get formatted series object
    */
    value: function value() {
      var sets = [this.raw];

      // TODO Think about cloning rows before performing operations
      _.each(this.operations, function(operation) {
        sets = operation.call(this, sets);
      }, this);

      // Map sets into series
      var allSeries = [];
      _.each(sets, function(set, setIndex) {
        allSeries = allSeries.concat(_.map(this._y, function(iterator, yIndex) {
          var series = {
            key: this.joinKeys(set.key, iterator.series.key),
            name: this.joinNames(set.name, iterator.series.name),
            values: []
          };

          _.each(set, function(row, rowIndex, rows) {
            var yValue = iterator.yValue.call(iterator.context || this, row, rowIndex, rows);
            if (!_.isUndefined(yValue)) {
              series.values.push({
                key: this._key.call(this, row, rowIndex, rows) || ('' + rowIndex),
                x: this._x.call(this, row, rowIndex, rows) || rowIndex,
                y: yValue
              })
            }
          }, this)

          if (!series.key) {
            series.key = sets.length > 1 ? 'series-' + setIndex + '-' + yIndex : 'series-' + yIndex;
          }
          if (!series.name) {
            series.name = 'Series ' + ((setIndex * this._y.length) + yIndex + 1);
          }

          return series;
        }, this));
      }, this);

      return allSeries;
    }
  });

  // === FIXTURES
  // The following fixtures are for testing only
  data.Store.FIXTURE = {
    create: function(meta, count) {
      var store = new data.Store();

      // Setup FIXTURE store
      store.meta = meta;
      store.createRow = function createRow() {
        var newRow = {};
        var rows = this.rows();
        var previousRow = rows[rows.length - 1];

        _.each(this.meta, function(options, key) {
          var choices = options.choices || [];
          var min = options.range ? options.range[0] : 0;
          var max = options.range ? options.range[1] : 1;
          var count = options.count || 1;
          var itemKey;

          for (var i = 1; i <= count; i += 1) {
            itemKey = (count > 1) ? key + i : key;

            if (options.increment) {
              if (previousRow) {
                newRow[itemKey] = previousRow[itemKey] + options.increment;
              }
              else {
                newRow[itemKey] = min;
              }
            }
            else if (options.round) {
              newRow[itemKey] = Math.floor(Math.random() * (max - min + 1) + min);
            }
            else if (choices.length) {
              newRow[itemKey] = choices[Math.floor(Math.random() * choices.length)];
            }
            else {
              newRow[itemKey] = Math.random() * (max - min) + min;
            }
          }
        });

        return newRow;
      }
      store.addRow = function addRow(row) {
        this.addRows([row]);
      };
      store.addRows = function addRows(rows) {
        this.raw = this.raw.concat(rows);
      };
      store.teardown = function teardown() {
        this.raw = [];
        return this;
      };

      _.times(count, function() {
        store.addRow(store.createRow());
      });

      return store;
    }
  };

  // Create store from fixtures
  var store = data.store = data.Store.FIXTURE.create({
    year: {range: [2000, 2050], increment: 5},
    x: {range: [0, 100], round: true, increment: 5},
    a: {range: [0, 100], round: true, count: 2},
    b: {range: [1000, 10000], round: true, count: 2},
    c: {range: [0, 1000], round: true, count: 4},
    d: {range: [0, 1], round: false},
    gender: {choices: ['male', 'female']}
  }, 0);

  store.addRows([
    {year: 2000, a1: 14, a2: 22, b1: 1563, b2: 2000, c1: 0,   c2: 0,  c3: 0,  c4: 0},
    {year: 2005, a1: 23, a2: 35, b1: 3127, b2: 3000, c1: 50,  c2: 20, c3: 10, c4: 80},
    {year: 2010, a1: 35, a2: 45, b1: 4690, b2: 5000, c1: 80,  c2: 40, c3: 30, c4: 120},
    {year: 2015, a1: 58, a2: 75, b1: 7817, b2: 6000, c1: 90,  c2: 45, c3: 35, c4: 130},
    {year: 2020,                 b1: 0,    b2: 8000, c1: 100, c2: 50, c3: 40, c4: 140}
  ]);

  store.normalize(function(row) {

  });

  // === END FIXTURES

  

  data.chart1 = store.subset()
    .transform(function(row) {
      row.yearKey = 'Year ' + (row.year - 2000);
      return row;
    })
    .process(function(rows) {
      return {
        input: Series(rows)
          .x('yearKey')
          .groupBy('gender', series: {name: function(group) {
            return group == 0 ? 'Male' : 'Female';
          }})
          .filter(function(row) {
            return row.category != 'ignore';
          })
          .y('value')
          .y([
            {yValue: 'a1', series: {name: 'Input'}},
            {yValue: 'a2', series: {name: 'Normalized input'}}
          ])
          .value(),

        results: Series(rows)
          .x('yearKey')
          .y([
            {yValue: 'b1', series: {name: 'Output'}},
            {yValue: 'b2', series: {name: 'Normalized Output'}}
          ])
          .value()
      };
    });

  data.chart2 = store.subset()
    .process(function(rows) {
      return {
        lines: Series(rows)
          .x('year')
          .y(['c1', 'c2', 'c3', 'c4'])
          .value(),

        labels: Series(rows)
          .filter(function(row, index, rows) {
            // Only show labels for final values (2020)
            var last = rows[rows.length - 1];
            return row.year == last.year;
          })
          .transform(function(row, index, rows) {
            return [
              {x: row.year - 1, y: row.c1, key: 'c1'},
              {x: row.year - 1, y: row.c2, key: 'c2'},
              {x: row.year - 1, y: row.c3, key: 'c3'},
              {x: row.year - 1, y: row.c4, key: 'c4'}
            ];
          })
          .value()
      };
    });

  data.chart3 = store.subset()
    .process(function(rows) {
      return {
        bars: Series(rows)
          .reduce(function(memo, row, index, rows) {
            return {
              b1Total: memo.b1Total + row.b1,
              b2Total: memo.b2Total + row.b2
            }
          }, {b1Total: 0, b2Total: 0})
          .y(['b1Total', 'b2Total'])
          .value()
      };
    });
})(this, _);
