(function(d3) {
  'use strict';

  d3.chart('Base', {
    width: function width() {
      return dimensions(this).width;
    },
    height: function height() {
      return dimensions(this).height;
    },
    data: property({
      set: function(data) {
        this.trigger('change:data', data);
      }
    })
  });

  d3.chart('Base').extend('Container', {
    initialize: function() {
      this.base.classed('chart', true);
      this.chartBase(this.base.append('g').classed('chart-base', true));

      this.updateDimensions();
      this.on('change:dimensions', function() {
        this.updateDimensions();
        this.redraw();
      });
    },

    updateDimensions: function() {
      var bounds = this.bounds();

      this.base
        .attr('width', this.width())
        .attr('height', this.height());
      this.chartBase()
        .attr('transform', 'translate(' + bounds.left + ', ' + bounds.top + ')')
        .attr('width', bounds.width)
        .attr('height', bounds.height);
    },
    redraw: function() {
      if (this.rawData())
        this.draw(this.rawData());
    },

    transform: function(data) {
      this.rawData(data);
      return data;
    },
    rawData: property(),

    chartBase: property(),
    bounds: property({
      get: function(values) {
        values = (values && typeof values == 'object') ? values : {};
        values = {
          top: values.top || 0,
          right: values.right || 0,
          bottom: values.bottom || 0,
          left: values.left || 0
        };
        values.width = this.width() - values.left - values.right;
        values.height = this.height() - values.top - values.bottom;

        return values;
      },
      set: function(values, previous) {
        values = (values && typeof values == 'object') ? values : {};
        previous = previous || {};

        values = {
          top: values.top || previous.top || 0,
          right: values.right || previous.right || 0,
          bottom: values.bottom || previous.bottom || 0,
          left: values.left || previous.left || 0
        };

        return {
          override: values,
          after: function() {
            this.trigger('change:dimensions');
          }
        };
      }
    }),
    width: property({
      get: function(value) {
        return value != null ? value : dimensions(this).width;
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    }),
    height: property({
      get: function(value) {
        return value != null ? value : dimensions(this).height;
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    })
  });

  d3.chart('Base').extend('XYBase', {
    initialize: function() {
      this.on('change:data', this.setScales);
    },

    x: function(d, i) {
      return this.xScale()(this.xValue(d, i));
    },
    y: function(d, i) {
      return this.yScale()(this.yValue(d, i));
    },

    xValue: function(d, i) {
      return d.x;
    },
    yValue: function(d, i) {
      return d.y;
    },
    keyValue: function(d, i) {
      return d.key;
    },

    setScales: function() {
      var xScale = this.setXScale(this.xScale() || d3.scale.linear(), this.data() || [], this);
      var yScale = this.setYScale(this.yScale() || d3.scale.linear(), this.data() || [], this);

      this.xScale(xScale).yScale(yScale);
    },
    setXScale: function(xScale, data, chart) {
      var xMax = d3.extent(data, chart.xValue)[1];
      return xScale.domain([0, xMax]).range([0, chart.width()]);
    },
    setYScale: function(yScale, data, chart) {
      var yMax = d3.extent(data, chart.yValue)[1];
      return yScale.domain([0, yMax]).range([chart.height(), 0]);
    },
    xScale: property({type: 'function'}),
    yScale: property({type: 'function'})
  });
  
  // (Maybe intermediate value base?)
  d3.chart('XYBase').extend('CenteredValueBase', {
    transform: function(data) {
      return data.map(function(item, index) {
        var value = typeof item == 'object' ? item.value : item;
        var key = typeof item == 'object' ? item.key || item.name : null;
        return {x: index, y: value, key: key};
      });
    },

    setXScale: function(xScale, data, chart) {
      var left = chart.itemWidth() / 2;
      var right = chart.width() - chart.itemWidth() / 2;

      return d3.chart('XYBase').prototype.setXScale.call(this, xScale, data, chart).range([left, right]);
    },

    itemWidth: function(d, i) {
      var count = this.data() ? this.data().length : 0;
      if (count > 0)
        return (this.width() - this.itemPadding() * (count - 1)) / count;
      else
        return this.width();
    },
    itemPadding: property({
      get: function(value) {
        return value != null ? value : 0;
      }
    })
  });

  d3.chart('CenteredValueBase').extend('BarChart', {
    initialize: function() {
      this.layer('BarChart', this.base.append('g').classed('bar-chart', true), {
        dataBind: function(data) {
          var chart = this.chart();
          chart.data(data);
          return this.selectAll('rect')
            .data(data, chart.keyValue);
        },
        insert: function() {
          return this.append('rect')
            .classed('bar', true);
        },
        events: {
          merge: function() {
            var chart = this.chart();
            this
              .attr('width', chart.itemWidth.bind(chart))
              .attr('height', chart.barHeight.bind(chart))
              .attr('x', chart.barX.bind(chart))
              .attr('y', chart.y.bind(chart));
          }
        }
      });
    },

    barHeight: function(d, i) {
      return this.height() - this.y(d, i);
    },
    barX: function(d, i) {
      return this.x(d, i) - this.itemWidth() / 2;
    }
  });
  
  // https://github.com/misoproject/d3.chart/issues/30
  d3.chart('CenteredValueBase').extend('LineChart', {
    initialize: function() {
      var line = d3.svg.line()
        .x(this.x.bind(this))
        .y(this.y.bind(this));

      this.layer('LineChart', this.base.append('g').classed('line-chart', true), {
        dataBind: function(data) {
          var chart = this.chart();
          chart.data(data);
          return this.selectAll('path')
            .data([data]);
        },
        insert: function() {
          return this.append('path')
            .classed('line', true);
        },
        events: {
          merge: function() {
            this.attr('d', line);
          }
        }
      })
    }
  });

  d3.chart('CenteredValueBase').extend('PointChart', {
    initialize: function() {
      this.layer('PointChart', this.base.append('g').classed('point-chart', true), {
        dataBind: function(data) {
          var chart = this.chart();
          chart.data(data);
          return this.selectAll('circle')
            .data(data, chart.dataKey);
        },
        insert: function() {
          return this.append('circle')
            .classed('point', true);
        },
        events: {
          merge: function() {
            var chart = this.chart();
            this
              .attr('r', 3)
              .attr('cx', chart.x.bind(chart))
              .attr('cy', chart.y.bind(chart));
          }
        }
      });
    }
  });

  d3.chart('Container').extend('SimpleBarChart', {
    initialize: function() {
      this.charts = {
        'BarChart': this.chartBase().chart('BarChart')
      };

      this.attach('BarChart', this.charts['BarChart']);
      this.bounds({top: 10, right: 10, bottom: 40, left: 10});
    },
    itemPadding: property({
      set: function(value) {
        this.charts['BarChart'].itemPadding(value);
        this.trigger('change:dimensions');
      }
    })
  });

  d3.chart('Container').extend('LineBarChart', {
    initialize: function() {
      this.charts = {
        'BarChart': this.chartBase().chart('BarChart'),
        'LineChart': this.chartBase().chart('LineChart'),
        'PointChart': this.chartBase().chart('PointChart')
      };

      this.attach('BarChart', this.charts['BarChart']);
      this.attach('LineChart', this.charts['LineChart']);
      this.attach('PointChart', this.charts['PointChart']);
      this.bounds({top: 10});
    },
    itemPadding: property({
      set: function(value) {
        this.charts['BarChart'].itemPadding(value);
        this.charts['LineChart'].itemPadding(value);
        this.charts['PointChart'].itemPadding(value);
        this.trigger('change:dimensions');
      }
    })
  });

  function property(options) {
    options = options || {};
    var underlying;

    return function(value) {
      if (!arguments.length) {
        if (underlying && typeof underlying == 'function' && options.type != 'function')
          value = underlying.call(this);
        else
          value = underlying;

        if (typeof options.get == 'function')
          return options.get.call(this, value);
        else
          return value;
      }

      var previous = underlying;
      underlying = value;
      
      if (typeof options.set == 'function') {
        var response = options.set.call(this, value, previous);
        if (response && response.override)
          underlying = response.override;
        if (response && response.after)
          response.after.call(this, underlying);
      }

      return this;
    };
  }

  function dimensions(chart) {
    var element = chart.base && chart.base.length && chart.base[0] && chart.base[0].length && chart.base[0][0];

    return {
      width: parseFloat((chart.base && chart.base.attr('width')) || element.clientWidth),
      height: parseFloat((chart.base && chart.base.attr('height')) || element.clientHeight)
    };
  }
}(d3));
