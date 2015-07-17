(function(d3, helpers, mixins, charts) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Add title text to a chart.

    ### Extending

    To extend the `Title` component, the following methods are available:

    - `onDataBind`
    - `onInsert`
    - `onEnter`
    - `onEnterTransition`
    - `onUpdate`
    - `onUpdateTransition`
    - `onMerge`
    - `onMergeTransition`
    - `onExit`
    - `onExitTransition`

    @example
    ```js
    d3.select('#chart')
      .chart('Compose', function(data) {
        return {
          components: {
            title: {
              type: 'Title',
              position: 'top'
              text: 'Main Title',
              textAlign: 'left',
              'class': 'title-main'
            },
            subtitle: {
              type: 'Title',
              position: 'bottom',
              text: 'Subtitle',
              'class': 'title-subtitle'
            }
          }
        };
      });
    ```
    @class Title
    @extends Component, StandardLayer
  */
  charts.Title = charts.Component.extend('Title', mixin(mixins.StandardLayer, {
    initialize: function() {
      // Use standard layer for extensibility
      this.standardLayer('Title', this.base.append('g').classed('chart-title', true));
    },

    /**
      Text to display in title

      @property text
      @type String
    */
    text: property('text'),

    /**
      Rotation of title text. (Default is `-90` for `position = "right"`, `90` for `position = "left"`, and `0` otherwise).

      @property rotation
      @type Number
      @default (set based on `position`)
    */
    rotation: property('rotation', {
      default_value: function() {
        var rotate_by_position = {
          right: 90,
          left: -90
        };

        return rotate_by_position[this.position()] || 0;
      }
    }),

    /**
      Horizontal text-alignment of title (`"left"`, `"center"`, or `"right"`)

      @property textAlign
      @type String
      @default "center"
    */
    textAlign: property('textAlign', {
      default_value: 'center',
      validate: function(value) {
        return helpers.utils.contains(['left', 'center', 'right'], value);
      }
    }),

    /**
      text-anchor for title (`"start"`, `"middle"`, or `"end"`)

      @property anchor
      @type String
      @default (set by `textAlign`)
    */
    anchor: property('anchor', {
      default_value: function() {
        return {
          left: 'start',
          center: 'middle',
          right: 'end'
        }[this.textAlign()];
      },
      validate: function(value) {
        return helpers.utils.contains(['start', 'middle', 'end', 'inherit'], value);
      }
    }),

    /**
      Vertical aligment for title (`"top"`, `"middle"`, `"bottom"`)

      @property verticalAlign
      @type String
      @default "middle"
    */
    verticalAlign: property('verticalAlign', {
      default_value: 'middle',
      validate: function(value) {
        return helpers.utils.contains(['top', 'middle', 'bottom']);
      }
    }),

    /**
      Style object containing styles for title

      @property style
      @type Object
      @default {}
    */
    style: property('style', {
      default_value: {},
      get: function(value) {
        return helpers.style(value) || null;
      }
    }),

    onDataBind: function onDataBind(selection, data) {
      return selection.selectAll('text')
        .data([0]);
    },
    onInsert: function onInsert(selection) {
      return selection.append('text');
    },
    onMerge: function onMerge(selection) {
      selection
        .attr('transform', this.transformation())
        .attr('style', this.style())
        .attr('text-anchor', this.anchor())
        .attr('class', this.options()['class'])
        .text(this.text());
    },

    transformation: function() {
      var x = {
        left: 0,
        center: this.width() / 2,
        right: this.width()
      }[this.textAlign()];
      var y = {
        top: 0,
        middle: this.height() / 2,
        bottom: this.height()
      }[this.verticalAlign()];

      var translate = helpers.translate(x, y);
      var rotate = helpers.rotate(this.rotation());

      return translate + ' ' + rotate;
    },
  }), {
    z_index: 70
  });

  d3.compose.title = function(id, options) {
    if (!options) {
      options = id;
      id = undefined;
    }
    if (utils.isString(options))
      options = {text: options};

    return utils.extend({id: id, type: 'Title'}, options);
  };

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);
