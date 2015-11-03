import {
  property,
  translate,
  style as styleToString,
  dimensions
} from './helpers';
import Component from './Component';

/**
  Common base for creating overlays that includes helpers for positioning and show/hide.

  ### Extending

  Create an overlay just like a chart, by creating layers in the `initialize` method in `extend`.

  - To adjust positioning, override `position`
  - To adjust show/hide behavior, override `show`/`hide`

  @example
  ```js
  d3.chart('Overlay').extend('ClosestPoints', {
    // TODO
  });
  ```
  @class Overlay
  @extends Component
*/
var Overlay = Component.extend({
  initialize: function(options) {
    Component.prototype.initialize.call(this, options);
    this.base.attr('style', this.style());
  },
  skip_layout: true,

  /**
    Overlay's top-left x-position in px from left

    @property x
    @type Number
    @default 0
  */
  x: property({
    default_value: 0
  }),

  /**
    Overlay's top-left y-position in px from top

    @property y
    @type Number
    @default 0
  */
  y: property({
    default_value: 0
  }),

  /**
    Whether overlay is currently hidden

    @property hidden
    @type Boolean
    @default true
  */
  hidden: property({
    default_value: true
  }),

  /**
    Overlays base styling
    (default includes position and hidden)

    @property style
    @type String
    @default set from x, y, and hidden
  */
  style: property({
    default_value: function() {
      var transform = translate(this.x() + 'px', this.y() + 'px');
      var styles = {
        position: 'absolute',
        top: 0,
        left: 0,
        '-webkit-transform': transform,
        '-ms-transform': transform,
        transform: transform
      };

      if (this.hidden())
        styles.display = 'none';

      return styleToString(styles);
    }
  }),

  /**
    Position overlay layer at given x,y coordinates

    @example
    ```js
    // Absolute, x: 100, y: 50
    overlay.position(100, 50);
    overlay.position({x: 100, y: 50});

    // Relative-to-chart, x: 50, y: 40
    overlay.position({chart: {x: 50, y: 40}});

    // Relative-to-container, x: 75, y: 50
    overlay.position({container: {x: 75, y: 50}});
    ```
    @method position
    @param {Object|Number} position {x,y}, {container: {x,y}}, {chart: {x,y}} or x in px from left
    @param {Number} [y] in px from top
  */
  // TODO This conflicts with component.position(), might need a rename
  position: function(position, y) {
    if (arguments.length > 1) {
      position = {
        x: position,
        y: y
      };
    }
    else {
      if ('container' in position) {
        position = this.getAbsolutePosition(position.container);
      }
      else if ('chart' in position) {
        if (this.container) {
          var chart = this.container.chartPosition();
          position = this.getAbsolutePosition({
            x: position.chart.x + chart.left,
            y: position.chart.y + chart.top
          });
        }
        else {
          position = this.getAbsolutePosition(position.chart);
        }
      }
    }

    this.x(position.x).y(position.y);
    this.base.attr('style', this.style());
  },

  /**
    Show overlay (with `display: block`)

    @method show
  */
  show: function() {
    this.hidden(false);
    this.base.attr('style', this.style());
  },

  /**
    Hide overlay (with `display: none`)

    @method hide
  */
  hide: function() {
    this.hidden(true);
    this.base.attr('style', this.style());
  },

  /**
    Get absolute position from container position
    (needed since container position uses viewBox and needs to be scaled to absolute position)

    @method getAbsolutePosition
    @param {Object} container_position ({x, y})
    @return {Object} absolute {x, y} relative to container div
  */
  getAbsolutePosition: function(container_position) {
    var container = this.container && this.container.container;

    if (container && this.container.responsive()) {
      var container_dimensions = dimensions(container);
      var chart_width = this.container.width();
      var chart_height = this.container.height();
      var width_ratio = container_dimensions.width / chart_width;
      var height_ratio = container_dimensions.height / chart_height;

      return {
        x: width_ratio * container_position.x,
        y: height_ratio * container_position.y
      };
    }
    else {
      // Not attached so can't get actual dimensions
      // fallback to container position
      return container_position;
    }
  }
}, {
  layer_type: 'overlay'
});

export default Overlay;
