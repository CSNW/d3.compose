(function(Backbone, hljs, global) {
  
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
      var html = '<div class="editor-customize js-customize">Customize...</div>' +
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
      this.renderCustomize();
    },

    renderChart: function renderChart() {
      if (!this.chart) {
        this.chart = d3.select(this.$('.js-chart')[0])
          .chart('Compose')
          .width(600)
          .height(400)
          .margins({top: 10, right: 30, bottom: 20, left: 20});
      }

      this.chart.options(prepareOptionsFn(this.example, this.getOptions()));
      this.chart.draw(prepareData(this.example, this.getDataKey()));
    },

    renderOptions: function renderOptions() {
      renderAndHighlight(this.$('.js-options')[0], prepareOptionsString(this.example, this.getOptions()));
    },

    renderData: function renderData() {
      renderAndHighlight(this.$('.js-data')[0], prepareDataString(this.example, this.getDataKey()));
    },

    renderCustomize: function renderCustomize() {
      // TODO
    },

    setExample: function setExample(example) {
      this.example = example;

      // TODO Load from customize form
      var options = {};      
      _.each(this.example.options, function(option, key) {
        options[key] = !option.default_value;
      });
      this.setOptions(options);

      // TODO Load from data dropdown
      this.setDataKey('series');
    },

    getOptions: function getOptions() {
      return this.options;
    },
    setOptions: function setOptions(options) {
      this.options = options;
    },

    getDataKey: function getDataKey() {
      return this.data_key;
    },
    setDataKey: function setDataKey(key) {
      this.data_key = key;
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

  function prepareOptionsFn(example, options) {
    return new Function('data', example.generate(options));
  }
  function prepareOptionsString(example, options) {
    return 'd3.select(\'#chart\').chart(\'Compose\', function(data) {\n' + example.generate(options) + '});'
  }

  function prepareData(example, data_key) {
    return example.data[data_key];
  }
  function prepareDataString(example, data_key) {
    return JSON.stringify(prepareData(example, data_key), null, 2);
  }

  function renderAndHighlight(el, js) {
    try {
      var html = '<pre><code class="js">' + js + '</code></pre>';
      el.innerHTML = html;
      hljs.highlightBlock(el);  
    } catch (ex) {}
  }

})(Backbone, hljs, this);
