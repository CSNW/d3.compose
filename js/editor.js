(function(Backbone, hljs, global) {
  
  global.Editor = Backbone.View.extend({
    className: 'editor is-constrained',

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
          .height(400);
      }

      var fn = new Function('data', this.generate())
      this.chart.options(fn);
      this.chart.draw(this.data);
    },

    renderOptions: function renderConfig() {
      renderAndHighlight(this.$('.js-options')[0], 'd3.select(\'#chart\').chart(\'Compose\', function(data) {\n' + this.generate() + '});');
    },

    renderData: function renderData() {
      renderAndHighlight(this.$('.js-data')[0], JSON.stringify(this.data, null, 2));
    },

    renderCustomize: function renderCustomize() {
      // TODO
    }
  });

  function renderAndHighlight(el, js) {
    try {
      var html = '<pre><code class="js">' + js + '</code></pre>';
      el.innerHTML = html;
      hljs.highlightBlock(el);  
    } catch (ex) {}
  }

})(Backbone, hljs, this);
