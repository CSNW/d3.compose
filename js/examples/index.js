(function(examples) {

  examples.data = {
    single: {
      simple: [{x: 0, y: 10}, {x: 10, y: 20}, {x: 20, y: 50}, {x: 30, y: 100}],
      series: [
        {
          key: 'control', name: 'Control', values: [
            {x: 0, y: 10}, {x: 10, y: 20}, {x: 20, y: 50}, {x: 30, y: 100}
          ]
        },
        {
          key: 'results', name: 'Results', values: [
            {x: 0, y: 50}, {x: 10, y: 45}, {x: 20, y: 15}, {x: 30, y: 10}
          ]
        }
      ]
    },
    combined: {
      simple: {
        input: [{x: 1, y: 10}, {x: 2, y: 30}, {x: 3, y: 20}],
        output: [{x: 1, y: 30}, {x: 2, y: 20}, {x: 3, y: 10}]
      },
      series: {
        input: [
          {
            key: 'input',
            values: [{x: 'a', y: 100}, {x: 'b', y: 200}, {x: 'c', y: 300}]
          }
        ],
        output: [
          {
            key: 'run-1',
            values: [{x: 'a', y: 10}, {x: 'b', y: 30}, {x: 'c', y: 20}]
          },
          {
            key: 'run-2',
            values: [{x: 'a', y: 15}, {x: 'b', y: 25}, {x: 'c', y: 20}]
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
        return options
      else
        return _.extend({text: text}, options);
    }
  };

  //
  // Lines
  //

  examples.lines = {
    generate: function(options) {
      if (options.include.xy) {
        var fn = buildFn({
          scales: {
            x: inline(common.scale('x')),
            y: inline(common.scale('y'))
          }
        }, extensions.xy({
          charts: {
            lines: common.chart('Lines', {
              interpolation: 'monotone'
            })
          },
          axes: {
            x: inline(common.axis('x')),
            y: inline(common.axis('y'))
          },
          title: common.title()
        }));
      }
      else {
        var fn = buildFn({
          scales: {
            x: inline(common.scale('x')),
            y: inline(common.scale('y'))
          }
        }, {
          charts: {
            lines: common.chart('Lines', {
              interpolation: 'monotone'
            })
          },
          components: {
            'axis.x': {
              type: 'Axis',
              position: 'bottom',
              scale: codes.scales.x,
              ticks: 5
            },
            'axis.y': {
              type: 'Axis',
              position: 'left',
              scale: codes.scales.y,
              ticks: 5
            },
            title: {
              type: 'Title',
              position: 'top',
              text: code('options.title.text'),
              'class': 'chart-title-main',
              margins: inline({top: 4, bottom: 4})
            }
          }
        });
      }

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
      var fn = buildFn({
        scales: {
          x: inline(common.scale('xOrdinal')),
          y: inline(common.scale('y', {domain: [0, 120]}))
        }
      }, extensions.xy({
        charts: {
          bars: common.chart('Bars')
        },
        axes: {
          x: inline(common.axis('x')),
          y: inline(common.axis('y'))
        },
        title: common.title(),
        legend: true
      }));

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
      var fn = buildFn({
        scales: {
          x: inline(common.scale('xOrdinal', {adjacent: false})),
          y: inline(common.scale('y', {domain: [0, 120]}))
        }
      }, extensions.xy({
        charts: {
          bars: common.chart('StackedBars')
        },
        axes: {
          x: inline(common.axis('x')),
          y: inline(common.axis('y'))
        },
        title: common.title('Stacked Bars'),
        legend: true
      }));

      return {
        output: wrapFn(fn),
        fn: new Function('options', fn)
      };
    },

    options: {},
    data: examples.data.single
  };

  //
  // Horizontal Bars
  //

  examples['horizontal-bars'] = {
    generate: function(options) {
      var fn = buildFn({
        scales: {
          x: inline(common.scale('xOrdinal')),
          y: inline(common.scale('y', {domain: [0, 120]}))
        }
      }, extensions.xy({
        charts: {
          bars: common.chart('HorizontalBars')
        },
        axes: {
          x: inline(common.axis('x', {position: 'left'})),
          y: inline(common.axis('y', {position: 'bottom'}))
        },
        title: common.title()
      }));

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
              default_value: 'Horizontal Bars Chart'
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
      var fn = buildFn({
        scales: {
          x: inline(common.scale('xOrdinal', {adjacent: false})),
          y: inline(common.scale('y', {domain: [0, 120]}))
        }
      }, extensions.xy({
        charts: {
          bars: common.chart('HorizontalStackedBars')
        },
        axes: {
          x: inline(common.axis('x', {position: 'left'})),
          y: inline(common.axis('y', {position: 'bottom'}))
        },
        title: common.title('Stacked Bars')
      }));

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
    generate: function(options) {
      var fn = buildFn({
        input: code('options.data.input'),
        output: code('options.data.output'),
        scales: {
          x: inline(common.scale('xOrdinal', {data: codes.output})),
          y: inline(common.scale('y', {data: codes.input})),
          y2: inline(common.scale('y', {data: codes.output, domain: [0, 100]}))
        }
      }, extensions.xy({
        charts: {
          input: common.chart('Lines', {data: codes.input}),
          output: common.chart('Bars', {data: codes.output, yScale: codes.scales.y2})
        },
        axes: {
          x: inline(common.axis('x')),
          y: inline(common.axis('y', {title: 'Input'})),
          y2: inline(common.axis('y2', {title: 'Output'}))
        },
        title: 'Input vs. Output'
      }));

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
      var fn = buildFn({
        scales: {
          x: inline(common.scale('x')),
          y: inline(common.scale('y'))
        }
      }, extensions.xy({
        charts: {
          input: common.chart('Lines'),
          dots: common.chart('Dots', {rValue: 5})
        },
        axes: {
          x: inline(common.axis('x')),
          y: inline(common.axis('y')),
        },
        title: 'Custom Chart'
      }));

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
      var fn = buildFn({
        scales: {
          x: inline(common.scale('x')),
          y: inline(common.scale('y'))
        }
      }, extensions.xy({
        charts: {
          input: common.chart('Lines'),
          label: {
            type: 'Labels',
            xScale: code('scales.x'),
            yScale: code('scales.y'),
            position: 'right',
            offset: inline({x: 5, y: 5}),
            data: [
              inline({x: 14.5, y: 100, label: 'x = 14.5'})
            ]
          }
        },
        axes: {
          x: inline(common.axis('x')),
          y: inline(common.axis('y')),
        },
        components: {
          overlay: {
            type: 'OverlayLine',
            value: 14.5,
            orientation: 'vertical',
            xScale: code('scales.x'),
            yScale: code('scales.y')
          }
        },
        title: 'Custom Component'
      }));

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

  examples['masthead'] = [{
    generate: function(options) {
      var fn = buildFn({
        scales: {
          x: inline(common.scale('xOrdinal')),
          y: inline(common.scale('y', {domain: [0, 120]}))
        }
      }, extensions.xy({
        charts: {
          bars: common.chart('Bars')
        },
        axes: {
          x: inline(common.axis('x')),
          y: inline(common.axis('y'))
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
  }, examples['lines-and-bars']];

  //
  // Getting Started: Steps
  //

  examples['getting-started-2'] = {
    generate: function(options) {
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

    data: {series: examples.data.single.series[0].values},
    options: {}
  };

  examples['getting-started-3'] = {
    generate: function(options) {
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

    data: {series: examples.data.single.series[0].values},
    options: {}
  };

  examples['getting-started-4'] = {
    generate: function(options) {
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

    data: {series: examples.data.single.series[0].values},
    options: {}
  };

  examples['getting-started-5'] = {
    generate: function(options) {
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
    generate: function(options) {
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
    generate: function(options) {
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

  examples['getting-started-8'] = {
    generate: function(options) {
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
                })
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
        points: helpers.di(function(chart, d, i) {
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
    var returns = parts.pop();

    var fn = _.map(parts, function(part) {
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

    return '  ' + fn.replace(/\n/g, '\n  ');
  }

  function parseObject(obj, inline) {
    var parsed = _.reduce(obj, function(memo, value, key) {
      key = toKey(key);
      value = toValue(value);

      if (_.isArray(value)) {
        value[0] = key + ': ' + value[0];
        value[value.length - 1] += ','

        if (!inline)
          value = _.map(value, function(item) {return '  ' + item; });

        memo = memo.concat(value);
      }
      else {
        memo.push((inline ? '' : '  ') + key + ': ' + value + ',');
      }

      return memo;
    }, []);

    // Remove trailing comma
    if (parsed.length) {
      var last_item = parsed[parsed.length - 1];
      parsed[parsed.length - 1] = last_item.substring(0, last_item.length - 1);
    }

    // Add brackets depending on format
    if (inline) {
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
  };

})(examples);
