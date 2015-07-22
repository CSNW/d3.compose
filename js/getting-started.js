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

    masthead.setExample(examples['masthead'][0]);
    masthead.render();

    var carousel = createCarousel(masthead);

    $(document).on('click', '.home-masthead-carousel[data-prev]', carousel.prev);
    $(document).on('click', '.home-masthead-carousel[data-next]', carousel.next);

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

    if (active)
      details = getDetailsFromLink(active);

    if (!details) {
      details = {
        id: '1-download',
        number: 1
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

  function createCarousel(chart) {
    var loop = setInterval(next, 3000);
    var choices = examples['masthead'];
    var current_index = 0;

    // Pause on show options
    chart.on('show:options', function() {
      clearInterval(loop);
    });

    return {
      next: function() {
        clearInterval(loop);
        next();
      },
      prev: function() {
        clearInterval(loop);
        prev();
      }
    }

    function next() {
      current_index += 1;
      if (current_index >= choices.length)
        current_index = 0;

      chart.setExample(choices[current_index]);
      chart.render();
    }
    function prev() {
      current_index -= 1;
      if (current_index < 0)
        current_index = choices.length - 1;

      chart.setExample(choices[current_index]);
      chart.render();
    }
  }

})(jQuery, d3, examples, Editor);
