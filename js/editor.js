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
      this.el.innerHTML = '';
    }
  });

  global.Editor = Backbone.View.extend({
    className: 'editor is-constrained',

    events: {
      'click .js-options-toggle': 'onOptionsToggle'
    },

    initialize: function(options) {
      options = options || {};
      _.bindAll(this, 'onOptionsToggle');

      this.include_controls = 'include_controls' in options ? options.include_controls : true;
      this.dimensions = _.defaults({}, options.dimensions, {
        width: 600,
        height: 400,
        margins: {top: 10, right: 30, bottom: 20, left: 20}
      });

      this.showing_options = false;
    },

    template: function template(data) {
      var html = '<div class="editor-customize js-customize"></div>' +
        '<div class="editor-chart-container"><div class="editor-chart js-chart"></div></div>';

      if (this.include_controls) {
        html += '<div class="editor-options">' +
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
          '  <a class="editor-show-options js-options-toggle" href="#show-options">Show Source</a>' +
          '  <!--TODO<div class="editor-data-options">' +
          '    Data: <select class="js-data-options"><option>Simple</option></select>' +
          '  </div>-->' +
          '</div>';
      }

      return html;
    },

    render: function render() {
      if (!this.rendered) {
        this.el.innerHTML = this.template(this);
        this.rendered = true;
      }

      var generated = this.example.generate(this.options.values);
      generated.data = prepareData(this.example, this.options, this.data_key);

      this.renderChart(generated);

      if (this.include_controls) {
        this.renderOptions(generated);
        this.renderData(generated);
        this.renderCustomizer();
      }
    },

    renderChart: function renderChart(generated) {
      if (!this.chart) {
        this.chart = d3.select(this.$('.js-chart')[0])
          .chart('Compose')
          .width(this.dimensions.width)
          .height(this.dimensions.height)
          .margins(this.dimensions.margins);
      }

      try {
        this.chart.options(generated.fn);
        this.chart.draw(generated.data);
      } catch (ex) { console.error(ex); }
    },

    renderOptions: function renderOptions(generated) {
      renderAndHighlight(this.$('.js-options')[0], generated.output);
    },

    renderData: function renderData(generated) {
      try {
        renderAndHighlight(this.$('.js-data')[0], JSON.stringify(generated.data, null, 2));
      } catch (ex) { console.error(ex); }
    },

    renderCustomizer: function renderCustomizer() {
      if (!this.customizer) {
        this.customizer = new Customizer({
          el: this.$('.js-customize')[0]
        });

        this.listenTo(this.customizer, 'change', function() {
          // TODO
          // console.log('changed');
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
        this.$('.js-options-toggle').text('Hide Source');
        this.trigger('show:options');
      }
      else {
        this.$('.editor-options').removeClass('is-pinned');
        this.$('.js-options-toggle').text('Show Source');
        this.trigger('hide:options');
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
