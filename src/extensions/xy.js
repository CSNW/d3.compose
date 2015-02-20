(function(d3) {

  /**
    XY extension
    Generate d3.chart.multi options for XY charts

    @param {Object} options
    - charts {Object}
    - axes {Object}
    - title {String|Object}
    - legend {Boolean|Object}
  */
  d3.chart.xy = function xy(options) {
    options = options || {};
    var charts = _.extend({}, options.charts);
    var components = _.extend({}, options.components);

    // Title
    if (options.title) {
      var title_options = options.title;
      if (_.isString(title_options))
        title_options = {text: title_options};

      title_options = _.defaults({}, title_options, {
        type: 'Title',
        position: 'top',
        'class': 'chart-title-main'
      });

      components.title = title_options;
    }

    // Axes
    _.each(options.axes, function(axis_options, key) {
      var positionByKey = {
        x: 'bottom',
        y: 'left',
        x2: 'top',
        y2: 'right',
        secondaryX: 'top',
        secondaryY: 'right'
      };

      axis_options = _.defaults({}, axis_options, {
        type: 'Axis',
        position: positionByKey[key]
      });

      components['axis.' + key] = axis_options;

      if (axis_options.title) {
        var title_options = axis_options.title;
        if (_.isString(title_options))
          title_options = {text: title_options};
        
        title_options = _.defaults({}, title_options, {
          type: 'Title',
          position: axis_options.position,
          'class': 'chart-title-axis'
        });

        components['axis.' + key + '.title'] = title_options;
      }
    });

    // Legend
    if (options.legend) {
      var legend_options = options.legend;
      if (legend_options === true)
        legend_options = {};

      legend_options = _.defaults({}, legend_options, {
        type: 'Legend',
        position: 'right'
      });

      components.legend = legend_options;
    }
    
    return {
      charts: charts,
      components: components
    };
  };
  
})(d3);
