/* global describe, it, expect, beforeEach, setFixtures, d3 */
(function(d3) {

  describe('Component', function() {
    var Component = d3.chart('Component');

    beforeEach(function() {
      setFixtures('<svg id="chart"></svg>');
    });

    it('should have width by default', function() {
      var component = new Component(d3.select('#chart'));
      component.base.attr('width', 400);

      expect(component.width()).toEqual(400);
    });

    it('should have height by default', function() {
      var component = new Component(d3.select('#chart'));
      component.base.attr('height', 300);

      expect(component.height()).toEqual(300);
    });

    it('should getLayout with width, height, and position by default', function() {
      var component = new Component(d3.select('#chart'));
      component.base
        .attr('width', 400)
        .attr('height', 300);
      component
        .position('left')
        .margins({top: 30, right: 40, bottom: 30, left: 40});

      var layout = component.getLayout([]);

      expect(layout.position).toEqual('left');
      expect(layout.width).toEqual(480);
      expect(layout.height).toEqual(360);
    });

    it('should setLayout with transform, width, and height by default', function() {
      var component = new Component(d3.select('#chart'));

      component
        .width(400)
        .height(300)
        .margins({top: 30, right: 40, bottom: 30, left: 40});

      component.setLayout(10, 10, {width: 100, height: 200});

      expect(component.width()).toEqual(100);
      expect(component.height()).toEqual(200);
      expect(component.base.attr('transform')).toEqual('translate(50, 40)');
    });
  });

})(d3);
