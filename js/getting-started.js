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
      el: '#getting-started-chart'
    });

    $('.getting-started-chart-container').affix({
      offset: {
        top: 550
      }
    });

    $(document.body)
      .scrollspy({
        target: '.getting-started-nav',
        offset: 300
      })
      .on('activate.bs.scrollspy', getActiveStep);
    getActiveStep();

    function getActiveStep() {
      var active = $('.getting-started-nav').find('.active a')[0];
      if (active) {
        var step = active.href.split('#')[1].split('-')[0];
        console.log('example', step);
        var example = examples['getting-started-' + step];

        if (example) {
          steps.setExample(example);
          steps.render();
        }
        else {
          console.error('No example found for step ' + step + ' (' + active.href + ')');
        }
      }
    }
  });

})(jQuery, d3, examples, Editor);
