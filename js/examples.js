(function($, _, Backbone, d3, global) {

  var helpers = d3.chart.helpers;
  var mixins = d3.chart.mixins;

  /**
    Interactive d3.chart.multi example

    Features:
    - Navigate between pre-made examples
    - Dynamic data and compose for chart
    - Long-lived chart for transitions
  */
  var example = global.example = global.example || {};

  var Router = example.Router = Backbone.Router.extend({
    routes: {
      '': 'line',
      'line': 'line',
      'line-bar-values': 'lineBarValues'
    },

    line: function() {
      var config = function(data) {
        var scales = {
          x: {data: data, key: 'x'},
          y: {data: data, key: 'y'}
        };

        return {
          charts: {
            line: {type: 'Line', data: data, xScale: scales.x, yScale: scales.y, interpolate: 'monotone'}
          },
          components: {
            'axis.x': {type: 'Axis', position: 'bottom', scale: scales.x, ticks: 5},
            'axis.y': {type: 'Axis', position: 'left', scale: scales.y, ticks: 5},
            title: {type: 'Title', position: 'top', text: 'Line Chart', margins: {top: 0.5, bottom: 0.4}}
          }
        };
      };
      var data = [
        {
          key: 'a', values: [
            {x: 0, y: 10}, {x: 10, y: 20}, {x: 20, y: 50}, {x: 30, y: 100}
          ]
        },
        {
          key: 'b', values: [
            {x: 0, y: 50}, {x: 10, y: 45}, {x: 20, y: 15}, {x: 30, y: 10}
          ]
        }
      ];

      example.sidebar.render({active: 'line'});
      example.config.render({example: 'line'});
      example.chart.render({config: config, data: data});
    },

    lineBarValues: function() {
      var config = function(data) {
        var input = data.input;
        var results = data.results;
        var scales = {
          x: {type: 'ordinal', data: input, key: 'x'},
          y: {data: input, key: 'y'},
          y2: {data: results, key: 'y', domain: [0, 100]}
        };

        return d3.chart.xy({
          charts: {
            input: {type: 'LineValues', data: input, xScale: scales.x, yScale: scales.y},
            results: {type: 'Bars', data: results, xScale: scales.x, yScale: scales.y2}
          },
          axes: {
            x: {type: 'AxisValues', position: 'bottom', scale: scales.x},
            y: {position: 'left', scale: scales.y, title: 'Input'},
            y2: {position: 'right', scale: scales.y2, title: 'Results'}
          },
          title: {text: 'Input vs. Output', margins: {top: 0.5, bottom: 0.5}}
        });
      };
      var data = {
        input: [
          {
            key: 'input',
            values: [{x: 'a', y: 100}, {x: 'b', y: 200}, {x: 'c', y: 300}]
          }
        ],
        results: [
          {
            key: 'run-1',
            values: [{x: 'a', y: 10}, {x: 'b', y: 30}, {x: 'c', y: 20}]
          },
          {
            key: 'run-2',
            values: [{x: 'a', y: 15}, {x: 'b', y: 25}, {x: 'c', y: 20}]
          }
        ]
      };

      example.sidebar.render({active: 'line-bar-values'});
      example.config.render({example: 'line-bar-values'});
      example.chart.render({config: config, data: data});
    }
  });

  var SidebarView = example.SidebarView = Backbone.View.extend({
    render: function(options) {
      this.$('.active').removeClass('active');
      this.$('[href="#/' + options.active + '"]').addClass('active');
    }
  });

  var ConfigView = example.ConfigView = Backbone.View.extend({
    render: function(options) {
      var options_html = $('#example-' + options.example + '-config').html();
      var data_html = $('#example-' + options.example + '-data').html();

      this.$('.js-options').html(options_html || '');
      this.$('.js-data').html(data_html || '');
    }
  });

  var ChartView = example.ChartView = Backbone.View.extend({
    render: function(options) {
      if (!this.chart) {
        this.chart = d3.select(this.$el[0]).append('svg')
          .chart('Multi')
          .margins({top: 0, right: 15, bottom: 5, left: 5});
      }

      this.chart.options(options.config);
      this.chart.draw(options.data);
    }
  });

  example.startup = function() {
    example.router = new Router();

    example.sidebar = new SidebarView({
      el: $('.js-sidebar')[0]
    });
    example.config = new ConfigView({
      el: $('.js-config')[0]
    });
    example.chart = new ChartView({
      el: $('.js-chart')[0]
    });

    Backbone.history.start();
  };

  $(document).ready(example.startup);

})(jQuery, _, Backbone, d3, this);
