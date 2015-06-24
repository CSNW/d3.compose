(function(examples) {
  // Line-Bar Values
  examples['line-bar-values'] = {
    generate: function(options) {
      var fn = [
        "var input = data.input;",
        "var results = data.results;",
        "var scales = {",
        "  x: {type: 'ordinal', data: results, key: 'x', adjacent: true},",
        "  y: {data: input, key: 'y'},",
        "  y2: {data: results, key: 'y', domain: [0, 100]}",
        "};",
        "",
        "return d3.compose.xy({",
        "  charts: {",
        "    input: {",
        "      type: 'Lines',",
        "      data: input,",
        "      xScale: scales.x,",
        "      yScale: scales.y",
        "    },",
        "    results: {",
        "      type: 'Bars',",
        "      data: results,",
        "      xScale: scales.x,",
        "      yScale: scales.y2",
        "    }",
        "  },",
        "  axes: {",
        "    x: {",
        "      scale: scales.x",
        "    },",
        "    y: {",
        "      scale: scales.y,",
        "      title: 'Input'",
        "    },",
        "    y2: {",
        "      scale: scales.y2,",
        "      title: 'Results'",
        "    }",
        "  },",
        "  title: {",
        "    text: 'Input vs. Output'",
        "  }",
        "});"
      ];

      return '  ' + fn.join('\n  ') + '\n';
    },

    data: examples.data.b
  };
})(examples);
