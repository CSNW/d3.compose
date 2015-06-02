(function(d3, helpers, mixins, charts) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;
  var isUndefined = helpers.utils.isUndefined;

  /**
    Bar graph with centered values data and adjacent display for series

    @class Bars
  */
  charts.Bars = charts.Chart.extend('Bars', mixin(
    mixins.Series,
    mixins.XYValues,
    mixins.XYLabels,
    mixins.Hover,
    mixins.Transition, 
    mixins.StandardLayer, 
    {
      initialize: function() {
        // Use standard series layer for extensibility
        // (dataBind, insert, and events defined in prototype)
        this.standardSeriesLayer('Bars', this.base.append('g').classed('chart-bars', true));
        this.attachLabels();
      },

      barHeight: di(function(chart, d, i) {
        var height = Math.abs(chart.y0() - chart.y.call(this, d, i)) - chart.barOffset();
        return height > 0 ? height : 0;
      }),
      barWidth: di(function(chart, d, i) {
        return chart.itemWidth();
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
        var axis = this.getOffsetAxis();
        if (axis) {
          var axis_thickness = parseInt(axis.base.select('.domain').style('stroke-width')) || 0;
          return axis_thickness / 2;
        }
        else {
          return 0;
        }
      },
      getOffsetAxis: function getOffsetAxis() {
        return this.container && this.container.components()['axis.x'];
      },

      // Override StandardLayer
      onDataBind: function onDataBind(selection, data) {
        return selection.selectAll('rect')
          .data(data, this.key);
      },
      
      // Override StandardLayer
      onInsert: function onInsert(selection) {
        return selection.append('rect')
          .on('mouseenter', this.mouseEnterPoint)
          .on('mouseleave', this.mouseLeavePoint);
      },

      // Override StandardLayer
      onEnter: function onEnter(selection) {
        selection
          .attr('y', this.y0())
          .attr('height', 0);
      },

      // Override StandardLayer
      onMerge: function onMerge(selection) {
        selection
          .attr('class', this.barClass)
          .attr('style', this.itemStyle)
          .attr('x', this.barX)
          .attr('width', this.barWidth);
      },

      // Override StandardLayer
      onMergeTransition: function onMergeTransition(selection) {
        this.setupTransition(selection);

        selection
          .attr('y', this.barY)
          .attr('height', this.barHeight);
      },

      // Override StandardLayer
      onExit: function onExit(selection) {
        selection.remove();
      }
    }
  ));

  /**
    Stacked Bars

    @class StackedBars
  */
  charts.StackedBars = charts.Bars.extend('StackedBars', {
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

  /**
    Horizontal Bars

    @class HorizontalBars
  */
  charts.HorizontalBars = charts.Bars.extend('HorizontalBars', mixin(mixins.InvertedXY, {
    barX: di(function(chart, d, i) {
      var x = chart.x.call(this, d, i);
      var x0 = chart.x0();

      return x < x0 ? x : x0 + chart.barOffset();
    }),
    barY: di(function(chart, d, i) {
      return chart.y.call(this, d, i) - chart.itemWidth() / 2;
    }),
    barWidth: di(function(chart, d, i) {
      var width = Math.abs(chart.x0() - chart.x.call(this, d, i)) - chart.barOffset();
      return width > 0 ? width : 0;
    }),
    barHeight: di(function(chart, d, i) {
      return chart.itemWidth();
    }),

    onEnter: function onEnter(selection) {
      selection
        .attr('x', this.x0())
        .attr('width', 0);
    },
    
    onMerge: function onMerge(selection) {
      selection
        .attr('class', this.barClass)
        .attr('style', this.itemStyle)
        .attr('y', this.barY)
        .attr('height', this.barHeight);
    },
    
    onMergeTransition: function onMergeTransition(selection) {
      this.setupTransition(selection);

      selection
        .attr('x', this.barX)
        .attr('width', this.barWidth);
    },
  }));

  /**
    Horizontal Stacked Bars

    @class HorizontalStackedBars
  */
  charts.HorizontalStackedBars = charts.HorizontalBars.extend('HorizontalStackedBars', {
    transform: function(data) {
      // Re-initialize bar positions each time data changes
      this.bar_positions = [];
      return data;
    },

    barWidth: di(function(chart, d, i) {
      var width = Math.abs(chart.x0() - chart.x.call(this, d, i));
      var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
      return width > 0 ? width - offset : 0;
    }),
    barX: di(function(chart, d, i) {
      var x = chart.x.call(this, d, i);
      var x0 = chart.x0();

      // Only handle positive x-values
      if (x < x0) return;

      if (chart.bar_positions.length <= i)
        chart.bar_positions.push(0);

      var previous = chart.bar_positions[i] || x0;
      var new_position = previous + (x - x0);

      chart.bar_positions[i] = new_position;

      return previous;
    })
  });

})(d3, d3.compose.helpers, d3.compose.mixins, d3.compose.charts);
