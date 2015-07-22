/**
  Mixin to create standard layer to make extending charts straightforward.

  @example
  ```js
  d3.chart('Chart').extend('Custom', helpers.mixin(StandardLayer, {
    initialize: function() {
      this.standardLayer('main', this.base.append('g'))
      // dataBind, insert, events are defined on prototype
    },

    onDataBind: function(selection, data) {
      // ...
    },
    onInsert: function(selection) {
      // ...
    },
    onEnter: function(selection) {
      // ...
    },
    onUpdateTransition: function(selection) {
      // ...
    },
    // all d3.chart events are available: onMerge, onExit, ...
  }));
  ```
  @class StandardLayer
  @namespace mixins
*/
var StandardLayer = {
  /**
    extension of `layer()` that uses standard methods on prototype for extensibility.

    @example
    ```js
    d3.chart('Chart').extend('Custom', helpers.mixin(StandardLayer, {
      initialize: function() {
        this.standardLayer('circles', this.base.append('g'));
      }

      // onDataBind, onInsert, etc. work with "circles" layer
    }));
    ```
    @method standardLayer
    @param {String} name
    @param {d3.selection} selection
  */
  standardLayer: function standardLayer(name, selection) {
    return createLayer(this, 'layer', name, selection);
  },

  /**
    extension of `seriesLayer()` that uses standard methods on prototype for extensibility.

    @example
    ```js
    d3.chart('Chart').extend('Custom', helpers.mixin(StandardLayer, {
      initialize: function() {
        this.standardSeriesLayer('circles', this.base.append('g'));
      },

      // onDataBind, onInsert, etc. work with "circles" seriesLayer
    }));
    ```
    @method standardSeriesLayer
    @param {String} name
    @param {d3.selection} selection
  */
  standardSeriesLayer: function standardSeriesLayer(name, selection) {
    return createLayer(this, 'series', name, selection);
  },

  /**
    Called for standard layer's `dataBind`

    @method onDataBind
    @param {d3.selection} selection
    @param {Any} data
    @return {d3.selection}
  */
  onDataBind: function onDataBind(/* selection, data */) {},

  /**
    Called for standard layer's `insert`

    @method onInsert
    @param {d3.selection} selection
    @return {d3.selection}
  */
  onInsert: function onInsert(/* selection */) {},

  /**
    Call for standard layer's `events['enter']`

    @method onEnter
    @param selection {d3.selection}
  */
  onEnter: function onEnter(/* selection */) {},

  /**
    Call for standard layer's `events['enter:transition']`

    @method onEnterTransition
    @param selection {d3.selection}
  */
  // onEnterTransition: function onEnterTransition(selection) {},

  /**
    Call for standard layer's `events['update']`

    @method onUpdate
    @param selection {d3.selection}
  */
  onUpdate: function onUpdate(/* selection */) {},

  /**
    Call for standard layer's `events['update']`

    @method onUpdateTransition
    @param selection {d3.selection}
  */
  // onUpdateTransition: function onUpdateTransition(selection) {},

  /**
    Call for standard layer's `events['merge']`

    @method onMerge
    @param selection {d3.selection}
  */
  onMerge: function onMerge(/* selection */) {},

  /**
    Call for standard layer's `events['merge:transition']`

    @method onMergeTransition
    @param selection {d3.selection}
  */
  // onMergeTransition: function onMergeTransition(selection) {},

  /**
    Call for standard layer's `events['exit']`

    @method onExit
    @param selection {d3.selection}
  */
  onExit: function onExit(/* selection */) {}

  /**
    Call for standard layer's `events['exit:transition']`

    @method onExitTransition
    @param selection {d3.selection}
  */
  // onExitTransition: function onExitTransition(selection) {},
};

function createLayer(chart, type, name, selection) {
  var layer = {
    layer: 'layer',
    series: 'seriesLayer'
  }[type];

  if (layer && chart[layer]) {
    var events = {};
    [
      'enter',
      'enter:transition',
      'update',
      'update:transition',
      'merge',
      'merge:transition',
      'exit',
      'exit:transition'
    ].forEach(function(event) {
      var method = 'on' + event.split(':').map(function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
      }).join('');

      // Only create events if chart method exists as empty transition events can cause unforeseen issues
      if (chart[method]) {
        events[event] = function() {
          this.chart()[method](this);
        };
      }
    });

    return chart[layer](name, selection, {
      dataBind: function(data) {
        return this.chart().onDataBind(this, data);
      },
      insert: function() {
        return this.chart().onInsert(this);
      },
      events: events
    });
  }
}

export default StandardLayer;
