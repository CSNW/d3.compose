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
              .attr('font-size', chart.labelFontSize())
              .attr('alignment-baseline', chart.labelAlignment.bind(chart));
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
        return this.x(d, i) + this.calculatedLabelOffset(d, i).x;
      },
      labelY: function(d, i) {
        return this.y(d, i) + this.calculatedLabelOffset(d, i).y;
      },

      calculatedLabelOffset: function(d, i) {
        var offset = this.labelOffset();

        var byPosition = {
          top: {x: 0, y: -offset},
          right: {x: offset, y: 0},
          bottom: {x: 0, y: offset},
          left: {x: -offset, y: 0}
        };
        
        return byPosition[this.calculatedLabelPosition(d, i)];
      },
      labelAnchor: function(d, i) {
        if (this.calculatedLabelPosition(d, i) == 'right')
          return 'start';
        else if (this.calculatedLabelPosition(d, i) == 'left')
          return 'end';
        else
          return 'middle';
      },
      labelAlignment: function(d, i) {
        // Set alignment-baseline so that font size does not play into calculations
        // http://www.w3.org/TR/SVG/text.html#BaselineAlignmentProperties
        var byPosition = {
          top: 'after-edge',
          right: 'middle',
          bottom: 'before-edge',
          left: 'middle'
        };

        return byPosition[this.calculatedLabelPosition(d, i)];
      },

      calculatedLabelPosition: function(d, i) {
        var position = this.labelPosition();
        if (position == 'top|bottom')
          return this.yValue(d, i) >= 0 ? 'top' : 'bottom';
        else if (position == 'right|left')
          return this.xValue(d, i) >= 0 ? 'right' : 'left';
        else
          return position;
      },

      // top, right, bottom, left, 
      // top|bottom (above for positive, below for negative), 
      // right|left (right for positive, left for negative)
      labelPosition: property('labelPosition', {defaultValue: 'top'}),
      // px distance offset from (x,y) point
      labelOffset: property('labelOffset', {defaultValue: 14}),

      // Font size, px
      labelFontSize: property('labelFontSize', {defaultValue: '14px'}),
      labelFontFamily: property('labelFontFamily', {defaultValue: 'sans-serif'})
    });
  
  // LabelValues: Chart with labels for centered values
  d3.chart('Chart')
    .mixin(d3.chart('Labels').prototype, extensions.Values)
    .extend('LabelValues', {
      labelX: function(d, i) {
        return this.itemX(d, i) + this.calculatedLabelOffset(d, i).x;
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
