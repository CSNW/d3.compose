(function(d3) {

  describe('Chart', function() {
    var Chart = d3.chart('Chart');

    it('should set options from constructor', function() {
      var chart = new Chart(null, {a: 123, b: 456});

      expect(chart.options()).toEqual({a: 123, b: 456});
    });
  });

})(d3);
