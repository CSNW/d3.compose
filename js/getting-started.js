(function($, d3, examples, Editor) {

  $(document).ready(function() {
    var masthead = createMastheadChart();
    var steps = createGettingStartedChart();

    affix()
    scrollspy(steps);

    setActiveExample(steps);
  });

  function createMastheadChart() {
    var masthead = new Editor({
      el: '#home-chart'
    });

    masthead.setExample(examples['masthead']);
    masthead.render();

    return masthead;
  }

  function createGettingStartedChart() {
    var steps = new Editor({
      el: '#getting-started-chart',
      include_controls: false,
      dimensions: {width: 450, height: 340}
    });

    return steps;
  }

  function affix() {
    var offset = $('#getting-started-chart').offset();
    $('.getting-started-chart-container').affix({
      offset: {
        top: offset.top - 50
      }
    });
  }

  function scrollspy(editor) {
    $(document.body).scrollspy({
      target: '.getting-started-nav',
      offset: 50
    }).on('activate.bs.scrollspy', setActiveExample.bind(null, editor));
  }

  function setActiveExample(editor) {
    var step = getActiveStep();
    var example = examples['getting-started-' + step];

    if (example) {
      editor.setExample(example);
      editor.render();
    }
    else {
      console.error('No example found for step ' + step);
    }
  }

  function getActiveStep() {
    var active = $('.getting-started-nav').find('.active a')[0];
    var step = 2;

    if (active)
      step = active.href.split('#')[1].split('-')[0];

    // Start at step 2 by default (1 is empty)
    if (step < 2)
      step = 2;

    return step;
  }

})(jQuery, d3, examples, Editor);
