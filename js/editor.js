(function(Backbone, hljs, global) {

  function Options(options) {
    options = options || {}
    
    this.options = _.omit(options, 'include');
    this.include = options.include || {};
    this.values = {include: {}};

    // Add default values
    _.each(this.options, function(option, key) {
      this.values[key] = option.default_value;
    }, this);

    _.each(this.include, function(include, include_key) {
      this.values.include[include_key] = include.default_value;
      
      if (include.options)
        this.values[include_key] = {};

      _.each(include.options, function(option, option_key) {
        this.values[include_key][option_key] = option.default_value;
      }, this);
    }, this);
  };

  var Customizer = Backbone.View.extend({
    render: function() {
      this.el.innerHTML = 'TODO';
    }
  });

  global.Editor = Backbone.View.extend({
    className: 'editor is-constrained',

    events: {
      'click .js-options-toggle': 'onOptionsToggle'
    },

    initialize: function() {
      _.bindAll(this, 'onOptionsToggle');
      this.showing_options = false;
    },

    template: function template(data) {
      var html = '<div class="editor-customize js-customize"></div>' +
        '<div class="editor-chart-container"><div class="editor-chart js-chart"></div></div>' +
        '<div class="editor-options">' +
        '  <div role="tabpanel">' +
        '    <ul class="nav nav-tabs nav-justified" role="tablist">' +
        '      <li class="active" role="presentation"><a href="#tab-options" aria-controls="options" role="tab" data-toggle="tab">Options</a></li>' +
        '      <li role="presentation"><a href="#tab-data" aria-controls="data" role="tab" data-toggle="tab">Data</a></li>' +
        '    </ul>' +
        '    <div class="tab-content js-config">' +
        '      <div class="tab-pane active example-editor js-options" role="tabpanel" id="tab-options"></div>' +
        '      <div class="tab-pane example-editor js-data" role="tabpanel" id="tab-data"></div>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<div class="editor-details">' +
        '  <a class="editor-show-options js-options-toggle" href="#show-options">Show Options</a>' +
        '  <!--TODO<div class="editor-data-options">' +
        '    Data: <select class="js-data-options"><option>Simple</option></select>' +
        '  </div>-->' +
        '</div>';

      return html;
    },

    render: function render() {
      if (!this.rendered) {
        this.el.innerHTML = this.template(this);
        this.rendered = true;
      }

      this.renderChart();
      this.renderOptions();
      this.renderData();
      this.renderCustomizer();
    },

    renderChart: function renderChart() {
      if (!this.chart) {
        this.chart = d3.select(this.$('.js-chart')[0])
          .chart('Compose')
          .width(600)
          .height(400)
          .margins({top: 10, right: 30, bottom: 20, left: 20});
      }

      try {
        var fn = new Function('options', this.example.generate(this.options.values));
        var data = prepareData(this.example, this.options, this.data_key);

        this.chart.options(fn);
        this.chart.draw(data);  
      } catch (ex) { console.error(ex); }
    },

    renderOptions: function renderOptions() {
      var generated = this.example.generate(this.options.values);
      var output = this.example.output || function(generated) {
        return 'd3.select(\'#chart\').chart(\'Compose\', function(options) {\n' + generated + '\n});';
      };

      renderAndHighlight(this.$('.js-options')[0], output(generated));
    },

    renderData: function renderData() {
      try {
        var data = prepareData(this.example, this.options, this.data_key);
        renderAndHighlight(this.$('.js-data')[0], JSON.stringify(data, null, 2));
      } catch (ex) { console.error(ex); }
    },

    renderCustomizer: function renderCustomizer() {
      if (!this.customizer) {
        this.customizer = new Customizer({
          el: this.$('.js-customize')[0]
        });

        this.listenTo(this.customizer, 'change', function() {
          // TODO
          console.log('changed');
        });
      }

      this.customizer.options = this.options;
      this.customizer.render();
    },

    setExample: function setExample(example) {
      this.example = example;
      this.options = new Options(example.options);

      // TODO Load from data dropdown
      this.data_key = 'series';
    },

    onOptionsToggle: function onShowOptions(e) {
      e.preventDefault();

      if (!this.showing_options) {
        this.$('.editor-options').addClass('is-pinned');
        this.$('.js-options-toggle').text('Hide Options');
      }
      else {
        this.$('.editor-options').removeClass('is-pinned');
        this.$('.js-options-toggle').text('Show Options');
      }
      
      this.showing_options = !this.showing_options;
    }
  });

  function prepareData(example, options, data_key) {
    return _.extend({
      data: example.data[data_key]
    }, Backbone.$.extend(true, {}, options.values));
  }

  function renderAndHighlight(el, js) {
    try {
      var html = '<pre><code class="js">' + js + '</code></pre>';
      el.innerHTML = html;
      hljs.highlightBlock(el);  
    } catch (ex) { console.error(ex); }
  }

})(Backbone, hljs, this);
