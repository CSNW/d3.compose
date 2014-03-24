(function(d3, _, helpers, extensions) {
  var property = helpers.property;

  // Labels: Chart with labels positioned at (x,y) points
  d3.chart('Chart')
    .mixin(extensions.XY)
    .extend('Labels', {
      initialize: function() {
        this.seriesLayer('Labels', this.base.append('g').classed('labels', true), {
          dataBind: function(data) {
            var chart = this.chart();
            return this.selectAll('text')
              .data(data, chart.keyValue.bind(chart));
          },
          insert: function() {
            var chart = this.chart();

            // TODO: set font-family, font-size in style to override css

            return this.append('text')
              .classed('label', true)
              .attr('font-family', chart.labelFontFamily())
              .attr('font-size', chart.labelFontSize());
          },
          events: {
            'enter': function() {
              var chart = this.chart();
              this
                .attr('x', chart.labelX.bind(chart))
                .attr('y', chart.y0.bind(chart))
                .attr('text-anchor', chart.labelAnchor.bind(chart))
                .text(0);
            },
            'merge:transition': function() {
              var chart = this.chart();
              this
                .attr('y', chart.labelY.bind(chart))
                .text(chart.yValue.bind(chart));
            }
          }
        });
      },

      labelX: function(d, i) {
        return this.x(d, i) + this.calculatedLabelOffset().x;
      },
      labelY: function(d, i) {
        return this.y(d, i) + this.calculatedLabelOffset().y;
      },

      calculatedLabelOffset: function() {
        var fontSize = parseFloat(this.labelFontSize());
        var offset = this.labelOffset();

        var byPosition = {
          top: {x: 0, y: -offset},
          right: {x: offset, y: (fontSize/2)},
          bottom: {x: 0, y: offset + fontSize},
          left: {x: -offset, y: (fontSize/2)}
        };
        
        return byPosition[this.labelPosition()];
      },
      labelAnchor: function() {
        if (this.labelPosition() == 'right')
          return 'start';
        else if (this.labelPosition() == 'left')
          return 'end';
        else
          return 'middle';
      },

      // top, right, bottom, left
      labelPosition: property('labelPosition', {defaultValue: 'top'}),
      // px distance offset from (x,y) point
      labelOffset: property('labelOffset', {defaultValue: 14}),

      // Font size, px
      labelFontSize: property('labelFontSize', {
        defaultValue: 14,
        get: function(value) {
          // Make sure returned value is a string (add px if number)
          return _.isNumber(value) ? value + 'px' : value;
        }
      }),
      labelFontFamily: property('labelFontFamily', {defaultValue: 'sans-serif'})
    });
  
  // LabelValues: Chart with labels for centered values
  d3.chart('Chart')
    .mixin(d3.chart('Labels').prototype, extensions.Values)
    .extend('LabelValues', {
      labelX: function(d, i) {
        return this.itemX(d, i) + this.calculatedLabelOffset().x;
      }
    });

  // ChartWithLabels: Chart with labels attached
  d3.chart('Chart').extend('ChartWithLabels', {
    initialize: function() {
      if (this.showLabels()) {
        // Create labels chart
        this.labels = this.base.chart(this.isValues ? 'LabelValues' : 'Labels', this.options);  

        // Transfer certain properties to labels
        if (this.labels.displayAdjacent && this.displayAdjacent)
          this.labels.displayAdjacent(this.displayAdjacent());

        // Attach labels chart
        this.attach('Labels', this.labels);
      }
    },
    showLabels: property('showLabels', {defaultValue: true})
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
