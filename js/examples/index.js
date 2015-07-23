/* global d3, d3c, _, examples */
/* eslint no-new-func:0, no-use-before-define:0 */
(function(examples) {

  function sequence(range, step) {
    var sequenced = [];

    for (var i = range[0]; i < range[1]; i += step) {
      sequenced.push(i);
    }
    sequenced.push(range[1]);

    return sequenced;
  }

  function generate(values, fn) {
    return values.map(function(x, i) {
      return {
        x: x,
        y: fn(x, i, values)
      };
    });
  }

  function random(range) {
    return Math.round(range[0] + Math.random() * (range[1] - range[0]));
  }

  function randomize(range) {
    return function() {
      return random(range);
    };
  }

  function increasing(min, step) {
    var value = min || 0;
    step = step || 10;

    return function() {
      value = random([value - (step / 4), value + (step / 4 * 3)]);
      return value;
    };
  }

  examples.data = {
    single: {
      series: [
        {
          key: 'control', name: 'Control', values: generate(sequence([0, 100], 10), randomize([0, 25]))
        },
        {
          key: 'results', name: 'Results', values: generate(sequence([0, 100], 10), function(x) { return 100 - 0.03 * Math.pow(x - 50, 2); })
        }
      ]
    },
    combined: {
      series: {
        input: [
          {
            key: 'input',
            name: 'Input',
            values: generate(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], increasing(150, 25))
          }
        ],
        output: [
          {
            key: 'control',
            name: 'Control',
            values: generate(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], randomize([0, 25]))
          },
          {
            key: 'results',
            name: 'Results',
            values: generate(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], randomize([0, 75]))
          }
        ]
      }
    }
  };

  //
  // Common Charts/Components
  //

  var codes = {
    data: code('options.data'),

    scales: {
      x: code('scales.x'),
      y: code('scales.y'),
      y2: code('scales.y2')
    },

    input: code('input'),
    output: code('output')
  };

  var common = {
    scale: function(type, options) {
      var defaults = {
        x: {data: codes.data, key: 'x'},
        xOrdinal: {type: 'ordinal', data: codes.data, key: 'x', adjacent: true},
        y: {data: codes.data, key: 'y'}
      }[type];

      return _.extend(defaults, options);
    },

    chart: function(type, options) {
      return _.extend({
        type: type,
        data: codes.data,
        xScale: codes.scales.x,
        yScale: codes.scales.y
      }, options);
    },

    axis: function(type, options) {
      return _.extend({
        scale: codes.scales[type],
        ticks: 5
      }, options);
    },

    title: function(options) {
      var text = code('options.title.text');

      if (!options)
        return text;
      else if (_.isString(options))
        return options;
      else
        return _.extend({text: text}, options);
    }
  };

  //
  // Lines
  //

  examples.lines = {
    generate: function(options) {
      var fn = buildFn(function() {
        var scales = {
          x: {data: options.data, key: 'x'},
          y: {data: options.data, key: 'y'}
        };

        var charts = [
          d3c.lines('results', {
            data: options.data,
            xScale: scales.x,
            yScale: scales.y
          })
        ];

        var title = d3c.title(options.title.text);
        var xAxis = d3c.axis('xAxis', {scale: scales.x, ticks: 5});
        var yAxis = d3c.axis('yAxis', {scale: scales.y, ticks: 5});

        return [
          title,
          [yAxis, d3c.layered(charts)],
          xAxis
        ];
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    options: {
      include: {
        xy: {
          name: 'Use d3.compose.xy',
          default_value: false
        },

        title: {
          name: 'Title',
          default_value: true,

          options: {
            text: {
              name: 'Chart Title Text',
              type: 'text',
              default_value: 'Lines Chart'
            }
          }
        }
      }
    },

    data: examples.data.single
  };

  //
  // Bars
  //

  examples.bars = {
    generate: function(options) {
      var fn = buildFn(function() {
        var scales = {
          x: {type: 'ordinal', data: options.data, key: 'x', adjacent: true},
          y: {data: options.data, key: 'y', domain: [0, 120]}
        };

        var charts = [
          d3c.bars('results', {
            data: options.data,
            xScale: scales.x,
            yScale: scales.y
          })
        ];

        var title = d3c.title(options.title.text);
        var xAxis = d3c.axis('xAxis', {scale: scales.x, ticks: 5});
        var yAxis = d3c.axis('yAxis', {scale: scales.y, ticks: 5});
        var legend = d3c.legend({charts: ['results']});

        return [
          title,
          [yAxis, d3c.layered(charts), legend],
          xAxis
        ];
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    options: {
      include: {
        title: {
          name: 'Title',
          default_value: true,

          options: {
            text: {
              name: 'Chart Title Text',
              type: 'text',
              default_value: 'Bars Chart'
            }
          }
        }
      }
    },

    data: examples.data.single
  };

  //
  // Stacked Bars
  //

  examples['stacked-bars'] = {
    generate: function(options) {
      var fn = buildFn(function() {
        var scales = {
          x: {type: 'ordinal', data: options.data, key: 'x', adjacent: false},
          y: {data: options.data, key: 'y', domain: [0, 120]}
        };

        var charts = [
          d3c.stackedBars('results', {
            data: options.data,
            xScale: scales.x,
            yScale: scales.y
          })
        ];

        var title = d3c.title('Stacked Bars');
        var xAxis = d3c.axis('xAxis', {scale: scales.x, ticks: 5});
        var yAxis = d3c.axis('yAxis', {scale: scales.y, ticks: 5});
        var legend = d3c.legend({charts: ['results']});

        return [
          title,
          [yAxis, d3c.layered(charts), legend],
          xAxis
        ];
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    options: {
      include: {
        title: {
          name: 'Title',
          default_value: true,

          options: {
            text: {
              name: 'Chart Title Text',
              type: 'text',
              default_value: 'Bars Chart'
            }
          }
        }
      }
    },
    data: examples.data.single
  };

  //
  // Horizontal Bars
  //

  examples['horizontal-bars'] = {
    generate: function(options) {
      var fn = buildFn(function() {
        var scales = {
          x: {type: 'ordinal', data: options.data, key: 'x', adjacent: true},
          y: {data: options.data, key: 'y', domain: [0, 120]}
        };

        var charts = [
          d3c.horizontalBars('results', {
            data: options.data,
            xScale: scales.x,
            yScale: scales.y,
            duration: 1000
          })
        ];

        var title = d3c.title(options.title.text);
        var xAxis = d3c.axis('xAxis', {scale: scales.x, ticks: 5, duration: 1000});
        var yAxis = d3c.axis('yAxis', {scale: scales.y, ticks: 5, duration: 1000});

        return [
          title,
          [xAxis, d3c.layered(charts)],
          yAxis
        ];
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    options: {
      include: {
        title: {
          name: 'Title',
          default_value: true,

          options: {
            text: {
              name: 'Chart Title Text',
              type: 'text',
              default_value: 'Horizontal Bars'
            }
          }
        }
      }
    },

    data: examples.data.single
  };

  //
  // Horizontal Stacked Bars
  //

  examples['horizontal-stacked-bars'] = {
    generate: function(options) {
      var fn = buildFn(function() {
        var scales = {
          x: {type: 'ordinal', data: options.data, key: 'x', adjacent: false},
          y: {data: options.data, key: 'y', domain: [0, 120]}
        };

        var charts = [
          d3c.horizontalStackedBars('results', {
            data: options.data,
            xScale: scales.x,
            yScale: scales.y
          })
        ];

        var title = d3c.title('Stacked Bars');
        var xAxis = d3c.axis('xAxis', {scale: scales.x, ticks: 5});
        var yAxis = d3c.axis('yAxis', {scale: scales.y, ticks: 5});

        return [
          title,
          [xAxis, d3c.layered(charts)],
          yAxis
        ];
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    options: {},
    data: examples.data.single
  };

  //
  // Lines and Bars
  //

  examples['lines-and-bars'] = {
    // TODO Giving legend key of "legend" causes weird issues
    generate: function(options) {
      var fn = buildFn(function() {
        var input = options.data.input;
        var output = options.data.output;
        var scales = {
          x: {type: 'ordinal', data: output, key: 'x', adjacent: true},
          y: {data: input, key: 'y'},
          y2: {data: output, key: 'y', domain: [0, 100]}
        };

        var charts = [
          d3c.lines('input', {
            data: input,
            xScale: scales.x,
            yScale: scales.y,
            duration: 1000
          }),
          d3c.bars('output', {
            data: output,
            xScale: scales.x,
            yScale: scales.y2,
            duration: 1000
          })
        ];

        var title = d3c.title('Multiple Charts');
        var xAxis = d3c.axis('xAxis', {scale: scales.x, ticks: 5, duration: 1000});
        var xAxisTitle = d3c.axisTitle('Trial');
        var yAxis = d3c.axis('yAxis', {scale: scales.y, ticks: 5, duration: 1000});
        var yAxisTitle = d3c.axisTitle('Input');
        var y2Axis = d3c.axis('y2Axis', {scale: scales.y2, ticks: 5, duration: 1000});
        var y2AxisTitle = d3c.axisTitle('Output');
        var legend = d3c.legend({charts: ['input', 'output'], centered: true});

        return [
          title,
          [yAxisTitle, yAxis, d3c.layered(charts), y2Axis, y2AxisTitle],
          xAxis,
          xAxisTitle,
          legend
        ];
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    data: examples.data.combined,
    options: {}
  };

  //
  // Custom Chart
  //

  examples['custom-chart'] = {
    generate: function(options) {
      var fn = buildFn(function() {
        var scales = {
          x: {data: options.data, key: 'x'},
          y: {data: options.data, key: 'y'}
        };

        var charts = [
          d3c.lines('input', {
            data: options.data,
            xScale: scales.x,
            yScale: scales.y
          }),
          {
            type: 'Dots',
            id: 'dots',
            data: options.data,
            xScale: scales.x,
            yScale: scales.y,
            rValue: 5
          }
        ];

        var title = d3c.title('Custom Chart');
        var xAxis = d3c.axis('xAxis', {scale: scales.x, ticks: 5});
        var yAxis = d3c.axis('yAxis', {scale: scales.y, ticks: 5});

        return [
          title,
          [yAxis, d3c.layered(charts)],
          xAxis
        ];
      });

      return {
        output: fnBody(dependencies.dots) + '\n\n' + wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    data: examples.data.single,
    options: {}
  };

  //
  // Custom Component
  //

  examples['custom-component'] = {
    generate: function(options) {
      var fn = buildFn(function() {
        var scales = {
          x: {data: options.data, key: 'x'},
          y: {data: options.data, key: 'y'}
        };

        var charts = [
          d3c.lines('input', {
            data: options.data,
            xScale: scales.x,
            yScale: scales.y
          }),
          d3c.labels('label', {
            data: [{x: 14.5, y: 100, label: 'x = 14.5'}],
            xScale: scales.x,
            yScale: scales.y,
            position: 'right',
            offset: {x: 5, y: 5}
          })
        ];

        var title = d3c.title('Custom Component');
        var xAxis = d3c.axis('xAxis', {scale: scales.x, ticks: 5});
        var yAxis = d3c.axis('yAxis', {scale: scales.y, ticks: 5});
        var overlay = {
          type: 'OverlayLine',
          value: 14.5,
          orientation: 'vertical',
          xScale: scales.x,
          yScale: scales.y
        };

        return [
          title,
          [yAxis, d3c.layered(charts)],
          xAxis,
          overlay
        ];
      });

      return {
        output: fnBody(dependencies.overlay) + '\n\n' + wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    data: examples.data.single,
    options: {}
  };

  //
  // Getting Started: Masthead
  //

  examples.masthead = [{
    generate: function() {
      var fn = buildFn({
        scales: {
          x: inline(common.scale('xOrdinal')),
          y: inline(common.scale('y', {domain: [0, 120]}))
        }
      }, extensions.xy({
        charts: {
          bars: common.chart('Bars', {duration: 1000})
        },
        axes: {
          x: inline(common.axis('x', {title: 'Input', duration: 1000})),
          y: inline(common.axis('y', {title: 'Output', duration: 1000}))
        },
        title: 'd3.compose',
        legend: true
      }));

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    data: examples.data.single,
    options: {}
  }, examples['lines-and-bars'], {
    generate: function() {
      var fn = buildFn({
        scales: {
          x: inline(common.scale('x', {domain: [-10, 110]})),
          y: inline(common.scale('y', {domain: [0, 120]}))
        }
      }, extensions.xy({
        charts: {
          bars: common.chart('Lines', {labels: true, duration: 1000})
        },
        axes: {
          x: inline(common.axis('x', {title: 'Input', duration: 1000})),
          y: inline(common.axis('y', {title: 'Output', duration: 1000}))
        },
        title: 'Labels',
        legend: true
      }));

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    data: examples.data.single,
    options: {}
  }, examples['horizontal-bars']];

  //
  // Getting Started: Steps
  //

  examples['getting-started-2'] = {
    generate: function() {
      var fn = buildFn({
        charts: {
          results: {type: 'Lines', data: code('options.data')}
        }
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    data: {series: examples.data.single.series[1].values},
    options: {}
  };

  examples['getting-started-3'] = {
    generate: function() {
      var fn = buildFn({
        charts: {
          results: inline({type: 'Lines', data: code('options.data')})
        },
        components: {
          yAxis: {
            type: 'Axis',
            position: 'left',
            scale: {domain: [0, 100]}
          }
        }
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    data: {series: examples.data.single.series[1].values},
    options: {}
  };

  examples['getting-started-4'] = {
    generate: function() {
      var fn = buildFn({
        scales: {
          x: inline({data: code('options.data'), key: 'x'}),
          y: inline({domain: [0, 120]})
        }
      }, {
        charts: {
          results: inline({type: 'Lines', data: code('options.data'), xScale: code('scales.x'), yScale: code('scales.y')})
        },
        components: {
          xAxis: {
            type: 'Axis',
            position: 'bottom',
            scale: code('scales.x')
          },
          yAxis: {
            type: 'Axis',
            position: 'left',
            scale: code('scales.y')
          }
        }
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    data: {series: examples.data.single.series[1].values},
    options: {}
  };

  examples['getting-started-5'] = {
    generate: function() {
      var fn = buildFn({
        scales: {
          x: inline({data: code('options.data'), key: 'x'}),
          y: inline({domain: [0, 120]})
        }
      }, {
        charts: {
          results: inline({type: 'Lines', data: code('options.data'), xScale: code('scales.x'), yScale: code('scales.y')})
        },
        components: {
          xAxis: {
            type: 'Axis',
            position: 'bottom',
            scale: code('scales.x')
          },
          yAxis: {
            type: 'Axis',
            position: 'left',
            scale: code('scales.y')
          }
        }
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    data: examples.data.single,
    options: {}
  };

  examples['getting-started-6'] = {
    generate: function() {
      var fn = buildFn({
        scales: {
          x: inline({data: code('options.data'), key: 'x'}),
          y: inline({domain: [0, 120]})
        }
      }, {
        charts: {
          results: inline({type: 'Lines', data: code('options.data'), xScale: code('scales.x'), yScale: code('scales.y')})
        },
        components: {
          xAxis: {
            type: 'Axis',
            position: 'bottom',
            scale: code('scales.x')
          },
          yAxis: {
            type: 'Axis',
            position: 'left',
            scale: code('scales.y')
          },
          legend: {
            type: 'Legend',
            position: 'right',
            charts: ['results']
          }
        }
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    data: examples.data.single,
    options: {}
  };

  examples['getting-started-7'] = {
    generate: function() {
      var fn = buildFn({
        scales: {
          x: inline({data: code('options.data'), key: 'x'}),
          y: inline({domain: [0, 120]})
        }
      }, {
        charts: {
          results: inline({type: 'Lines', data: code('options.data'), xScale: code('scales.x'), yScale: code('scales.y')})
        },
        components: {
          xAxis: {
            type: 'Axis',
            position: 'bottom',
            scale: code('scales.x')
          },
          yAxis: {
            type: 'Axis',
            position: 'left',
            scale: code('scales.y')
          },
          legend: {
            type: 'Legend',
            position: 'right',
            charts: ['results']
          },
          title: {
            type: 'Title',
            text: 'd3.compose',
            'class': 'chart-title-main'
          },
          xAxisTitle: {
            type: 'Title',
            position: 'bottom',
            text: 'Input'
          },
          yAxisTitle: {
            type: 'Title',
            position: 'left',
            text: 'Results'
          }
        }
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    data: examples.data.single,
    options: {}
  };

  examples['getting-started-1'] = examples['getting-started-8'] = {
    generate: function() {
      var fn = buildFn({
        scales: {
          x: inline({data: code('options.data'), key: 'x', type: 'ordinal', adjacent: true}),
          y: inline({domain: [0, 120]})
        }
      }, {
        charts: {
          results: inline({type: 'Bars', data: code('options.data'), xScale: code('scales.x'), yScale: code('scales.y')})
        },
        components: {
          xAxis: {
            type: 'Axis',
            position: 'bottom',
            scale: code('scales.x')
          },
          yAxis: {
            type: 'Axis',
            position: 'left',
            scale: code('scales.y')
          },
          legend: {
            type: 'Legend',
            position: 'right',
            charts: ['results']
          },
          title: {
            type: 'Title',
            text: 'd3.compose',
            'class': 'chart-title-main'
          },
          xAxisTitle: {
            type: 'Title',
            position: 'bottom',
            text: 'Input'
          },
          yAxisTitle: {
            type: 'Title',
            position: 'left',
            text: 'Results'
          }
        }
      });

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    data: examples.data.single,
    options: {}
  };

  //
  // dependencies
  //

  /* eslint-disable no-unused-vars */
  var dependencies = {
    dots: function() {
      var helpers = d3.compose.helpers;
      var mixins = d3.compose.mixins;

      d3.chart('Chart').extend('Dots', helpers.mixin(mixins.Series, mixins.XY, {
        initialize: function() {
          var base = this.base.append('g').attr('class', 'chart-dots');

          // seriesLayer wraps series functionality
          // so that standard layer approach can be used
          this.seriesLayer('Dots', base, {
            dataBind: function(data) {
              return this.selectAll('circle')
                .data(data, this.chart().key);
            },
            insert: function() {
              return this.append('circle');
            },
            events: {
              merge: function() {
                var chart = this.chart();
                this
                  .attr('cx', chart.x)
                  .attr('cy', chart.y)
                  .attr('r', chart.r);
              }
            }
          });
        },

        // helpers.property creates get/set property
        // that is set automatically from Compose options
        rValue: helpers.property('rValue', {
          default_value: 2
        }),

        // helpers.di binds chart to "di" functions
        // so that "this" refers to the element (as expected)
        r: helpers.di(function(chart, d, i) {
          return chart.rValue();
        })
      }));
    },

    overlay: function() {
      var helpers = d3.compose.helpers;
      var mixins = d3.compose.mixins;

      d3.chart('Component').extend('OverlayLine', helpers.mixin(mixins.XY, {
        initialize: function() {
          var base = this.base.append('g').attr('class', 'chart-overlay');
          this.line = d3.svg.line().x(this.x).y(this.y);

          this.layer('Overlay', base, {
            dataBind: function() {
              return this.selectAll('path').data([0]);
            },
            insert: function() {
              return this.append('path')
                .style('stroke', '#999');
            },
            events: {
              merge: function() {
                var chart = this.chart();
                this.attr('d', function(d, i) {
                  return chart.line(chart.points.call(this, d, i));
                });
              }
            }
          });
        },

        // helpers.property creates get/set property
        // that is set automatically from Compose options
        value: helpers.property('value'),

        orientation: helpers.property('orientation', {
          default_value: 'vertical',
          validate: function(value) {
            return value == 'vertical' || value == 'horizontal';
          }
        }),

        // helpers.di binds chart to "di" functions
        // so that "this" refers to the element (as expected)
        points: helpers.di(function(chart) {
          var points = [{}, {}];

          if (chart.orientation() == 'horizontal') {
            points[0].y = points[1].y = chart.value();
            points[0].x = chart.xScale().domain()[0];
            points[1].x = chart.xScale().domain()[1];
          }
          else {
            points[0].x = points[1].x = chart.value();
            points[0].y = chart.yScale().domain()[0];
            points[1].y = chart.yScale().domain()[1];
          }

          return points;
        }),

        // Position overlay as chart layer,
        // skipping standard component layout
        skip_layout: true
      }), {
        layer_type: 'chart'
      });
    }
  };
  /* eslint-enable */

  _.each(dependencies, function(dependency) {
    dependency();
  });

  //
  // extensions
  //

  var extensions = {
    xy: function(returns) {
      var parsed = parseObject(returns);
      parsed[0] = 'd3.compose.xy(' + parsed[0];
      parsed[parsed.length - 1] += ')';

      return parsed.join('\n');
    }
  };

  //
  // helpers
  //

  // Build function for display/execution
  // - last argument is return
  // - other arguments:
  //   {} -> var key = value;...
  //   function() {} -> insert body
  function buildFn() {
    var parts = _.toArray(arguments);
    var fn;

    if (parts.length == 1 && _.isFunction(parts[0])) {
      fn = fnBody(parts[0]);
    }
    else {
      var returns = parts.pop();

      fn = _.map(parts, function(part) {
        if (_.isFunction(part)) {
          return fnBody(part);
        }
        else {
          return _.map(part, function(value, key) {
            value = toValue(value);

            if (_.isArray(value))
              value = value.join('\n');

            return 'var ' + key + ' = ' + value + ';';
          }).join('\n');
        }
      }).join('\n\n');

      if (fn.length)
        fn += '\n\n';

      fn += 'return ' + (_.isObject(returns) ? parseObject(returns).join('\n') : returns) + ';';
    }

    return '  ' + fn.replace(/\n/g, '\n  ');
  }

  function parseObject(obj, output_inline) {
    var parsed = _.reduce(obj, function(memo, value, key) {
      key = toKey(key);
      value = toValue(value);

      if (_.isArray(value)) {
        value[0] = key + ': ' + value[0];
        value[value.length - 1] += ',';

        if (!output_inline)
          value = _.map(value, function(item) {return '  ' + item; });

        memo = memo.concat(value);
      }
      else {
        memo.push((output_inline ? '' : '  ') + key + ': ' + value + ',');
      }

      return memo;
    }, []);

    // Remove trailing comma
    if (parsed.length) {
      var last_item = parsed[parsed.length - 1];
      parsed[parsed.length - 1] = last_item.substring(0, last_item.length - 1);
    }

    // Add brackets depending on format
    if (output_inline) {
      parsed = '{' + parsed.join(' ') + '}';
    }
    else {
      parsed.unshift('{');
      parsed.push('}');
    }

    return parsed;
  }

  function inline(obj) {
    return code(parseObject(obj, true));
  }

  function code(str) {
    return {
      _is_code: true,
      code: str
    };
  }

  function toKey(key) {
    if (key.indexOf('.') >= 0 || key == 'class')
      return '\'' + key + '\'';
    else
      return key;
  }

  function toValue(value) {
    if (value && value._is_code) {
      return value.code;
    }
    else if (_.isArray(value)) {
      return '[' + _.map(value, function(item) { return toValue(item); }).join(', ') + ']';
    }
    else if (_.isObject(value)) {
      return parseObject(value);
    }
    else if (_.isString(value)) {
      return '\'' + value + '\'';
    }
    else {
      return value;
    }
  }

  function fnBody(fn) {
    var lines = fn.toString().split('\n').slice(1, -1);
    var leading_spaces = lines[0].split(/[^ \t\r\n]/)[0].length;

    return _.map(lines, function(line) {
      return line.substring(leading_spaces);
    }).join('\n');
  }

  function wrapFn(fn) {
    return 'd3.select(\'#chart\').chart(\'Compose\', function(options) {\n' + fn + '\n});';
  }

})(examples);
