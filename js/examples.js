(function($, _, Backbone, d3, hljs, global) {

var helpers = d3.chart.helpers;
var mixins = d3.chart.mixins;

var examples = {};

// Line
examples.line = {};
examples.line.options = function(data) {
  var scales = {
    x: {data: data, key: 'x'},
    y: {data: data, key: 'y'}
  };

  return {
    charts: {
      line: {
        type: 'Line',
        data: data,
        xScale: scales.x,
        yScale: scales.y,
        interpolate: 'monotone'
      }
    },
    components: {
      'axis.x': {
        type: 'Axis',
        position: 'bottom',
        scale: scales.x,
        ticks: 5
      },
      'axis.y': {
        type: 'Axis',
        position: 'left',
        scale: scales.y,
        ticks: 5
      },
      title: {
        type: 'Title',
        position: 'top',
        text: 'Line Chart',
        margins: {top: 0.5, bottom: 0.4}
      }
    }
  };
};
examples.line.data = [
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

// Line-Bar Values
examples['line-bar-values'] = {};
examples['line-bar-values'].options = function(data) {
  var input = data.input;
  var results = data.results;
  var scales = {
    x: {type: 'ordinal', data: input, key: 'x'},
    y: {data: input, key: 'y'},
    y2: {data: results, key: 'y', domain: [0, 100]}
  };

  return d3.chart.xy({
    charts: {
      input: {
        type: 'LineValues',
        data: input,
        xScale: scales.x,
        yScale: scales.y
      },
      results: {
        type: 'Bars',
        data: results,
        xScale: scales.x,
        yScale: scales.y2
      }
    },
    axes: {
      x: {
        type: 'AxisValues',
        position: 'bottom',
        scale: scales.x
      },
      y: {
        position: 'left',
        scale: scales.y,
        title: 'Input'
      },
      y2: {
        position: 'right',
        scale: scales.y2,
        title: 'Results'
      }
    },
    title: {
      text: 'Input vs. Output',
      margins: {top: 0.5, bottom: 0.5}
    }
  });
};
examples['line-bar-values'].data = {
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

/**
  Interactive d3.chart.multi example

  Features:
  - Navigate between pre-made examples
  - Dynamic data and compose for chart
  - Long-lived chart for transitions
*/
var app = global.example = global.example || {};

var Router = example.Router = Backbone.Router.extend({
  routes: {
    '': 'example',
    ':example': 'example'
  },

  example: function(id, query) {
    var example = examples[id || 'line'];

    if (example) {
      app.state.set({
        active: id,
        example: example,
        options: example.options,
        data: example.data
      });
    }
    else {
      console.error('Example not found for ' + id);
    }
  }
});

var SidebarView = app.SidebarView = Backbone.View.extend({
  initialize: function(options) {
    this.model = options.model;
    this.listenTo(this.model, 'change', this.render);
  },
  render: function() {
    this.$('.active').removeClass('active');
    this.$('[href="#/' + this.model.get('active') + '"]').addClass('active');
  }
});

var ConfigView = app.ConfigView = Backbone.View.extend({
  initialize: function(options) {
    this.model = options.model;
    this.listenTo(this.model, 'change', this.render);
  },
  render: function() {
    var options_element = this.$('.js-options');
    var data_element = this.$('.js-data');

    try {
      var options_html = '<pre><code class="js">' + this.model.get('options').toString() + '</code></pre>';
      var data_html = '<pre><code class="js">' + JSON.stringify(this.model.get('data'), null, 2) + '</code></pre>';

      options_element.html(options_html || '');
      data_element.html(data_html || '');

      hljs.highlightBlock(options_element[0]);
      hljs.highlightBlock(data_element[0]);
    } catch (ex) {}
  }
});

var ChartView = app.ChartView = Backbone.View.extend({
  initialize: function(options) {
    this.model = options.model;
    this.listenTo(this.model, 'change', this.render);
  },
  render: function() {
    if (!this.chart) {
      this.chart = d3.select(this.$el[0]).append('svg')
        .chart('Multi')
        .margins({top: 0, right: 15, bottom: 5, left: 5});
    }

    this.chart.options(this.model.get('options'));
    this.chart.draw(this.model.get('data'));
  }
});

app.startup = function() {
  app.state = new Backbone.Model();

  app.router = new Router();

  app.sidebar = new SidebarView({
    model: app.state,
    el: $('.js-sidebar')[0]
  });
  app.config = new ConfigView({
    model: app.state,
    el: $('.js-config')[0]
  });
  app.chart = new ChartView({
    model: app.state,
    el: $('.js-chart')[0]
  });

  Backbone.history.start();
};

$(document).ready(app.startup);

})(jQuery, _, Backbone, d3, hljs, this);
