(function(d3, _, RSVP, global) {
  'use strict';

  // Attach properties to global data object
  var data = global.data = {};

  /**
    Store
    Generic data store with async load, cast, map, and query
  */
  var Store = data.Store = function Store() {
    this.subscriptions = [];
    this.loading = [];
    this.errors = [];

    // Initialize data cache
    this._cache = {};

    // Load types from static
    this.types = _.clone(Store.types);

    // Set default cast and map functions
    this._cast = this._generateCastByFilename({default: function(row) { return row; }});
    this._map = this._generateMapByFilename({default: function(row) { return row; }});
  };

  // Type converters for cast
  Store.types = {
    'Number': function(value) { return +value; },
    'Boolean': function(value) {
      return _.isString(value) ? value.toUpperCase() === 'TRUE' : (value === 1 || value === true);
    },
    'String': function(value) { return _.isUndefined(value) ? '' : '' + value; },
    'Date': function(value) { return new Date(value); }
  };

  _.extend(Store.prototype, {
    /**
      Load current data in store (sync)

      @param {String} [path]
      @return {Object}
    */
    cache: function(path) {
      // Initialize cache for path (if needed)
      if (path && !this._cache[path]) {
        this._cache[path] = {
          meta: {filename: path},
          raw: [],
          values: []
        };
      }

      // Return path or all of data
      return path ? this._cache[path] : this._cache;
    },

    /**
      Load values in store (once currently loading is complete)
      
      @return {Promise}
    */
    values: function() {
      return this.ready().then(function(store) {
        return store.cache();
      });
    },

    /**
      Load file(s) into store with options

      @param {String|Array} path(s) to csv
      @param {Object} [options]
      @return {Promise}
    */
    load: function load(path, options) {
      var paths = _.isArray(path) ? path : [path];
      
      // Generate _cast and _map
      options = options || {};
      if (options.cast)
        options._cast = this._generateCast(options.cast);
      if (options.map)
        options._map = this._generateMap(options.map);

      // 1. Load from path (cache or csv)
      var loading = RSVP.all(_.map(paths, function(path) {
        return this._load(path, options);
      }, this));

      // 2. Process rows
      // 3. Catch errors
      // 4. Finally remove
      loading = loading
        .then(this._doneLoading.bind(this, paths, options))
        .catch(this._errorLoading.bind(this, paths, options))
        .finally(function() {
          this.loading = _.without(this.loading, loading);
        }.bind(this));

      // Add to loading (treat this.loading as immutable array)
      this.loading = this.loading.concat([loading]);

      return loading;
    },

    /**
      Subscribe to changes from store

      @param {Function} callback to call with (data, event: name, store)
      @param {Object} [context]
      @return {Subscription}
    */
    subscribe: function(callback, context) {
      // Create new subscription
      var subscription = new Subscription(callback, context);
      this.subscriptions.push(subscription);

      if (!this.loading.length) {
        subscription.trigger(this.cache(), {name: 'existing', store: this});
      }

      return subscription;
    },

    /**
      Register cast options/iterator to be called on every incoming row (before map)
      (e.g. Convert from strings to useful data types)
      
      @param {Object|Function} options or iterator
      @chainable
    */
    cast: function cast(options) {
      this._cast = this._generateCastByFilename({default: options});
      this._process();

      return this;
    },

    /**
      Register cast options/iterator to be called on every incoming row, by filename

      @param {Object|Function} options or iterator
      - As object: {filenameA: {options by key or iterator}, filenameB: ..., default: ...}
      - As iterator: function(filename, row) {return cast row}
      @chainable
    */
    castByFilename: function castByFilename(options) {
      this._cast = this._generateCastByFilename(options);
      this._process();

      return this;
    },

    /**
      Register map option/iterator to be called with every incoming row

      @param {Object|Function} options or iterator
      - Example
        {
          x: 'year' // (row.year -> row.x)
          y: {
            columns: ['a', 'b', 'c'],
            category: 'type' // row.a -> row.y, row.type = 'a'
          },
          z: {
            columns: ['d', 'e'],
            categories: {
              d: {isD: true, isE: false},
              e: {isD: false, isE: true} // row.d -> row.z, isD: true, isE: false
            }
          }
        }
      @chainable
    */
    map: function map(options) {
      this._map = this._generateMapByFilename({default: options});
      this._process();

      return this;
    },

    /**
      Register map options/iterator to be called with every incoming row by filename

      @param {Object|Function} options or iterator
      - As object (filanameA: {options or iterator}, filenameB: ..., default: ...},
      - As iterator: function(filename, row) {return mapped row}
      @chainable
    */
    mapByFilename: function mapByFilename(options) {
      this._map = this._generateMapByFilename(options);
      this._process();

      return this;
    },

    /**
      Create new query of data store

      @param {Object} config to pass to query
      @return {Query}
    */
    query: function query(options) {
      return new Query(this, options);
    },

    /**
      Promise that resolves when currently loading completes

      @return {Promise}
    */
    ready: function ready() {
      return RSVP.all(this.loading).then(function() { 
        return this;
      }.bind(this));
    },

    // Notify subscribers with current data
    _notify: function _notify(name) {
      _.each(this.subscriptions, function(subscription) {
        subscription.trigger(this.cache(), {name: name, store: this});
      }, this);
    },

    // Process all data
    _process: function _process() {
      _.each(this.cache(), function(cache, path) {
        cache.values = this._processRows(cache.raw, cache.meta);
      }, this);
    },

    // Process given rows
    _processRows: function _processRows(rows, options) {
      var castFn = (options && options._cast) || this._cast.bind(this, options.filename);
      var mapFn = (options && options._map) || this._map.bind(this, options.filename);

      // Cast and map rows
      var cast = _.flatten(_.map(rows, castFn, this), true);
      var mapped = _.flatten(_.map(cast, mapFn, this), true);

      return mapped;
    },

    // Generate map function for options
    _generateMap: function _generateMap(options) {
      options = options || {};
      if (_.isFunction(options)) return options;

      function resolveFromRowOrMapped(row, mapped, key) {
        var value = resolve(row, key);
        if (_.isUndefined(value)) {
          value = resolve(mapped, key);
        }

        return value;
      }

      return function _map(row) {
        var mappedRows = [{}];
        var keys = [];
        _.each(options, function(option, to) {
          mappedRows = _.compact(_.flatten(_.map(mappedRows, function(mapped) {
            if (_.isObject(option)) {
              // Add columns to keys
              keys = keys.concat(option.columns);

              // Split columns into rows
              return _.map(option.columns, function(from) {
                var value = resolveFromRowOrMapped(row, mapped, from);
                if (!_.isUndefined(value)) {
                  var newRow = _.extend({}, mapped);
                  newRow[to] = value;

                  if (option.categories) {
                    _.extend(newRow, option.categories[from] || {});
                  }
                  else {
                    newRow[option.category || '__yColumn'] = from;
                  }

                  return newRow;
                }
                else {
                  return null;
                }
              });
            }
            else {
              keys.push(option);
              mapped[to] = resolveFromRowOrMapped(row, mapped, option);
              return mapped;
            }
          }), true));
        });

        // Copy non-mapped keys (except for "blank" keys)
        var copy = _.pick(row, _.difference(_.keys(row), keys, ['']));
        if (copy) {
          _.each(mappedRows, function(mapped) {
            _.extend(mapped, copy);
          });
        }

        return mappedRows;
      };
    },

    _generateMapByFilename: function _generateMapByFilename(options) {
      if (_.isFunction(options)) {
        return options;
      }
      else {
        options = _.defaults(options || {}, {default: {}});
        _.each(options, function(option, key) {
          options[key] = this._generateMap(option);
        }, this);

        return function _mapByFilename(filename, row) {
          if (options[filename]) {
            return options[filename](row);
          }
          else {
            return options['default'](row);
          }
        };
      }
    },

    _generateCast: function _generateCast(options) {
      if (_.isFunction(options)) return options;

      var types = this.types;
      return function _cast(row) {
        _.each(options, function(type, key) {
          var cast = _.isFunction(type) ? type : types[type];
          if (cast)
            row[key] = cast(row[key]);
        });

        return row;
      };
    },

    _generateCastByFilename: function _generateCastByFilename(options) {
      if (_.isFunction(options)) {
        return options;
      }
      else {
        options = _.defaults(options || {}, {default: {}});
        _.each(options, function(option, key) {
          options[key] = this._generateCast(option);
        }, this);

        return function _castByFilename(filename, row) {
          if (options[filename]) {
            return options[filename](row);
          }
          else {
            return options['default'](row);
          }
        };
      }
    },

    // Load (with caching)
    _load: function _load(path, options) {
      var cache = this.cache(path);

      if (cache.meta.loaded) {
        return new RSVP.Promise(function(resolve) { resolve(cache.raw); });
      }
      else if (cache.meta.loading) {
        return cache.meta.loading;
      }
      else {
        var loading = this._loadCsv(path).then(function(values) {
          cache.meta.loaded = new Date();
          return values;
        }).finally(function() {
          delete cache.meta.loading;
        });

        cache.meta.loading = loading;
        return loading;
      }
    },

    // Load csv from given path
    _loadCsv: function _loadCsv(path) {
      return new RSVP.Promise(function(resolve, reject) {
        d3.csv(path).get(function(err, rows) {
          if (err) return reject(err);
          resolve(rows);
        });
      });
    },

    // Handle loading finished (successfully)
    _doneLoading: function _doneLoading(paths, options, rows) {
      // Process rows for each path
      _.each(paths, function(path, index) {
        var cache = this.cache(path);

        // Store options
        _.extend(cache.meta, options);

        // Store raw rows
        cache.raw = rows[index];

        // Store processed rows
        cache.values = this._processRows(rows[index], cache.meta);
      }, this);

      this._notify('load');
      return this.cache();
    },

    // Handle loading error
    _errorLoading: function _errorLoading(paths, options, err) {
      this.errors.push({paths: paths, options: options, error: err});
    }
  });

  /**
    Query
    Perform query on data store and get formatted series data
    
    Input:
    (Denormalized rows/tables)
    x, y, type, a, b, c

    Output:
    (Flattened array of objects with metadata and values)
    [
      {meta..., values: [...]},
      {meta..., values: [...]},
      {meta..., values: [...]},
      {meta..., values: [...]}
    ]

    Example:
    var query = {
      from: ['chart-1.csv', 'chart-2.csv'],
      filter: {
        // by key
        // ---
        // compare directly: a === true
        a: true, 

        // comparison: $gt, $gte, $lt, $lte, $ne, $in, $nin
        // b > 10 AND b < 100
        b: {$gt: 10, $lt: 100} 
        
        // compare with logical
        // c > 10 OR c < 100
        c: {$or: {$gt: 10, $lt: 100}}

        // by logical
        // ---
        $and: {a: 10, b: 20}, 
        $or: {c: 30, d: 40}, 
        $not: {e: false}, 
        $nor: {f: -10, g: {$in: ['a', 'b', 'c']}}}
      }
    }

    @param {Store} store instance to query
    @param {Object} [query] to run
  */
  var Query = data.Query = function Query(store, query) {
    this.store = store;
    this.subscriptions = [];

    this._query = query;
    this._values = [];

    // Subscribe to store changes and recalculate on change
    this._subscription = this.store.subscribe(function() {
      if (this.calculating) return;

      this.calculate().then(function() {
        this._notify('calculated');  
      }.bind(this));
    }, this);
  };

  _.extend(Query.prototype, {
    /**
      Get results of query

      @return {Promise}
    */
    values: function values() {
      if (this.calculating) {
        return this.calculating;
      }
      else {
        return new RSVP.Promise(function(resolve) { resolve(this._values); }.bind(this));
      }
    },

    /**
      Subscribe to changes in query results (including load)

      @param {Function} callback to call with (values, event: name, query, store)
      @param {Object} [context]
      @return {Subscription}
    */
    subscribe: function subscribe(callback, context) {
      var subscription = new Subscription(callback, context);
      this.subscriptions.push(subscription);

      if (!this.calculating) {
        subscription.trigger(this._values, {name: name, store: this.store, query: this});
      }

      return subscription;
    },

    /**
      Calculate results of query

      Steps:
      1. from
      2. preprocess (rows)
      3. filter
      4. groupBy
      5. reduce
      6. postprocess (meta, values)
      7. series

      @return {Promise}
    */
    calculate: function calculate() {
      var query = this._query;
      var from = (_.isString(query.from) ? [query.from] : query.from) || [];

      this.calculating = this.store.load(from).then(function(data) {
        // 1. from
        var rows = _.reduce(data, function(memo, cache, filename) {
          if (!from.length || _.contains(from, filename)) {
            return memo.concat(cache.values);
          }
          else {
            return memo;
          }
        }, []);

        // 2. preprocess
        if (_.isFunction(query.preprocess)) {
          rows = query.preprocess(rows);
        }

        // 3. filter
        if (query.filter) {
          if (_.isFunction(query.filter)) {
            rows = _.filter(rows, query.filter);
          }
          else {
            rows = _.filter(rows, function(row) {
              return matcher(query.filter, row);
            });
          }
        }

        // 4. groupBy
        var results = this._groupBy(rows, query.groupBy);

        // 5. reduce
        results = this._reduce(results, query.reduce);

        // 6. postprocess
        if (_.isFunction(query.postprocess)) {
          _.each(results, function(result) {
            result.values = query.postprocess(result.values, result.meta);
          });
        }

        // 7. series
        results = this._series(results, query.series);

        // Remove calculating
        delete this.calculating;
        
        // Store and return values
        this._values = results;
        return this._values;
      }.bind(this));

      return this.calculating;
    },

    /**
      Notify subscribers of changes

      @param {String} name of event
    */
    _notify: function(name) {
      _.each(this.subscriptions, function(subscription) {
        subscription.trigger(this._values, {name: name, store: this.store, query: this});
      }, this);
    },

    /**
      Internal implmentation of groupBy
      
      @param {Array} rows
      @param {String|Array|Object} key or keys array or key function object to group by
      - 'key' -> meta: group: {key: 'value'}
      - ['keyA', 'keyB'] -> meta: {keyA: 'value', keyB: 'value'},
      - {keyA: function(row) {...}, keyB: function(row) {...}} -> meta: {keyA: 'value', keyB: 'value'}
      @return {Array}
    */
    _groupBy: function(rows, groupBy) {
      if (!groupBy) {
        return [{meta: {}, values: rows}];
      }
      else {
        if (_.isString(groupBy)) {
          groupBy = [groupBy];
        }
        if (_.isArray(groupBy)) {
          groupBy = _.object(groupBy, _.map(groupBy, function(key) {
            return function(row) {
              return row[key];
            };
          }));
        }

        var grouped = [];
        _.each(rows, function(row, index, rows) {
          // Determine meta for row
          var meta = {};
          _.each(groupBy, function(group, key) {
            meta[key] = group(row, index, rows);
          });

          // Find group by meta (create if not found)
          var group = _.find(grouped, function(group) {
            return _.isEqual(group.meta, meta);
          });
          if (!group) {
            group = {meta: meta, values: []};
            grouped.push(group);
          }

          // Add row to group
          group.values.push(row);
        });

        return grouped;
      }
    },

    /**
      Internal implementation of reduce

      @param {Array} results
      @param {Object} reduce
      @return {Array}
    */
    _reduce: function(results, reduce) {
      if (reduce) {
        var approaches = {
          avg: function(values, column) {
            return approaches.sum(values, column) / values.length;
          },
          sum: function(values, column) {
            return _.reduce(values, function(memo, value) {
              return 0 + memo + value[column];
            }, 0);
          }
        };

        _.each(results, function(result) {
          var reduced = {};

          if (_.isFunction(reduce.iterator)) {
            reduced = _.reduce(result.values, reduce.iterator, reduce.memo || {});
            result.values = [reduced];
          }
          else if (reduce.byColumn) {
            _.each(reduce.byColumn, function(approach, column) {
              reduced[column] = approaches[approach](result.values, column);
            });

            result.values = [reduced];
          }
          else if (reduce.columns && reduce.approach) {
            _.each(reduce.columns, function(column) {
              reduced[column] = approaches[reduce.approach](result.values, column);
            });

            result.values = [reduced];
          }
        });
      }

      return results;
    },

    /**
      Internal implementation of series

      @param {Array} results
      @param {Array} series definitions (by meta)
      @return {Array}
    */
    _series: function(results, series) {
      if (!series) {
        // Create series defaults
        _.each(results, function(result, index) {
          result.key = 'series-' + index;
          result.name = _.reduce(result.meta, function(memo, value, key) {
            var description = key + '=' + value;
            return memo.length ? memo + ', ' + description : description;
          }, '');
        });
      }
      else {
        results = _.map(series, function(series) {
          // Find matching result and load values for series
          var result = _.find(results, function(result) {
            return matcher(result.meta, series.meta);
          });

          series.values = (result && result.values) || [];
          return series;
        });
      }

      return results;
    }
  });

  /**
    Subscription
    Disposable subscription
    
    @param {Function} callback to call
    @param {Object} [context] to use for callback
  */
  var Subscription = data.Subscription = function Subscription(callback, context) {
    this.callback = callback;
    this.context = context;

    this._disposed = false;
  };

  _.extend(Subscription.prototype, {
    /**
      Stop listening to changes
    */
    dispose: function dispose() {
      this._disposed = true;
    },

    /**
      Directly trigger subscription
    */
    trigger: function() {
      if (!this._disposed)
        this.callback.apply(this.context || null, arguments);
    }
  });

  /**
    Matching helper for advanced querying

    @param {Object} query
    @param {Object} row
    @param {String} [lookup] (lookup value for recursion)
    @returns {Boolean}
  */
  var matcher = data.matcher = function matcher(query, row, lookup) {
    function value(key, item) {
      var operation = logical[key] || comparison[key];
      if (operation) return operation(item);

      // If query is given for row key, match recursively with lookup
      // otherwise compare with equals
      var isQuery = _.isObject(item) && !(item instanceof Date) && !_.isArray(item);
      if (isQuery) return matcher(item, row, key);
      else return _.isEqual(resolve(row, key), item);
    }

    var logical = {
      '$and': function(query) {
        return _.reduce(query, function(result, item, key) {
          return result && value(key, item);
        }, true);
      },
      '$or': function(query) {
        return _.reduce(query, function(result, item, key) {
          return result || value(key, item);
        }, false);
      },
      '$not': function(query) {
        return !logical['$and'](query);
      },
      '$nor': function(query) {
        return _.reduce(query, function(result, item, key) {
          return result && !value(key, item);
        }, true);
      }
    };
    var comparison = {
      '$gt': function(value) {
        return resolve(row, lookup) > value;
      },
      '$gte': function(value) {
        return resolve(row, lookup) >= value;
      },
      '$lt': function(value) {
        return resolve(row, lookup) < value;
      },
      '$lte': function(value) {
        return resolve(row, lookup) <= value;
      },
      '$in': function(value) {
        return _.indexOf(value, resolve(row, lookup)) >= 0;
      },
      '$ne': function(value) {
        return resolve(row, lookup) !== value;
      },
      '$nin': function(value) {
        return _.indexOf(value, resolve(row, lookup)) === -1;
      }
    };

    return logical['$and'](query);
  };

  /**
    Resolve data from row by key

    @param {Object} row
    @param {String} key
  */
  var resolve = data.resolve = function resolve(row, key) {
    if (!row) return;
    if (row[key]) return row[key];

    var parts = key.split('.');
    return _.reduce(parts, function(memo, part) {
      return memo && memo[part];
    }, row);
  };

  /**
    Attach "global" store to d3
  */
  d3.data = new Store();

})(d3, _, RSVP, this);
