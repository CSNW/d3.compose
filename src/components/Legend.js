(function(d3, helpers, extensions) {
  var mixin = helpers.mixin;
  var property = helpers.property;
  var di = helpers.di;

  /**
    Legend
  */
  d3.chart('Component').extend('Legend', {
    initialize: function() {
      this.legend = this.base.append('g')
        .classed('chart-legend', true);

      if (this.options().display) {
        this.layer('Legend', this.legend, {
          dataBind: function(data) {
            var chart = this.chart();
            return this.selectAll('g')
              .data(data, chart.dataKey.bind(chart));
          },
          insert: function() {
            var chart = this.chart();
            var groups = this.append('g')
              .attr('class', chart.dataGroupClass);

            groups.append('g')
              .attr('width', 20)
              .attr('height', 20)
              .attr('class', 'chart-legend-swatch');
            groups.append('text')
              .attr('class', 'chart-legend-label chart-label')
              .attr('transform', helpers.translate(25, 0));
            
            return groups;
          },
          events: {
            merge: function() {
              var chart = this.chart();

              this.select('g').each(chart.createSwatch);
              this.select('text')
                .text(chart.dataValue)
                .attr('alignment-baseline', 'before-edge');

              // Position groups after positioning everything inside
              var directionByPosition = {
                top: 'horizontal',
                right: 'vertical',
                bottom: 'horizontal',
                left: 'vertical'
              };
              this.call(helpers.stack.bind(this, {direction: directionByPosition[chart.position()], origin: 'top', padding: 5}));
            }
          }
        });
      }
      else {
        this.skipLayout = true;
      }
    },
    isLegend: true,

    transform: function(allData) {
      var extractData = d3.chart('Multi').prototype.extractData;
      var data = _.reduce(this.options().charts, function(data, chart) {
        if (chart.excludeFromLegend)
          return data;

        var chartData = _.compact(_.map(extractData(chart, allData), function(series, index) {
          if (series.excludeFromLegend) return;
          
          return {
            chart: chart,
            series: series,
            seriesIndex: index
          };
        }));

        return data.concat(chartData);
      }, [], this);
      
      return data;
    },

    dataKey: di(function(chart, d, i) {
      return d.chart.id + '.' + d.series.name;
    }),
    dataValue: di(function(chart, d, i) {
      return d.series.name;
    }),
    dataGroupClass: di(function(chart, d, i) {
      return 'chart-legend-group';
    }),
    dataSeriesClass: di(function(chart, d, i) {
      return 'chart-series chart-index-' + (d.seriesIndex || 0);
    }),
    dataClass: di(function(chart, d, i) {
      var classes = [chart.dataSeriesClass.call(this, d, i)];
      if (d.chart.options()['class'])
        classes.push(d.chart.options()['class']);
      if (d.series['class'])
        classes.push(d.series['class']);

      return classes.join(' ') || null;
    }),
    dataStyle: di(function(chart, d, i) {
      var styles = _.defaults({}, d.series.style, d.chart.options().style);
      
      return helpers.style(styles) || null;
    }),

    createSwatch: di(function(chart, d, i) {
      var selection = d3.select(this);

      // Clear existing swatch
      selection.empty();
      selection
        .attr('class', chart.dataClass);

      var inserted;
      if (d && d.chart && _.isFunction(d.chart.insertSwatch)) {
        selection.chart = function() { return chart; };
        inserted = d.chart.insertSwatch.call(selection);
      }
      else {
        // Simple colored circle
        inserted = selection.append('circle')
          .attr('cx', 10)
          .attr('cy', 10)
          .attr('r', 10)
          .attr('class', 'chart-swatch');
      }

      // Style inserted element
      if (inserted && _.isFunction(inserted.attr)) {
        inserted.attr('style', chart.dataStyle.call(this, d, i));
      }
    })
  });
  
  /**
    Inset legend
    Legend positioned within chart bounds

    Properties:
    - {Object} position {x,y} coordinates of legend origin relative chart bounds
  */
  d3.chart('Legend').extend('InsetLegend', {
    initialize: function() {
      this._positionLegend();
    },

    position: property('position', {
      defaultValue: {x: 10, y: 10},
      set: function(value, previous) {
        value = (value && _.isObject(value)) ? value : {};
        value = _.defaults(value, previous || {}, {x: 0, y: 0});

        return {
          override: value,
          after: function() {
            this._positionLegend();
          }
        };
      }
    }),
    skipLayout: true,

    _positionLegend: function() {
      if (this.legend) {
        var position = this.position();
        this.legend.attr('transform', helpers.translate(position.x, position.y));
      }
    }
  });
  
})(d3, d3.chart.helpers, d3.chart.extensions);
