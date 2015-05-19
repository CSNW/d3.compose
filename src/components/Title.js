(function(d3, helpers, mixins, charts) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    @class Title
  */
  charts.Title = charts.Component.extend('Title', {
    initialize: function() {
      this.layer('Title', this.base.append('g').classed('chart-title', true), {
        dataBind: function(data) {
          return this.selectAll('text')
            .data([0]);
        },
        insert: function() {
          return this.append('text');
        },
        events: {
          merge: function() {
            var chart = this.chart();
            this
              .attr('transform', chart.transformation())
              .attr('style', chart.style())
              .attr('text-anchor', chart.anchor())
              .attr('class', chart.options()['class'])
              .text(chart.text());
          }
        }
      });
    },

    /**
      @property text
      @type String
    */
    text: property('text', {
      get: function() {
        return this.options().text;
      }
    }),

    /**
      Rotation of title text

      @property rotation
      @type Number
      @default (set based on position)
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
      Horizontal text-alignment of title

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
      text-anchor for title (start, middle, or end)
      (default set by textAlign)

      @property anchor
      @type String
      @default "middle"
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
      Vertical aligment for title (top, middle, bottom)

      @property verticalAlign
      @type String
      @default "middle"
    */
    verticalAlign: property('verticalAlign', {
      default_value: 'middle',
      validate: function(value) {
        return helpers.utils.contains(['top', 'middle', 'bottom'])
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
  }, {
    z_index: 70
  });

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);
