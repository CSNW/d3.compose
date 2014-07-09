(function(d3, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Bars
    Bar graph with centered key,value data and adjacent display for series
  */
  d3.chart('ChartWithLabels').extend('Bars', mixin(extensions.ValuesSeries, {
    initialize: function() {
      this.seriesLayer('Bars', this.base.append('g').classed('chart-bars', true), {
        dataBind: function(data) {
          var chart = this.chart();

          return this.selectAll('rect')
            .data(data, chart.keyValue);
        },
        insert: function() {
          var chart = this.chart();

          return this.append('rect')
            .classed('chart-bar', true)
            .attr('style', chart.itemStyle);
        },
        events: {
          'enter': function() {
            var chart = this.chart();

            if (!chart.invertedXY()) {
              this
                .attr('x', chart.barX)
                .attr('y', chart.y0)
                .attr('width', chart.itemWidth)
                .attr('height', 0);  
            }
            else {
              this
                .attr('x', chart.x0)
                .attr('y', chart.barY)
                .attr('width', 0)
                .attr('height', chart.itemWidth);   
            }
          },
          'merge:transition': function() {
            var chart = this.chart();

            if (!chart.invertedXY()) {
              this
                .attr('y', chart.barY)
                .attr('height', chart.barHeight);
            }
            else {
              this
                .attr('x', chart.barX)
                .attr('width', chart.barHeight);
            }
          }
        }
      });

      this.attachLabels();
    },

    barHeight: di(function(chart, d, i) {
      if (chart.invertedXY()) {
        return Math.abs(chart.x.call(this, d, i) - chart.x0.call(this, d, i));
      }
      else {
        var height = Math.abs(chart.y0.call(this, d, i) - chart.y.call(this, d, i)); 
        return height > 0 ? height - chart.barOffset() : 0;
      }
    }),
    barX: di(function(chart, d, i) {
      if (chart.invertedXY()) {
        var x = chart.x.call(this, d, i);
        var x0 = chart.x0();

        return x < x0 ? x : x0 + chart.barOffset();
      }
      else {
        return chart.x.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
      }
    }),
    barY: di(function(chart, d, i) {
      if (chart.invertedXY()) {
        return chart.y.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
      }
      else {
        var y = chart.y.call(this, d, i);
        var y0 = chart.y0();

        return y < y0 ? y : y0 + chart.barOffset();
      }
    }),
    displayAdjacent: property('displayAdjacent', {defaultValue: true}),

    barOffset: function barOffset() {
      if (!this.__axis) {
        if (!this.invertedXY())
          this.__axis = d3.select(this.base[0][0].parentNode).select('[data-id="axis.x"] .domain');
        else
          this.__axis = d3.select(this.base[0][0].parentNode).select('[data-id="axis.y"] .domain');
      }
      
      var axisThickness = this.__axis[0][0] && parseInt(this.__axis.style('stroke-width')) || 0;
      return axisThickness / 2;
    },

    insertSwatch: function() {
      return this.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', 20).attr('height', 20)
        .attr('class', 'chart-bar');
    }
  }));
  
  /**
    Stacked Bars
  */
  d3.chart('Bars').extend('StackedBars', {
    initialize: function() {
      this.barPositions = [];
    },

    barHeight: di(function(chart, d, i) {
      if (chart.invertedXY()) {
        return Math.abs(chart.x.call(this, d, i) - chart.x0.call(this, d, i));
      }
      else {
        var height = Math.abs(chart.y0.call(this, d, i) - chart.y.call(this, d, i));
        var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
        return height > 0 ? height - offset : 0;
      }
    }),
    barX: di(function(chart, d, i) {
      if (chart.invertedXY()) {
        var x = chart.x.call(this, d, i);
        var x0 = chart.x0();

        // Only handle positive x-values
        if (x < x0) return;

        if (chart.barPositions.length <= i)
          chart.barPositions.push(0);

        var previous = chart.barPositions[i];
        chart.barPositions[i] = previous + (x - x0);

        var offset = chart.seriesIndex.call(this, d, i) === 0 ? chart.barOffset() : 0;
        return previous + offset;
      }
      else {
        return chart.x.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
      }
    }),
    barY: di(function(chart, d, i) {
      if (chart.invertedXY()) {
        return chart.y.call(this, d, i) - chart.itemWidth.call(this, d, i) / 2;
      }
      else {
        var y = chart.y.call(this, d, i);
        var y0 = chart.y0();

        // Only handle positive y-values
        if (y > y0) return;

        if (chart.barPositions.length <= i)
          chart.barPositions.push(0);

        var previous = chart.barPositions[i] || y0;
        var newPosition = previous - (y0 - y);

        chart.barPositions[i] = newPosition;
        
        return newPosition;
      }
    }),

    displayAdjacent: property('displayAdjacent', {defaultValue: false})
  });

})(d3, d3.chart.helpers, d3.chart.extensions);
