(function(examples, _) {

  // Line
  examples.line = {
    generate: function(options) {
      // TODO options
      options = _.defaults({}, options, {
        use_xy: false
      });

      var fn = [
        "var scales = {",
        "  x: {data: data, key: 'x'},",
        "  y: {data: data, key: 'y'}",
        "};",
        "",
        options.use_xy ? "return d3.compose.xy({" : "return {",
        "  charts: {",
        "    line: {",
        "      type: 'Lines',",
        "      data: data,",
        "      xScale: scales.x,",
        "      yScale: scales.y,",
        "      interpolate: 'monotone'",
        "    }",
        "  },"
      ];

      if (options.use_xy) {
        fn = fn.concat([
          "  axes: {",
          "    x: {scale: scales.x, ticks: 5},",
          "    y: {scale: scales.y, ticks: 5}",
          "  },",
          "  title: 'Line Chart'",
          "});"
        ]);
      }
      else {
        fn = fn.concat([
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
        ]);
      }

      return '  ' + fn.join('\n  ') + '\n';
    },

    options: {
      use_xy: {
        name: 'Use d3.compose.xy',
        type: 'checkbox',
        default_value: false
      }
    },

    data: examples.data.single
  };

})(examples, _);
