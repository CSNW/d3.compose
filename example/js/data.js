(function(global, _) {
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
    this._subscriptions = [];
  };

  _.extend(Store.prototype, {
    /**
      Get rows from store (asynchromously)

      @param {Function} callback
      @param {Object} [context]
    */
    rows: function rows(callback, context) {
      // TODO Actual async (e.g. waiting for load to finish)
      _.defer(function() {
        callback.call(context || null, this._rows);
      }.bind(this));
    },

    /**
      Get current state of store
    */
    state: function state() {
      // TODO determine state by loading/etc.
      return 'loaded';
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
    */
    subscribe: function(callback, context, options) {
      options = _.defaults(options, {
        existing: true
      });

      // Create new subscription (listening to load and remove)
      var subscription = new Subscription(this, ['load', 'remove'], callback, context);
      this._subscriptions.push[subscription];

      // If trigger on existing and loaded, mimic load event for callback
      if (options.existing && this.state() == 'loaded') {
        this.rows(function(rows) {
          subscription.callback(rows, {
            name: 'load',
            store: this
          });
        }, this);
      }

      return subscription;
    },

    /**
      Register denormalization iterator/config to be called with every incoming row

      @param {Object|Function} config or iterator
      @param {Object} [context] if config is iterator
    */
    denormalize: function denormalize(config, context) {
      this._denormalize = {context: context};
      if (_.isFunction(config))
        this._denormalize.iterator = config;
      else
        this._denormalize.config = config;

      // Denormalize any existing data
      this._rows = this._denormalizeRows(this._raw, this._denormalize);
    },

    /**
      Create new query of data store

      @param {Object} config to pass to query
      @returns {Query}
    */
    query: function query(config) {
      return new Query(this, config);
    },

    // Denormalize rows with given options (config/iterator, context)
    _denormalizeRows: function _denormalizeRows(rows, options) {
      options = options || {};

      var denormalized = _.map(rows, function(row, index, rows) {
        if (_.isFunction(options.iterator))
          return options.iterator.call(options.context || this, row, index, rows);
        else if (_.isObject(options.config))
          return this._denormalizeRowByConfig(row, index, rows, options.config);
        else
          return row;
      }, this);

      // Flatten single layer to return rows as single array (not array of arrays)
      return _.flatten(denormalized, true);
    },
    _denormalizeRowByConfig: function _denormalizeRowByConfig(row, index, rows, config) {
      // TODO...
    }
  });

  /**
    Query
    Perform query on data store and get formatted series data

    @param {Store} store instance to query
  */
  var Query = data.Query = function Query(store, config) {
    this.store = store;
    this._results = [];
    this._subscriptions = [];

    if (config)
      this.alter(config);

    // Listen to store changes and update results
    this._subscription = store.subscribe(this.calculate);
  };

  _.extend(Query.prototype, {
    /**
      Get results of query

      @param {Function} callback
      @param {Object} [context]
    */
    results: function results(callback, context) {
      // TODO Actual async (e.g. waiting for load to finish)
      _.defer(function() {
        callback.call(context || null, this._results);
      }.bind(this));
    },

    /**
      Calculate results for rows

      @param {Array} rows
    */
    calculate: function calculate(rows) {
      // TODO perform calculation...
      this._results = rows;

      // Trigger change (for subscribers and listeners)
      this.trigger('change', this._results, {
        name: 'change',
        query: this,
        store: this.store
      });
    },

    /**
      Alter underlying query

      @param {Object} config
    */
    alter: function alter(config) {
      // TODO store config

      // Recalculate if store is loaded
      if (this.store.state() == 'loaded') {
        this.store.rows(function(rows) {
          this.calculate(rows)
        }, this);
      }
    },

    /**
      Subscribe to changes in query results (including load)

      @param {Function} callback to call with (values, event: name, query, store)
      @param {Object} [options]
      - {Boolean} [existing=true] trigger on existing records
    */
    subscribe: function subscribe(callback, context, options) {
      options = _.defaults(options, {
        existing: true
      });

      var subscription = new Subscription(this, 'change', callback, context);
      this._subscriptions.push(subscription);

      // If trigger on existing and loaded, mimic load event for callback
      if (options.existing) {
        this.results(function(results) {
          subscription.callback(results, {
            name: 'change',
            query: this,
            store: this.store
          });
        }, this);
      }

      return subscription;
    }
  });

  /**
    Subscription
    Disposable subscription

    @param {Object} target to attach listeners to
    @param {Array} events to listen to
    @param {Function} callback to call on events
    @param {Object} [context] to use for callback
  */
  var Subscription = data.Subscription = function Subscription(target, events, callback, context) {
    this.options = {
      target: target,
      events: events,
      callback: callback,
      context: context
    };

    // Create callback "bound" to given context
    this.callback = function subscription() {
      return this.options.callback.apply(this.options.context || null, arguments);
    };

    this.attachListeners();
  };

  _.extend(Subscription.prototype, {
    attachListeners: function() {
      if (this.listeners)
        this.dispose();

      var target = this.options.target;
      if (target && _.isFunction(target.on)) {
        this.listeners = _.map(this.options.events, function(name) {
          target.on(name, this.callback);

          return {
            name: name,
            callback: this.callback
          };
        }, this);
      }
    },

    /**
      Stop listening to changes
    */
    dispose: function dispose() {
      // Stop listeners
      var target = this.options.target;
      if (target) {
        _.each(this.listeners, function(listener) {
          target.off(listener.name, listener.callback);
        }, this);
      }

      delete this.listeners;
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
    if (row._filename == 'chart1.csv') {
      return data.store._denormalizeRowByConfig(row, index, rows, {

      });
    }
    else if (row._filename == 'chart2.csv') {
      return data.store._denormalizeRowByConfig(row, index, rows, {

      });
    }
    else if (row._filename == 'chart3.csv') {
      return data.store._denormalizeRowByConfig(row, index, rows, {

      });
    }
  })

  // === END FIXTURES

})(this, _);
