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

  var scales = {
    x: [
      "{data: options.data, key: 'x'}"
    ],
    x_ordinal: [
      "{type: 'ordinal', data: options.data, key: 'x', adjacent: true}"
    ],
    y: [
      "{data: options.data, key: 'y'}"
    ]
  };

  var charts = {
    lines: [
      "{",
      "  type: 'Lines',",
      "  data: options.data,",
      "  xScale: scales.x,",
      "  yScales: scales.y,",
      "  interpolate: 'monotone'",
      "}"
    ],
    bars: [
      "{",
      "  type: 'Bars',",
      "  data: options.data,",
      "  xScale: scales.x,",
      "  yScale: scales.y",
      "}"
    ]
  };

  var components = {
    'axis.x': [
      "{",
      "  type: 'Axis',",
      "  position: 'bottom',",
      "  scale: scales.x,",
      "  ticks: 5",
      "}"
    ],
    'axis.y': [
      "{",
      "  type: 'Axis',",
      "  position: 'left',",
      "  scale: scales.y,",
      "  ticks: 5",
      "}"
    ],
    title: [
      "{",
      "  type: 'Title',",
      "  position: 'top',",
      "  text: options.title.text,",
      "  'class': 'chart-title-main',",
      "  margins: {top: 4, bottom: 4}",
      "}"
    ]
  };

  var axes = {
    x: [
      "{scale: scales.x, ticks: 5}"
    ],
    y: [
      "{scale: scales.y, ticks: 5}"
    ],
  };

  var title = [
    "options.title.text"
  ];

  //
  // Lines
  //

  examples.lines = {
    generate: function(options) {
      if (options.include.xy)
        return buildXY({x: scales.x, y: scales.y}, {charts: {lines: charts.lines}, components: _.omit(components, ['axis.x', 'axis.y', 'title']), axes: axes, title: title});
      else
        return buildStandard({x: scales.x, y: scales.y}, {charts: {lines: charts.lines}, components: components});
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
      return buildXY({x: scales.x_ordinal, y: scales.y}, {charts: {bars: charts.bars}, axes: axes, title: title});
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
  // Lines and Bars
  //

  examples['lines-and-bars'] = {
    generate: function(options) {
      return preface([
        "var input = options.data.input;",
        "var output = options.data.output;"
      ], buildXY({
        x: ["{type: 'ordinal', data: output, key: 'x', adjacent: true}"],
        y: ["{data: input, key: 'y'}"],
        y2: ["{data: output, key: 'y', domain: [0, 100]}"]
      }, {
        charts: {
          input: [
            "{",
            "  type: 'Lines',",
            "  data: input,",
            "  xScale: scales.x,",
            "  yScale: scales.y",
            "}"
          ],
          output: [
            "{",
            "  type: 'Bars',",
            "  data: output,",
            "  xScale: scales.x,",
            "  yScale: scales.y2",
            "}"
          ]
        },
        axes: {
          x: [
            "{",
            "  scale: scales.x",
            "}"
          ],
          y: [
            "{",
            "  scale: scales.y,",
            "  title: 'Input'",
            "}"
          ],
          y2: [
            "{",
            "  scale: scales.y2,",
            "  title: 'Results'",
            "}"
          ]
        },
        title: ["'Input vs. Output'"]
      }));
    },

    data: examples.data.combined,
    options: {}
  };

  //
  // helpers
  //

  function buildStandard(scales, options) {
    var fn = [
      "var scales = {",
      indent(buildLines(scales), 2),
      "};",
      "",
      "return {",
      "  charts: {",
      indent(buildLines(options.charts), 4),
      "  },",
      "  components: {",
      indent(buildLines(options.components), 4),
      "  }",
      "};"
    ];

    // indent function body additional two spaces for formatting 
    return formatFn(fn);
  }

  function buildXY(scales, options) {
    var fn = [
      "var scales = {",
      indent(buildLines(scales), 2),
      "};",
      "",
      "return d3.compose.xy({",
      "  charts: {",
      indent(buildLines(options.charts), 4),
      "  }"
    ];

    if (options.axes && _.keys(options.axes).length) {
      fn[fn.length - 1] += ',';

      fn = fn.concat([
        "  axes: {",
        indent(buildLines(options.axes), 4),
        "  }"
      ]);
    }

    if (options.title) {
      fn[fn.length - 1] += ',';

      fn.push(indent(buildLines({title: options.title}), 2));
    }

    if (options.legend) {
      fn[fn.length - 1] += ',';

      fn.push(indent(buildLines({legend: options.legend}), 2));
    }

    if (options.components && _.keys(options.components).length) {
      fn[fn.length - 1] += ',';

      fn = fn.concat([
        "  components: {",
        indent(buildLines(options.components), 4),
        "  }"
      ]);
    }

    fn.push('});');

    return formatFn(fn);
  }

  function buildLines(obj) {
    return _.reduce(obj, function(memo, lines, key) {
      if (memo.length)
        memo[memo.length - 1] += ',';

      lines = _.clone(lines);
      lines[0] = quoteIfNeeded(key) + ': ' + lines[0];

      return memo.concat(lines);
    }, []);
  }

  function indent(lines, num_spaces) {
    var spaces = Array(num_spaces + 1).join(' ');
    return spaces + lines.join('\n' + spaces);
  }

  function formatFn(fn) {
    return '  ' + fn.join('\n').replace(/\n/g, '\n  ');
  }

  function preface(lines, fn) {
    return formatFn(lines) + '\n' + fn;
  }

  function quoteIfNeeded(key) {
    if (key.indexOf('.') >= 0 || key == 'class')
      return '\'' + key + '\'';
    else
      return key;
  }

})(examples);
