(function($, d3, examples, Editor) {

  $(document).ready(function() {
    // Render masthead chart
    var masthead = new Editor({
      el: '#home-chart'
    });

    masthead.setExample(examples['masthead']);
    masthead.render();

    // Affix, scrollspy, and render getting started chart
    var steps = new Editor({
      el: '#getting-started-chart',
      include_controls: false,
      dimensions: {width: 450, height: 340}
    });

    var offset = $('#getting-started-chart').offset();

    $('.getting-started-chart-container').affix({
      offset: {
        top: offset.top
      }
    });

    $(document.body).scrollspy({
      target: '.getting-started-nav',
      offset: 50
    }).on('activate.bs.scrollspy', getActiveStep);

    getActiveStep();

    function getActiveStep() {
      var active = $('.getting-started-nav').find('.active a')[0];
      var step = 2;

      if (active)
        step = active.href.split('#')[1].split('-')[0];

      if (step < 2)
        return;

      var example = examples['getting-started-' + step];

      if (example) {
        steps.setExample(example);
        steps.render();
      }
      else {
        console.error('No example found for step ' + step + ' (' + (active ? active.href : 'inactive') + ')');
      }
    }
  });

})(jQuery, d3, examples, Editor);
