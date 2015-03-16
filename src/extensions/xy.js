(function(d3, helpers) {
  var utils = helpers.utils;

  /**
    XY extension
    Generate d3.chart.multi options for XY charts

    @param {Object} options
    - charts {Object}
    - axes {Object}
    - title {String|Object}
    - legend {Boolean|Object}
  */
  d3.compose.xy = function xy(options) {
    options = options || {};
    var charts = utils.extend({}, options.charts);
    var components = utils.extend({}, options.components);
    var default_margin = 8;
    var default_margins = {top: default_margin, right: default_margin, bottom: default_margin, left: default_margin};

    // Title
    if (options.title) {
      var title_options = options.title;
      if (utils.isString(title_options))
        title_options = {text: title_options};

      title_options = utils.defaults({}, title_options, {
        type: 'Title',
        position: 'top',
        'class': 'chart-title-main',
        margins: default_margins
      });

      components.title = title_options;
    }

    // Axes
    utils.each(options.axes, function(axis_options, key) {
      var positionByKey = {
        x: 'bottom',
        y: 'left',
        x2: 'top',
        y2: 'right',
        secondaryX: 'top',
        secondaryY: 'right'
      };

      axis_options = utils.defaults({}, axis_options, {
        type: 'Axis',
        position: positionByKey[key]
      });

      components['axis.' + key] = axis_options;

      if (axis_options.title) {
        var title_options = axis_options.title;
        if (utils.isString(title_options))
          title_options = {text: title_options};

        title_options = utils.defaults({}, title_options, {
          type: 'Title',
          position: axis_options.position,
          'class': 'chart-title-axis',
          margins: utils.defaults({
            top: {top: default_margin / 2},
            right: {left: default_margin / 2},
            bottom: {bottom: default_margin / 2},
            left: {right: default_margin / 2}
          }[axis_options.position], default_margins)
        });

        components['axis.' + key + '.title'] = title_options;
      }
    });

    // Legend
    if (options.legend) {
      var legend_options = options.legend;
      if (legend_options === true)
        legend_options = {};

      legend_options = utils.defaults({}, legend_options, {
        type: 'Legend',
        position: 'right',
        margins: default_margins
      });

      // By default, use all charts for legend
      if (!legend_options.data && !legend_options.charts)
        legend_options.charts = utils.keys(charts);

      components.legend = legend_options;
    }

    return {
      charts: charts,
      components: components
    };
  };

})(d3, d3.compose.helpers);
