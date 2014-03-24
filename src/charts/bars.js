(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  // Bars: Bar graph with centered key,value data and adjacent display for series
  d3.chart('ChartWithLabels')
    .mixin(extensions.XY, extensions.Values)
    .extend('Bars', {
      initialize: function() {
        this.seriesLayer('Bars', this.base.append('g').classed('bar-chart', true), {
          dataBind: function(data) {
            var chart = this.chart();
            return this.selectAll('rect')
              .data(data, chart.keyValue.bind(chart));
          },
          insert: function() {
            return this.append('rect')
              .classed('bar', true);
          },
          events: {
            'enter': function() {
              var chart = this.chart();
              this
                  .attr('x', chart.barX.bind(chart))
                  .attr('y', chart.y0.bind(chart))
                  .attr('width', chart.itemWidth.bind(chart))
                  .attr('height', 0);
            },
            'merge:transition': function() {
              var chart = this.chart();
              this
                  .attr('y', chart.barY.bind(chart))
                  .attr('height', chart.barHeight.bind(chart));
            }
          }
        });
      },
      barHeight: function(d, i) {
        return Math.abs(this.y0(d, i) - this.y(d, i));
      },
      barX: function(d, i) {
        return this.itemX(d, i) - this.itemWidth(d, i) / 2;
      },
      barY: function(d, i) {
        var y = this.y(d, i);
        var y0 = this.y0();
        
        return y < y0 ? y : y0;
      },
      displayAdjacent: property('displayAdjacent', {defaultValue: true})
    });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
