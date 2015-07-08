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
        return buildFn({
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
        return buildFn({
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
      return buildFn({
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
      return buildFn({
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
    },

    options: {},
    data: examples.data.single
  };

  //
  // Horizontal Bars
  //

  examples['horizontal-bars'] = {
    generate: function(options) {
      return buildFn({
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
      return buildFn({
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
    },

    options: {},
    data: examples.data.single
  };

  //
  // Lines and Bars
  //

  examples['lines-and-bars'] = {
    generate: function(options) {
      return buildFn({
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
    },

    data: examples.data.combined,
    options: {}
  };

  //
  // Getting Started: Masthead
  //

  examples['masthead'] = {
    generate: function(options) {
      return buildFn({
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
    },

    data: examples.data.single,
    options: {}
  };

  //
  // Getting Started: Steps
  //

  examples['getting-started-1'] = {
    generate: function(options) {
      return '';
    },

    data: examples.data.single,
    options: {}
  };

  examples['getting-started-2'] = {
    generate: function(options) {
      return buildFn({
        charts: {
          lines: {type: 'Lines', data: code('options.data')}
        }
      });
    },

    data: {series: [{x: 0, y: 0}, {x: 1, y: 10}, {x: 2, y: 40}, {x: 3, y: 90}]},
    options: {}
  };

  examples['getting-started-3'] = {
    generate: function(options) {
      return buildFn({
        charts: {
          lines: inline({type: 'Lines', data: code('options.data')})
        },
        components: {
          yAxis: {
            type: 'Axis',
            position: 'left'
          }
        }
      });
    },

    data: {series: [{x: 0, y: 0}, {x: 1, y: 10}, {x: 2, y: 40}, {x: 3, y: 90}]},
    options: {}
  };

  examples['getting-started-3'] = {
    generate: function(options) {
      return buildFn({
        charts: {
          lines: inline({type: 'Lines', data: code('options.data')})
        },
        components: {
          yAxis: {
            type: 'Axis',
            position: 'left',
            scale: {domain: [0, 90]}
          }
        }
      });
    },

    data: {series: [{x: 0, y: 0}, {x: 1, y: 10}, {x: 2, y: 40}, {x: 3, y: 90}]},
    options: {}
  };

  examples['getting-started-4'] = {
    generate: function(options) {
      return buildFn({
        scales: {
          x: inline({data: code('options.data'), key: 'x'}),
          y: inline({domain: [0, 100]})
        }
      }, {
        charts: {
          lines: inline({type: 'Lines', data: code('options.data'), xScale: code('scales.x'), yScale: code('scales.y')})
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
    },

    data: {series: [{x: 0, y: 0}, {x: 1, y: 10}, {x: 2, y: 40}, {x: 3, y: 90}]},
    options: {}
  };

  //
  // dependencies
  //

  var dependencies = {};

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

  function wrapGenerated(generated) {
    return 'd3.select(\'#chart\').chart(\'Compose\', function(options) {\n' + generated + '\n});';
  };

})(examples);
