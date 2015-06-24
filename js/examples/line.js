(function(examples) {

  // Line
  examples.line = {
    generate: function(options) {
      // TODO options

      var fn = [
        "var scales = {",
        "  x: {data: data, key: 'x'},",
        "  y: {data: data, key: 'y'}",
        "};",
        "",
        "return {",
        "  charts: {",
        "    line: {",
        "      type: 'Lines',",
        "      data: data,",
        "      xScale: scales.x,",
        "      yScale: scales.y,",
        "      interpolate: 'monotone'",
        "    }",
        "  },",
        "  components: {",
        "    'axis.x': {",
        "      type: 'Axis',",
        "      position: 'bottom',",
        "      scale: scales.x,",
        "      ticks: 5",
        "    },",
        "    'axis.y': {",
        "      type: 'Axis',",
        "      position: 'left',",
        "      scale: scales.y,",
        "      ticks: 5",
        "    },",
        "    title: {",
        "      type: 'Title',",
        "      position: 'top',",
        "      text: 'Line Chart',",
        "      'class': 'chart-title-main',",
        "      margins: {top: 4, bottom: 4}",
        "    }",
        "  }",
        "};"
      ];

      return '  ' + fn.join('\n  ') + '\n';
    },

    data: examples.data.a
  };

})(examples);
