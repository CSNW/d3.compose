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
      else
        return _.extend({text: text}, options);
    }
  };

  //
  // Lines
  //

  examples.lines = {
    generate: function(options) {
      if (options.include.xy || true) {
        return buildFn({
          x: inline(common.scale('x')),
          y: inline(common.scale('y'))
        }, {
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
        });
      }
      else {
        return buildFn({
          x: inline(common.scale('x')),
          y: inline(common.scale('y'))
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
        }, {xy: false});
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
        x: inline(common.scale('xOrdinal')),
        y: inline(common.scale('y'))
      }, {
        charts: {
          bars: common.chart('Bars')
        },
        axes: {
          x: inline(common.axis('x')),
          y: inline(common.axis('y'))
        },
        title: common.title(),
        legend: true
      });
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
      return buildFn({
        x: inline(common.scale('xOrdinal')),
        y: inline(common.scale('y'))
      }, {
        charts: {
          bars: common.chart('HorizontalBars')
        },
        axes: {
          x: inline(common.axis('x', {position: 'left'})),
          y: inline(common.axis('y', {position: 'bottom'}))
        },
        title: common.title()
      });
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
  // Lines and Bars
  //

  examples['lines-and-bars'] = {
    generate: function(options) {
      var output = codes.output;
      var input = codes.input;
      var scales = {
        x: codes.scales.x,
        y: codes.scales.y,
        y2: codes.scales.y2
      };

      return buildFn({
        x: inline(common.scale('xOrdinal', {data: codes.output})),
        y: inline(common.scale('y', {data: codes.input})),
        y2: inline(common.scale('y', {data: output, domain: [0, 100]}))
      }, {
        charts: {
          input: common.chart('Lines', {data: input}),
          output: common.chart('Bars', {data: output, yScale: scales.y2})
        },
        axes: {
          x: inline(common.axis('x')),
          y: inline(common.axis('y', {title: 'Input'})),
          y2: inline(common.axis('y2', {title: 'Output'}))
        },
        title: 'Input vs. Output'
      }, {
        preface: function() {
          var input = options.data.input;
          var output = options.data.output;
        }
      });
    },

    data: examples.data.combined,
    options: {}
  };

  //
  // helpers
  //

  function buildFn(scales, config, options) {
    options = _.defaults({}, options, {
      xy: true
    });

    var fn = '';
    if (options.preface)
      fn = fnBody(options.preface) + '\n\n';

    fn += 'var scales = ' + parseObject(scales).join('\n') + ';\n\n';

    if (options.xy)
      fn += 'return d3.compose.xy(' + parseObject(config).join('\n') + ');';
    else
      fn += 'return ' + parseObject(config).join('\n') + ';';

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

})(examples);
