(function($, d3, examples, Editor) {

  $(document).ready(function() {
    var masthead = createMastheadChart();

    $(window).on('resize', _.throttle(showSteps, 100));
    showSteps();
  });

  function createMastheadChart() {
    var masthead = new Editor({
      el: '#home-chart'
    });

    masthead.setExample(examples['masthead']);
    masthead.render();

    return masthead;
  }

  var shown_steps = false;
  var shown_inline = false;
  var hidden_steps = false;
  var steps;

  function showSteps() {
    var show_steps = $('.getting-started-chart-container').is(':visible');

    if (show_steps) {
      if (shown_steps) {
        if (hidden_steps) {
          // Need to redraw after hide to make sure dimensions are up-to-date
          hidden_steps = false;
          steps.chart.redraw();  
        }
        
        return;
      }

      shown_steps = true;
      hidden_steps = false;
      steps = createStepsChart();

      affix()
      scrollspy(steps);

      setActiveExample(steps);
    }
    else {
      hidden_steps = true;
      if (shown_inline)
        return;

      shown_inline = true;
      createInlineCharts();
    }
  }

  function createStepsChart() {
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
      offset: 300
    }).on('activate.bs.scrollspy', setActiveExample.bind(null, editor));
  }

  function setActiveExample(editor) {
    var step = getActiveStep();
    var example = examples['getting-started-' + step.number];

    if (example) {
      editor.setExample(example);
      editor.render();

      $('.getting-started section').removeClass('is-active');
      $('#' + step.id).parent().addClass('is-active');
    }
    else {
      console.error('No example found for step ' + JSON.stringify(step));
    }
  }

  function getActiveStep() {
    var active = $('.getting-started-nav').find('.active a')[0];
    var details;

    if (active) {
      details = getDetailsFromLink(active);
    }

    // Start at step 2 by default (1 is empty)
    if (!details || details.number < 2) {
      details = {
        id: '2-chart',
        number: 2
      };
    }

    return details;
  }

  function createInlineCharts() {
    var steps = loadExampleSteps();
    _.each(steps, createInlineChart);
  }

  function loadExampleSteps() {
    // Load ids from nav
    var steps = [];
    $('.getting-started-nav a').each(function(i) {
      var details = getDetailsFromLink(this);

      // Start at step 2 by default (1 is empty)
      if (details.number >= 2)
        steps.push(details);
    });

    return steps;
  }

  function getDetailsFromLink(link) {
    var id = link.href.split('#')[1];
    return {
      id: id,
      number: parseInt(id.split('-')[0])
    };
  }

  function createInlineChart(step) {
    var container = $('#' + step.id).parent().find('.chart-container');
    var example = examples['getting-started-' + step.number];

    if (!container.length) {
      console.error('No chart container for step ' + JSON.stringify(step));
      return;
    }
    if (!example) {
      console.error('No example found for step ' + JSON.stringify(step));
      return;
    }

    var chart = new Editor({
      include_controls: false
    });

    container.empty();
    container[0].appendChild(chart.el);

    chart.setExample(example);
    chart.render();
  }

})(jQuery, d3, examples, Editor);
