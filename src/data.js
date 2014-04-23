(function(d3, _, Backbone, global) {

  'use strict';

  // Attach properties to global data object
  var data = global.data = {};

  /**
    Events (eventually remove Backbone dependency)
  */
  var Events = data.Events = {
    on: Backbone.Events.on,
    once: Backbone.Events.once,
    off: Backbone.Events.off,
    trigger: Backbone.Events.trigger
  };

  /**
    Store
    Generic data store with collection of rows
  */
  var Store = data.Store = function Store() {
    this._raw = [];
    this._rows = [];
    this._subscriptions = [];

    // Setup loading stack
    this.loading = new EventedStack();
    this.loading.removeOn('error load');
    this.loading.on('load', function(rows) {
      this._raw = this._raw.concat(rows);
      this._rows = this._rows.concat(this._denormalizeRows(rows));

      this.trigger('load', rows);
    }, this);

    this._denormalize = function(row) { return row; };
  };

  _.extend(Store.prototype, Events, {
    /**
      Get values from store (asynchromously)

      @param {Function} callback
      @param {Object} [context]
    */
    values: function values(callback, context) {
      var finished = function() {
        callback.call(context, this._rows);
      }.bind(this);

      if (this.loading.count() > 0) {
        this.loading.all('load error', finished);
      }
      else {
        // Values is always async, even when not loading
        _.defer(finished);
      }

      return this;
    },

    /**
      Load csv file into store

      @param {String} path to csv
    */
    load: function load(path) {
      this._load(path, function(path, callback) {
        // TODO use actual d3 csv
        callback(null, []);
      });

      return this;
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

      // Create new subscription (TODO determine what to listen to)
      var subscription = new Subscription(this, [], callback, context);
      this._subscriptions.push(subscription);

      // If trigger on existing, mimic load event for callback
      if (options.existing) {
        // TODO
        // subscription.trigger(...) 
      }

      return subscription;
    },

    /**
      Register denormalization iterator/option to be called with every incoming row

      @param {Object|Function} options or iterator
      @param {Object} [context] if config is iterator
    */
    denormalize: function denormalize(options, context) {
      if (_.isFunction(options)) {
        // options is iterator
        this._denormalize = function(row) {
          return options.call(context || this, row);
        };
      }
      else {
        var xColumn = options.x || 'x';

        // Convert y to standard form (if column or array of columns)
        var yOptions = _.isObject(options.y) ? options.y : {
          category: 'from',
          columns: _.isArray(options.y) ? options.y : [options.y || 'y']
        };

        // setup iterator by options
        this._denormalize = function(row) {
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
      }

      // Denormalize any existing data
      this._rows = this._denormalizeRows(this._raw);

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

    _denormalizeRows: function(rows) {
      return _.flatten(_.map(rows, this._denormalize, this), true);
    },

    _load: function(path, loadFn) {
      // Create loading helper and add to loading stack
      var loading = _.extend({path: path}, Backbone.Events);
      this.loading.add(loading);

      loadFn(path, function(err, rows) {
        if (err) return loading.trigger('error', err);

        // Add filename to rows
        _.each(rows, function(row) {
          row.__filename = loading.path;
        }, this);

        // Notify listeners
        loading.trigger('load', rows);
      });
    }
  });

  /**
    Query
    Perform query on data store and get formatted series data

    @param {Store} store instance to query
  */
  var Query = data.Query = function Query(store, config) {
    this.store = store;
    this._subscriptions = [];

    // Listen to store changes and update results
    // TODO
  };

  _.extend(Query.prototype, Events, {
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
      options = _.defaults(options, {
        existing: true
      });

      var subscription = new Subscription(this, 'change', callback, context);
      this._subscriptions.push(subscription);

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

    @param {Object} target to attach listeners to
    @param {Array} event names to listen to
    @param {Function} callback to call on events
    @param {Object} [context] to use for callback
  */
  var Subscription = data.Subscription = function Subscription(target, events, callback, context) {
    this.target = target;
    this.events = events;
    this.callback = callback;
    this.context = context;

    this._attachListeners();
  };

  _.extend(Subscription.prototype, {
    /**
      Stop listening to changes
    */
    dispose: function dispose() {
      // Stop listeners
      var target = this.target;
      if (target && _.isFunction(target.off)) {
        _.each(this.listeners, function(listener) {
          target.off(listener.name, listener.callback, listener.context);
        }, this);
      }

      delete this.listeners;
    },

    /**
      Directly trigger subscription
    */
    trigger: function() {
      this.callback.apply(this.context, arguments);
    },

    _attachListeners: function() {
      if (this.listeners)
        this.dispose();

      var target = this.target;
      if (target && _.isFunction(target.on)) {
        this.listeners = _.map(this.events, function(name) {
          target.on(name, this.callback, this.context);

          return {
            name: name,
            callback: this.callback,
            context: this.context
          };
        }, this);
      }
    }
  });

  /**
    Evented stack with helpers for listening to multiple elements
  */
  var EventedStack = data.EventedStack = function EventedStack() {
    this._elements = [];
    this._removeOn = function() {};
  };

  _.extend(EventedStack.prototype, Events, {
    items: function() {
      return this._elements;
    },
    count: function() {
      return this._elements.length;
    },

    /**
      Add element to stack
    */
    add: function(element) {
      this._elements.push(element);
      this._removeOn(element);

      // Attach bubbler to element
      element.on('all', function() {
        this.trigger.apply(this, arguments);
      }, this);
    },

    /**
      Remove elements when they trigger an event
    */
    removeOn: function(name) {
      // Create _removeOn helper
      this._removeOn = function(element) {
        this.listenTo

        element.once(name, function() {
          this.remove(element);
        }, this);
      };

      // Attach listeners to current elements
      _.each(this._elements, this._removeOn, this);
    },

    remove: function(element) {
      this._elements = _.without(this._elements, element);

      // Remove listeners from element
      element.off(null, null, this);
    },

    /**
      Trigger callback when all elements that are currently in stack trigger event
      passing response arguments array to callback
      
      @param {String} name of event to listen to
      @param {Function} callback
      @param {Object} [context]
    */
    all: function(name, callback, context) {
      var count = this._elements.length;
      var results = [];

      _.each(this._elements, function(element, index) {
        element.once(name, function() {
          results[index] = _.toArray(arguments)
          if (--count <= 0) {
            callback.call(context, results);
          }
        }, this);
      });
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

})(d3, _, Backbone, this);
