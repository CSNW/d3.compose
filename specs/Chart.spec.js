(function(d3, _, helpers, mixins) {

  describe('Chart', function() {
    var Chart = d3.chart('Chart');

    it('should set options from constructor', function() {
      var chart = new Chart(null, {a: 123, b: 456});

      expect(chart.options()).toEqual({a: 123, b: 456});
    });
  });

})(d3, _, d3.chart.helpers, d3.chart.mixins);
