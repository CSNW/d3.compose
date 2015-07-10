(function($) {
  $(document.body).scrollspy({
    target: '.docs-sidebar'
  });

  $('.docs-sidebar').affix({
    offset: {
      top: 50
    }
  });
}(jQuery));
