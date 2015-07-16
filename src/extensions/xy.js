(function(d3, helpers) {
  var utils = helpers.utils;

  /**
    Extensions are used for defining options for d3.compose that wrap common behavior, reduce boilerplate,
    and provide helpers for composing charts and components.

    @class extensions
  */

  /**
    XY extension
    Generate d3.compose options for XY charts
  
    @example
    ```js
    d3.select('#chart')
      .chart('Compose', function(data) {
        var scales = {
          x: {}, // ...
          y: {}, // ...
          y2: {} // ...
        };

        return d3.compose.xy({
          // charts and components as normal
          charts: {
            bars: {type: 'Bars'}, // ...
            lines: {type: 'Lines'} // ...
          }, 
          components: {}, // ...

          // Axes:
          // type: 'Axis'
          // position: x -> 'bottom', y -> 'left', x2 -> 'top', y2: 'right'
          axes: {
            x: {scale: scales.x, title: 'X Axis'},
            y: {scale: scales.y, title: 'Y Axis'},
            y2: {scale: scales.y2, title: 'Y2 Axis'}
          },
          title: 'Chart Title',
          legend: true
        });

        // transforms to
        return {
          charts: {
            bars: {type: 'Bars'},
            lines: {type: 'Lines'}
          },
          components: {
            // ...
            'axis.x': {type: 'Axis', position: 'bottom', scale: scales.x},
            'axis.x.title': {type: 'Title', position: 'bottom', text: 'X Axis'},
            'axis.y': {type: 'Axis', position: 'left', scale: scales.y},
            'axis.y.title': {type: 'Title', position: 'left', text: 'Y Axis'},
            'axis.y2': {type: 'Axis', position: 'right', scale: scales.y2},
            'axis.y2.title': {type: 'Title', position: 'right', text: 'Y2 Axis'},
            title: {type: 'Title', position: 'top', text: 'Chart Title'},
            legend: {type: 'Legend', position: 'right', charts: ['bars', 'lines']}
          }
        };
      })
    ```
    @method d3.compose.xy
    @for extensions
    @param {Object} options
    @param {Object} [options.charts] Standard d3.compose charts options
    @param {Object} [options.components] Standard d3.compose components options
    @param {Object} [options.axes] Set of axes components with defaults (type: 'Axis', position: (by key: x -> 'bottom', y -> 'left', x2 -> 'top', y2: 'right')) and 'title' that creates matched title component
    @param {String|Object} [options.title] Title text (with defaults) or options
    @param {Boolean|Object} [options.legend] Show legend (with defaults) or legend options
  */
  d3.compose.xy = function xy(options) {
    options = options || {};
    var charts = utils.extend({}, options.charts);
    var components = {};
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
    utils.eachObject(options.axes, function(axis_options, key) {
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
      components: utils.extend(components, options.components)
    };
  };

})(d3, d3.compose.helpers);
