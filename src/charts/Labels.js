(function(d3, _, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Labels
  */
  d3.chart('Chart').extend('Labels', {
    initialize: function() {
      this.displayedLabels = [];
      this.on('change:data', function(data) {
        this.displayedLabels = _.toArray(data);
      });

      this.layer('Labels', this.base.append('g').classed('chart-hover-labels', true), {
        dataBind: function(data) {
          var chart = this.chart();
          var series = this.selectAll('g')
            .data(data, chart.seriesKey);

          series.enter()
            .append('g')
            .attr('class', chart.seriesClass);

          return series.selectAll('g')
            .data(chart.seriesLabels, chart.labelKey);
        },
        insert: function() {
          var groups = this.append('g');

          groups.append('rect')
            .classed('chart-label-bg', true);
          groups.append('text')
            .classed('chart-label', true);

          return groups;
        },
        events: {
          'enter': function() {
            // Start at 0 opacity
            this.select('rect').style('opacity', 0);
            this.select('text').style('opacity', 0);
          },
          'update': function() {

          },
          'merge': function() {
            var chart = this.chart();

            // 1. Draw all labels
            chart.drawLabels(this);

            // 2. Remove overlapping labels within series
            chart.removeLabels(this);

            // 3. Group overlapping labels between series
            chart.groupLabels(this);
          },
          'enter:transition': function() {
            // Fade-in
            this.select('rect').style('opacity', 0.5);
            this.select('text').style('opacity', 1);
          },
          'exit:transition': function() {
            // Fade-out
            this.select('rect').style('opacity', 0).remove();
            this.select('text').style('opacity', 0).remove();
          }
        }
      })
    },

    displayedLabels: property('displayedLabels', []),

    labelKey: di(function(chart, d, i) { return d.key; }),
    labelX: di(function(chart, d, i) { return d.x; }),
    labelY: di(function(chart, d, i) { return d.y; }),
    labelText: di(function(chart, d, i) { return d.value; }),
    labelAnchor: di(function(chart, d, i) { return d.anchor; }),

    seriesKey: di(function(chart, d, i) {
      return d.key || i;
    }),
    seriesClass: di(function(chart, d, i) {
      var seriesIndex = !_.isUndefined(d.index) ? 'chart-index-' + d.index : '';
      var seriesClass = d['class'] ? ' ' + d['class'] : '';

      return _.compact(['chart-series', seriesIndex, seriesClass]).join(' ');
    }),
    seriesLabels: di(function(chart, d, i) {
      return d.labels;
    }),

    transform: function(data) {
      // Get labels from container
      if (this.container && _.isFunction(this.container._getLabels)) {
        return this.container._getLabels();
      }
      else {
        return [];
      }
    },

    drawLabels: function(selection) {
      selection.each(this.drawLabel);
    },
    removeLabels: function(selection) {
      selection.call(function(data) {
        _.each(data, function(series, seriesIndex) {
          var prev;
          _.each(series, function(label, labelIndex) {
            if (this.checkForOverlap(prev, label))
              d3.select(label).remove();
            else
              prev = label;
          }, this);
        }, this);
      }.bind(this));
    },
    groupLabels: function(selection) {

    },

    drawLabel: di(function(chart, d, i) {
      var group = d3.select(this);
      var text = group.select('text');
      var rect = group.select('rect');

      text
        .attr('x', chart.labelX)
        .attr('y', chart.labelY)
        .attr('text-anchor', chart.labelAnchor)
        .text(chart.labelText);

      var labelBounds = text.node().getBBox();
      var offsets = {x: -1, y: 0, width: 3, height: 0};

      rect
        .attr('x', function(d, i) { return labelBounds.x + offsets.x - (d.padding || 0); })
        .attr('y', function(d, i) { return labelBounds.y + offsets.y - (d.padding || 0); })
        .attr('width', function(d, i) { return labelBounds.width +  offsets.width + 2 * (d.padding || 0); })
        .attr('height', function(d, i) { return labelBounds.height + offsets.height + 2 * (d.padding || 0); })
    }),

    checkForOverlap: function(a, b) {
      if (!a || !b || !_.isFunction(a.getBBox) || !_.isFunction(b.getBBox)) return false;

      var aBBox = a.getBBox();
      var box = b.getBBox();
      var x1 = aBBox.x;
      var x2 = aBBox.x + aBBox.width;
      var y1 = aBBox.y;
      var y2 = aBBox.y + aBBox.height;

      return ((box.x >= x1 && box.x <= x2) || (box.x + box.width >= x1 && box.x + box.width <= x2))
        && ((box.y >= y1 && box.y <= y2) || (box.y + box.height >= y1 && box.y + box.height <= y2));
    }
  });

  d3.chart('Chart').extend('HoverLabels', {
    initialize: function() {
      _.bindAll(this, 'onPointsEnter', 'onPointsMove', 'onPointsLeave');

      this.on('attached', function() {
        this.container.on('points:enter:mouse', this.onPointsEnter);
        this.container.on('points:move:mouse', this.onPointsMove);
        this.container.on('points:leave:mouse', this.onPointsLeave);
      });
      this.on('detached', function() {
        this.container.off('points:enter:mouse', this.onPointsEnter);
        this.container.off('points:move:mouse', this.onPointsMove);
        this.container.off('points:leave:mouse', this.onPointsLeave);
      });

      this.layer('HoverLabels', this.base.append('g').classed('chart-hover-labels', true), {
        dataBind: function(data) {
          return this.selectAll('g').data(data);
        },
        insert: function() {
          var group = this.append('g');

          group.append('circle')
            .attr('stroke', 'black')
            .attr('fill', 'black')
            .attr('r', 3);

          group.append('text')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'after-edge');

          return group;
        },
        events: {
          merge: function() {
            var chart = this.chart();

            this.select('circle')
              .attr('cx', chart.x)
              .attr('cy', chart.y);

            this.select('text')
              .attr('x', chart.x)
              .attr('y', function(d, i) {
                return chart.y.call(this, d, i) - 10;
              })
              .text(chart.text);
          },
          exit: function() {
            this.remove();
          }
        }
      });
    },

    draw: function() {
      // Override default draw call
      // (only want to draw on hover)
    },
    drawPoints: function(points) {
      d3.chart('Chart').prototype.draw.call(this, points);
    },

    onPointsEnter: function(points) {
      this.drawPoints(points);
    },
    onPointsMove: function(points) {
      this.drawPoints(points);
    },
    onPointsLeave: function() {
      this.drawPoints([]);
    },

    x: di(function(chart, d, i) {
      return d.coordinates.x;
    }),
    y: di(function(chart, d, i) {
      return d.coordinates.y;
    }),
    text: di(function(chart, d, i) {
      return d.values.y;
    })
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
