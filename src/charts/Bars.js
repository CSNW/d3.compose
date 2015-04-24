(function(d3, helpers, mixins) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Bar graph with centered values data and adjacent display for series

    @class Bars
  */
  d3.chart('Chart').extend('Bars', mixin(mixins.Series, mixins.XYValues, mixins.XYLabels, mixins.Hover, {
    initialize: function() {
      this.seriesLayer('Bars', this.base.append('g').classed('chart-bars', true), {
        dataBind: function(data) {
          var chart = this.chart();

          return this.selectAll('rect')
            .data(data, chart.key);
        },
        insert: function() {
          var chart = this.chart();

          return this.append('rect')
            .on('mouseenter', chart.mouseEnterPoint)
            .on('mouseleave', chart.mouseLeavePoint);
        },
        events: {
          'enter': function() {
            var chart = this.chart();

            this
              .attr('y', chart.y0())
              .attr('height', 0);
          },
          'merge': function() {
            var chart = this.chart();

            this
              .attr('class', chart.barClass)
              .attr('style', chart.itemStyle)
              .attr('x', chart.barX)
              .attr('width', chart.itemWidth());
          },
          'merge:transition': function() {
            var chart = this.chart();

            if (!_.isUndefined(chart.delay()))
              this.delay(chart.delay());
            if (!_.isUndefined(chart.duration()))
              this.duration(chart.duration());
            if (!_.isUndefined(chart.ease()))
              this.ease(chart.ease());

            this
              .attr('y', chart.barY)
              .attr('height', chart.barHeight);
          },
          'exit': function() {
            this.remove();
          }
        }
      });

      this.attachLabels();
    },

    delay: property('delay', {type: 'Function'}),
    duration: property('duration', {type: 'Function'}),
    ease: property('ease', {type: 'Function'}),

    barHeight: di(function(chart, d, i) {
      var height = Math.abs(chart.y0() - chart.y.call(this, d, i)) - chart.barOffset();
      return height > 0 ? height : 0;
    }),
    barX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) - chart.itemWidth() / 2;
    }),
    barY: di(function(chart, d, i) {
      var y = chart.y.call(this, d, i);
      var y0 = chart.y0();

      return y < y0 ? y : y0 + chart.barOffset();
    }),
    barClass: di(function(chart, d, i) {
      return 'chart-bar' + (d['class'] ? ' ' + d['class'] : '');
    }),

    // Shift bars slightly to account for axis thickness
    barOffset: function barOffset() {
      var axis = this.container && this.container.components()['axis.x'];
      if (axis) {
        var axis_thickness = parseInt(axis.base.select('.domain').style('stroke-width')) || 0;
        return axis_thickness / 2;
      }
      else {
        return 0;
      }
    }
  }));

  /**
    Stacked Bars

    @class StackedBars
  */
  d3.chart('Bars').extend('StackedBars', {
    transform: function(data) {
      // Re-initialize bar positions each time data changes
      this.bar_positions = [];
      return data;
    },

    barHeight: di(function(chart, d, i) {
      var height = Math.abs(chart.y0() - chart.y.call(this, d, i));
      var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
      return height > 0 ? height - offset : 0;
    }),
    barX: di(function(chart, d, i) {
      return chart.x.call(this, d, i) - chart.itemWidth() / 2;
    }),
    barY: di(function(chart, d, i) {
      var y = chart.y.call(this, d, i);
      var y0 = chart.y0();

      // Only handle positive y-values
      if (y > y0) return;

      if (chart.bar_positions.length <= i)
        chart.bar_positions.push(0);

      var previous = chart.bar_positions[i] || y0;
      var new_position = previous - (y0 - y);

      chart.bar_positions[i] = new_position;

      return new_position;
    })
  });

})(d3, d3.compose.helpers, d3.compose.mixins);
