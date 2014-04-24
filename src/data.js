(function(d3, _, RSVP, global) {
  'use strict';

  // Attach properties to global data object
  var data = global.data = {};

  /**
    Store
    Generic data store with collection of rows
  */
  var Store = data.Store = function Store() {
    this._raw = [];
    this._rows = [];
    
    this.keys = {
      filename: '__filename'
    };
    this.subscriptions = [];
    this.loading = [];
    this.errors = [];

    // Initialize cache
    this.cache = {};

    this._normalize = function(row) { return row; };
    this._denormalize = function(row) { return row; };
  };

  _.extend(Store.prototype, {
    /**
      Get/set rows

      @param {Array} [values]
    */
    rows: function rows(values) {
      if (!arguments.length) return this._rows;

      // Store rows as clone of values
      this._rows = [].concat(values);

      // Notify subscribers
      _.each(this.subscriptions, function(subscription) {
        subscription.trigger(this._rows);
      }, this);
    },

    /**
      Get values from store (asynchromously)

      @param {Function} callback
      @param {Object} [context]
      @chainable
    */
    values: function values(callback, context) {
      this.ready().then(function() {
        callback.call(context || null, this.rows());
      }.bind(this));

      return this;
    },

    /**
      Load csv file into store

      @param {String|Array} path(s) to csv
      @returns {Promise}
    */
    load: function load(path) {
      var paths = _.isArray(path) ? path : [path];

      // 1. Load from path (cache or csv)
      // 2. Process rows
      // 3. Catch errors
      // 4. Finally remove
      var loading = RSVP.all(_.map(paths, this._load, this))
        .then(this._doneLoading.bind(this, paths))
        .catch(this._errorLoading.bind(this, paths))
        .finally(function() {
          // Remove from loading
          this.loading = _.without(this.loading, loading);
        }.bind(this));

      // Add to loading (treat this.loading as immutable array)
      this.loading = this.loading.concat([loading]);

      return loading;
    },

    /**
      Subscribe to changes from store
      - calls initially if data has already been loaded (unless options.existing == false)

      Example:
      ```js
      // some data has already been loaded...
      store.subscribe(function(rows, event) {
        console.log('new rows');
      });
  
      // Subscription is called initially since data has already been loaded
      // -> "new rows"

      store.load('another.csv')
      // ... loads async
      // -> "new rows"

      // turn off initial trigger
      store.subscribe(function(rows, event) {
        console.log('truly only new rows');
      }, {existing: false});

      // nothing logged

      store.load('new.csv')
      // ... loads async
      // -> "new rows"
      // -> "truly only new rows"
      ```

      @param {Function} callback to call with (values, event: name, store)
      @param {Object} [options]
      - existing: [Boolean=true] trigger on existing records
      @returns {Subscription}
    */
    subscribe: function(callback, context, options) {
      options = _.defaults({}, options, {
        existing: true
      });

      // Create new subscription
      var subscription = new Subscription(callback, context);
      this.subscriptions.push(subscription);

      // If trigger on existing, mimic load event for callback
      if (options.existing && !this.loading.length) {
        this.values(function(rows) {
          if (rows.length > 0)
            subscription.trigger(rows);
        });
      }

      return subscription;
    },

    /**
      Register denormalization iterator/option to be called with every incoming row

      @param {Object|Function} options or iterator
      @param {Object} [context] if config is iterator
      @chainable
    */
    denormalize: function denormalize(options, context) {
      if (_.isFunction(options)) {
        // options is iterator
        this._denormalize = function(row) {
          return options.call(context || this, row);
        };
      }
      else {
        // Generate iterator from options
        this._denormalize = this._generateDenormalize(options);
      }

      // Denormalize any existing data
      this._rows = this._processRows(this._raw);

      return this;
    },

    /**
      Register normalization iterator to be called on every incoming row (before denormalization)
      (e.g. Convert from strings to useful data types)
      
      @param {Function} iterator
      @param {Object} [context]
      @chainable
    */
    normalize: function normalize(iterator, context) {
      this._normalize = function(row, index, rows) {
        return iterator.call(context || null, row, index, rows);
      };

      // Normalize any existing data
      this._rows = this._processRows(this._raw);

      return this;
    },

    /**
      Create new query of data store

      @param {Object} config to pass to query
      @returns {Query}
    */
    query: function query(options) {
      return new Query(this, options);
    },

    /**
      Promise that resolves when currently loading completes

      @returns {Promise}
    */
    ready: function ready() {
      return RSVP.all(this.loading);
    },

    // Process given rows
    _processRows: function _processRows(rawRows) {
      var normalized = _.flatten(_.map(rawRows, this._normalize, this), true);
      var denormalized = _.flatten(_.map(normalized, this._denormalize, this), true);

      return denormalized;
    },

    // Generate denormalize function for options
    _generateDenormalize: function _generateDenormalize(options) {
      var xColumn = options.x || 'x';

      // Convert y to standard form (if column or array of columns)
      var yOptions = _.isObject(options.y) ? options.y : {
        category: '__yColumn',
        columns: _.isArray(options.y) ? options.y : [options.y || 'y']
      };

      // setup iterator by options
      return function _denormalize(row) {
        // Perform denomalization by y
        return _.map(yOptions.columns, function(yColumn) {
          // Copy columns from row that aren't used in x or y
          var copyColumns = _.difference(_.keys(row), xColumn, yOptions.columns);
          var normalized = _.pick(row, copyColumns);

          normalized.x = row[xColumn];
          normalized.y = row[yColumn];

          if (yOptions.categories) {
            _.extend(normalized, yOptions.categories[yColumn]);
          }
          else if (yOptions.category) {
            normalized[yOptions.category] = yColumn;
          }

          return normalized;
        });
      };
    },

    // Load (with caching)
    _load: function _load(path) {
      // Check for cache
      var cached = this.cache[path];
      if (cached) {
        if (cached.loading)
          return cached.loading;
        else
          return new RSVP.Promise(function(resolve) { resolve(cached); });  
      }
      else {
        // Load from csv
        var loading = this._loadCsv(path).finally(function() {
          // Remove loading state from cache (on success or fail)
          delete this.cache[path];
        }.bind(this));

        // Store loading state in cache
        this.cache[path] = {
          loading: loading
        };

        return loading;
      }
    },

    // Load rows from given path
    // @returns {Promise}
    _loadCsv: function _loadCsv(path) {
      return new RSVP.Promise(function(resolve, reject) {
        d3.csv(path).get(function(err, rows) {
          if (err) return reject(err);
          resolve(rows);
        });
      });
    },

    // Handle loading finished (successfully)
    _doneLoading: function _doneLoading(paths, rows) {
      // Process rows for each path
      _.each(paths, function(path, index) {
        // Cache
        this.cache[path] = rows[index];

        // Add filename to rows
        _.each(rows[index], function(row) {
          row[this.keys.filename] = path;
        }, this);
      }, this);
      
      // Combine all rows
      rows = _.flatten(rows, true);

      // Store raw and processed
      this._raw = this._raw.concat(rows);
      this.rows(this.rows().concat(this._processRows(rows)));
    },

    // Handle loading error
    _errorLoading: function _errorLoading(paths, err) {
      this.errors.push({paths: paths, error: err});
    }
  });

  /**
    Query
    Perform query on data store and get formatted series data

    @param {Store} store instance to query
  */
  var Query = data.Query = function Query(store, config) {
    this.store = store;
    this.subscriptions = [];

    // Listen to store changes and update results
    // TODO
  };

  _.extend(Query.prototype, {
    /**
      Get resulting series of query

      @param {Function} callback
      @param {Object} [context]
    */
    values: function values(callback, context) {
      // TODO
    },

    /**
      Subscribe to changes in query results (including load)

      @param {Function} callback to call with (values, event: name, query, store)
      @param {Object} [options]
      - {Boolean} [existing=true] trigger on existing records
    */
    subscribe: function subscribe(callback, context, options) {
      options = _.defaults({}, options, {
        existing: true
      });

      var subscription = new Subscription(callback, context);
      this.subscriptions.push(subscription);

      // If trigger on existing and loaded, mimic load event for callback
      if (options.existing) {
        // TODO
        // subscription.trigger(...)
      }

      return subscription;
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

  // === START FIXTURES
  // This fixture data is just for example and should not be used for reference
  data.store = new Store();
  data.store._raw = [
    // chart1.csv


    // chart2.csv


    // chart3.csv

  ];
  data.store.denormalize(function(row, index, rows) {
    // Typically, standard denormalize for every data row, regardless of source
    // but since unrelated data for charts is being used, denormalize by source
    if (row.__filename == 'chart1.csv') {
      return data.store._denormalizeRowByConfig(row, index, rows, {

      });
    }
    else if (row.__filename == 'chart2.csv') {
      return data.store._denormalizeRowByConfig(row, index, rows, {

      });
    }
    else if (row.__filename == 'chart3.csv') {
      return data.store._denormalizeRowByConfig(row, index, rows, {

      });
    }
  });

  // === END FIXTURES

})(d3, _, RSVP, this);
