(function(d3, helpers, charts) {
  var property = helpers.property;

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
  charts.Overlay = charts.Component.extend('Overlay', {
    initialize: function() {
      this.base.attr('style', this.style());
    },
    skip_layout: true,
    
    /**
      Overlay's top-left x-position in px from left

      @property x
      @type Number
      @default 0
    */
    x: property('x', {
      default_value: 0
    }),

    /**
      Overlay's top-left y-position in px from top

      @property y
      @type Number
      @default 0
    */
    y: property('y', {
      default_value: 0
    }),

    /**
      Whether overlay is currently hidden

      @property hidden
      @type Boolean
      @default true
    */
    hidden: property('hidden', {
      default_value: true
    }),

    /**
      Overlays base styling
      (default includes position and hidden)

      @property style
      @type String
      @default set from x, y, and hidden
    */
    style: property('style', {
      default_value: function() {
        var styles = {
          position: 'absolute',
          top: 0,
          left: 0,
          transform: helpers.translate(this.x() + 'px', this.y() + 'px')
        };

        if (this.hidden())
          styles.display = 'none';

        return helpers.style(styles);
      }
    }),

    /**
      Position overlay layer at given x,y coordinates

      @method position
      @param {Number} x in px from left
      @param {Number} y in px from top
    */
    position: function(x, y) {
      this.x(x).y(y);
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

      if (container) {
        var dimensions = helpers.dimensions(container);
        var chart_width = this.container.width();
        var chart_height = this.container.height();
        var width_ratio = dimensions.width / chart_width;
        var height_ratio = dimensions.height / chart_height;

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

})(d3, d3.compose.helpers, d3.compose.charts);
