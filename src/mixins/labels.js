import d3 from 'd3';
import { property } from '../helpers';
import {
  extend,
  defaults,
  isBoolean
} from '../utils';

/**
  Mixin for handling labels in charts

  @class Labels
  @namespace mixins
*/
var Labels = {
  /**
    Call during chart initialization to add labels to chart

    @example
    ```js
    d3.chart('Chart').extend('Custom', helpers.mixin(Labels, {
      initialize: function() {
        // this.layer()...

        // Attach labels layer
        this.attachLabels();
      }
    }));
    ```
    @method attachLabels
  */
  attachLabels: function() {
    var options = this.labels();
    options.parent = this;

    var LabelsClass = d3.chart(options.type);
    var base = this.base.append('g').attr('class', 'chart-labels');
    var labels = this._labels = new LabelsClass(base, options);

    // Proxy x and y to parent chart
    this.proxyLabelMethods.forEach(function(method) {
      labels[method] = this[method];
    }, this);

    this.on('draw', function(data) {
      options = this.labels();
      options.parent = this;

      labels.options(options);

      if (options.display !== false)
        labels.draw(options.data || data);
      else
        labels.draw([]);
    }.bind(this));
  },

  /**
    Options passed to labels chart

    @example
    ```js
    d3.chart('Chart').extend('Custom', helpers.mixin(Labels, {
      // ...
    }));

    // ...

    chart.labels(true); // -> display labels with defaults
    chart.labels(false); // -> hide labels
    chart.labels({offset: 10}); // -> pass options to labels chart

    d3.select('#chart')
      .chart('Compose', function(data) {
        return {
          charts: {
            custom: {labels: {offset: 10}}
          }
        };
      });
    ```
    @property labels
    @type Object
  */
  labels: property('labels', {
    get: function(value) {
      if (isBoolean(value))
        value = {display: value};
      else if (!value)
        value = {display: false};

      return defaults({}, value, {
        type: 'Labels'
      });
    }
  }),

  // Array of methods to proxy on labels chart
  proxyLabelMethods: []
};

/**
  Mixin for handling labels in XY charts
  (proxies `x` and `y` to properly place labels for XY charts)

  @class LabelsXY
  @namespace mixins
  @extends Labels
*/
var LabelsXY = extend({}, Labels, {
  proxyLabelMethods: ['x', 'y']
});

export {
  Labels as default,
  LabelsXY
};
