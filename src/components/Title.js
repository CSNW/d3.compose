(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Title

    Properties:
    - {String} title
    - {Object} style
    - {Number} rotation
  */
  d3.chart('Component').extend('Title', {
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
              .attr('text-anchor', 'middle')
              .attr('class', chart.options()['class'])
              .text(chart.text());
          }
        }
      });
    },

    text: property('text', {
      get: function() {
        return this.options().text;
      }
    }),
    rotation: property('rotation', {
      default_value: function() {
        var rotate_by_position = {
          right: 90,
          left: -90
        };

        return rotate_by_position[this.position()] || 0;
      }
    }),

    transformation: function() {
      var translate = helpers.translate(this.width() / 2, this.height() / 2);
      var rotate = helpers.rotate(this.rotation());

      return translate + ' ' + rotate;
    },
  }, {
    z_index: 70
  });
  
})(d3, d3.chart.helpers, d3.chart.mixins);
