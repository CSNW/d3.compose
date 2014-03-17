(function(d3, _) {
  'use strict';

  d3.chart('Base', {
    width: function width() {
      return dimensions(this).width;
    },
    height: function height() {
      return dimensions(this).height;
    },
    data: property('data', {
      set: function(data) {
        this.trigger('change:data', data);
      }
    }),
    attachCharts: function(charts) {
      _.each(charts, function(chart, name) {      
        this.attach(name, chart);
      }, this);
    },
    wrapProperties: function(charts, properties, options) {
      options = options || {};
      _.each(properties, function(prop) {
        this[prop] = property(prop, {
          set: function(value) {
            _.each(charts, function(chart) {
              chart[prop].call(chart, value);
            });

            if (options.set)
              options.set.call(this, value);
          }
        });
      }, this);
    }
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
    rawData: property('rawData'),

    chartBase: property('chartBase'),
    bounds: property('bounds', {
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
    width: property('width', {
      get: function(value) {
        return value != null ? value : dimensions(this).width;
      },
      set: function(value) {
        this.trigger('change:dimensions');
      }
    }),
    height: property('height', {
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
      var xScale = this.xScale() || d3.scale.linear().domain([this.xMin(), this.xMax()]);
      var yScale = this.yScale() || d3.scale.linear().domain([this.yMin(), this.yMax()]);

      xScale = this.setXScaleRange(xScale, this.data() || [], this);
      yScale = this.setYScaleRange(yScale, this.data() || [], this);
      
      this.xScale(xScale).yScale(yScale);
    },
    setXScaleRange: function(xScale, data, chart) {
      return xScale.range([0, chart.width()]);
    },
    setYScaleRange: function(yScale, data, chart) {
      return yScale.range([chart.height(), 0]);
    },

    xScale: property('xScale', {type: 'function'}),
    yScale: property('yScale', {type: 'function'}),
    xMin: property('xMin', {
      get: function(value) {
        // Default behavior: if min is less than zero, use min, otherwise use 0
        var min = d3.extent(this.data(), this.xValue)[0];
        return value != null ? value : (min < 0 ? min : 0);
      }
    }),
    xMax: property('xMax', {
      get: function(value) {
        var max = d3.extent(this.data(), this.xValue)[1];
        return value != null ? value : max;
      }
    }),
    yMin: property('yMin', {
      get: function(value) {
        // Default behavior: if min is less than zero, use min, otherwise use 0
        var min = d3.extent(this.data(), this.yValue)[0]
        return value != null ? value : (min < 0 ? min : 0);
      }
    }),
    yMax: property('yMax', {
      get: function(value) {
        return value != null ? value : d3.extent(this.data(), this.yValue)[1];
      }
    })
  });
  
  d3.chart('XYBase').extend('ValueBase', {
    transform: function(data) {
      return data.map(function(item, index) {
        var value = typeof item == 'object' ? item.value || item.y : item;
        var key = typeof item == 'object' ? item.key || item.name : null;
        return {x: index, y: value, key: key};
      });
    }
  });

  d3.chart('ValueBase').extend('CenteredValueBase', {
    setXScaleRange: function(xScale, data, chart) {
      var left = chart.itemWidth() / 2;
      var right = chart.width() - chart.itemWidth() / 2;

      return xScale.range([left, right]);
    },

    itemWidth: function(d, i) {
      var count = this.data() ? this.data().length : 0;
      if (count > 0)
        return (this.width() - this.itemPadding() * (count - 1)) / count;
      else
        return this.width();
    },
    itemPadding: property('itemPadding', {
      get: function(value) {
        return value != null ? value : 0;
      }
    })
  });

  d3.chart('CenteredValueBase').extend('BarChart', {
    initialize: function(options) {
      options = options || {};
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

  // Example: https://github.com/misoproject/d3.chart/issues/30
  d3.chart('CenteredValueBase').extend('CenteredLineChart', {
    initialize: function(options) {
      options = options || {};
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

  d3.chart('CenteredValueBase').extend('CenteredDataLabelsChart', {
    // Add circles (temporarily)
    initialize: function(options) {
      options = options || {};
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

  d3.chart('CenteredValueBase').extend('CenteredLineChartWithLabels', {
    initialize: function(options) {
      options = options || {};
      this.charts = {
        'Line': this.base.chart('CenteredLineChart', options.Line),
        'DataLabels': this.base.chart('CenteredDataLabelsChart', options.DataLabels)
      };

      this.attachCharts(this.charts);
      this.wrapProperties(this.charts, ['xScale', 'xMin', 'xMax', 'yScale', 'yMin', 'yMax', 'itemPadding']);
    }
  })

  d3.chart('Container').extend('SimpleBarChart', {
    initialize: function(options) {
      options = options || {};
      this.charts = {
        'Bars': this.chartBase().chart('BarChart', options.Bars)
      };

      this.attachCharts(this.charts);
      this.bounds({top: 10, right: 10, bottom: 40, left: 10});
    },
    itemPadding: property('itemPadding', {
      set: function(value) {
        this.charts['BarChart'].itemPadding(value);
        this.trigger('change:dimensions');
      }
    })
  });

  d3.chart('Container').extend('LineBarChart', {
    initialize: function(options) {
      options = options || {};
      this.charts = {
        'Bars': this.chartBase().chart('BarChart', options.Bars),
        'Line': this.chartBase().chart('CenteredLineChartWithLabels', options.Line)
      };

      this.attachCharts(this.charts);
      this.wrapProperties(this.charts, ['itemPadding'], {
        set: function(value) {
          this.trigger('change:dimensions');
        }
      });

      this.bounds({top: 10, right: 10, bottom: 0, left: 10});
    },
    demux: function(name, data) {
      if (!_.isObject(data))
        return data;
      else
        return data[name];
    }
  });

  function property(name, options) {
    var prop_key = '__properties'
    options = options || {};
    
    function get(context) {
      return context[prop_key] ? context[prop_key][name] : null;
    }
    function set(context, value) {
      context[prop_key] = context[prop_key] || {};
      context[prop_key][name] = value;
    }

    return function(value) {
      var underlying = get(this);
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
      set(this, value);
      
      if (typeof options.set == 'function') {
        var response = options.set.call(this, value, previous);
        if (response && response.override)
          set(this, response.override);
        if (response && response.after)
          response.after.call(this, get(this));
      }

      return this;
    };
  }

  function dimensions(chart) {
    var element = chart.base && chart.base.length && chart.base[0] && chart.base[0].length && chart.base[0][0];

    return {
      width: parseFloat((chart.base && chart.base.attr('width')) || (element && element.clientWidth) || 0),
      height: parseFloat((chart.base && chart.base.attr('height')) || (element && element.clientHeight) || 0)
    };
  }
}(d3, _));
