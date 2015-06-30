(function($, d3, examples, Editor) {

  $(document).ready(function() {
    var editor = new Editor({
      el: '#main-chart'
    });

    editor.setExample(examples['getting-started']);
    editor.render();
  });
  
})(jQuery, d3, examples, Editor);
