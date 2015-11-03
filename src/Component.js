import { contains } from './utils';
import {
  dimensions,
  getMargins,
  property,
  translate
} from './helpers';
import Base from './Base';

/**
  Common base for creating components that includes helpers for positioning and layout.

  ### Extending

  `d3.chart('Component')` contains intelligent defaults and there are no required overrides.
  Create a component just like a chart, by creating layers in the `initialize` method in `extend`.

  - To adjust layout calculation, use `prepareLayout`, `getLayout`, and `setLayout`.
  - To layout a component within the chart, use `skip_layout: true` and the static `layer_type: 'chart'`

  @example
  ```js
  d3.chart('Component').extend('Key', {
    initialize: function() {
      this.layer('Key', this.base, {
        dataBind: function(data) {
          return this.selectAll('text')
            .data(data);
        },
        insert: function() {
          return this.append('text');
        },
        events: {
          merge: function() {
            this.text(this.chart().keyText)
          }
        }
      })
    },

    keyText: helpers.di(function(chart, d, i) {
      return d.abbr + ' = ' + d.value;
    })
  });
  ```
  @class Component
  @extends Base
*/
var Component = Base.extend({
  /**
    Component's position relative to chart
    (top, right, bottom, left)

    @property position
    @type String
    @default 'top'
  */
  position: property({
    default_value: 'top',
    validate: function(value) {
      return contains(['top', 'right', 'bottom', 'left'], value);
    }
  }),

  /**
    Get/set the width of the component (in pixels)
    (used in layout calculations)

    @property width
    @type Number
    @default (actual width)
  */
  width: property({
    default_value: function() {
      return dimensions(this.base).width;
    }
  }),

  /**
    Get/set the height of the component (in pixels)
    (used in layout calculations)

    @property height
    @type Number
    @default (actual height)
  */
  height: property({
    default_value: function() {
      return dimensions(this.base).height;
    }
  }),

  /**
    Margins (in pixels) around component

    @property margins
    @type Object
    @default {top: 0, right: 0, bottom: 0, left: 0}
  */
  margins: property({
    set: function(values) {
      return {
        override: getMargins(values)
      };
    },
    default_value: getMargins()
  }),

  /**
    Center the component vertically/horizontally (depending on position)

    @property centered
    @type Boolean
    @default false
  */
  centered: property({
    default_value: false
  }),

  /**
    Skip component during layout calculations and positioning
    (override in prototype of extension)

    @example
    ```js
    d3.chart('Component').extend('NotLaidOut', {
      skip_layout: true
    });
    ```
    @attribute skip_layout
    @type Boolean
    @default false
  */
  skip_layout: false,

  /**
    Perform any layout preparation required before getLayout (default is draw)
    (override in prototype of extension)

    Note: By default, components are double-drawn;
    for every draw, they are drawn once to determine the layout size of the component and a second time for display with the calculated layout.
    This can cause issues if the component uses transitions. See Axis for an example of a Component with transitions.

    @example
    ```js
    d3.chart('Component').extend('Custom', {
      prepareLayout: function(data) {
        // default: this.draw(data);
        // so that getLayout has real dimensions

        // -> custom preparation (if necessary)
      }
    })
    ```
    @method prepareLayout
    @param {Any} data
  */
  prepareLayout: function(data) {
    this.draw(data);
  },

  /**
    Get layout details for use when laying out component
    (override in prototype of extension)

    @example
    ```js
    d3.chart('Component').extend('Custom', {
      getLayout: function(data) {
        var calculated_width, calculated_height;

        // Perform custom calculations...

        // Must return position, width, and height
        return {
          position: this.position(),
          width: calculated_width,
          height: calculated_height
        };
      }
    });
    ```
    @method getLayout
    @param {Any} data
    @return {Object} position, width, and height for layout
  */
  getLayout: function(data) {
    this.prepareLayout(data);

    var margins = this.margins();
    return {
      position: this.position(),
      width: this.width() + margins.left + margins.right,
      height: this.height() + margins.top + margins.bottom
    };
  },

  /**
    Set layout of underlying base
    (override in prototype of extension)

    @example
    ```js
    d3.chart('Component').extend('Custom', {
      setLayout: function(x, y, options) {
        // Set layout of this.base...
        // (the following is the default implementation)
        var margins = this.margins();

        // (handle this.centered())

        this.base
          .attr('transform', helpers.translate(x + margins.left, y + margins.top));
        this.height(options && options.height);
        this.width(options && options.width);
      }
    });
    ```
    @method setLayout
    @param {Number} x position of base top-left
    @param {Number} y position of base top-left
    @param {Object} options
      @param {Object} [options.height] height of component in layout
      @param {Object} [options.width] width of component in layout
  */
  setLayout: function(x, y, options) {
    var margins = this.margins();

    if (this.centered()) {
      var actual_dimensions = dimensions(this.base);
      if ('height' in options)
        y += (options.height - actual_dimensions.height) / 2;
      else
        y += margins.top;

      if ('width' in options)
        x += (options.width - actual_dimensions.width) / 2;
      else
        x += margins.left;
    }
    else {
      x += margins.left;
      y += margins.top;
    }

    this.base.attr('transform', translate(x, y));
    this.height(options && options.height);
    this.width(options && options.width);
  }
}, {
  /**
    Default z-index for component
    (Charts are 100 by default, so Component = 50 is below chart by default)

    @example
    ```js
    d3.chart('Component').extend('AboveChartLayers', {
      // ...
    }, {
      z_index: 150
    });
    ```
    @attribute z_index
    @static
    @type Number
    @default 50
  */
  z_index: 50,

  /**
    Set to `'chart'` to use chart layer for component.
    (e.g. Axis uses chart layer to position with charts, but includes layout for ticks)

    @example
    ```js
    d3.chart('Component').extend('ChartComponent', {
      // ...
    }, {
      layer_type: 'chart'
    });
    ```
    @attribute layer_type
    @static
    @type String
    @default 'component'
  */
  layer_type: 'component'
});

export default Component;
