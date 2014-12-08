(function(d3, _, mixins, helpers) {

  describe('components', function() {
    var fixture, selection, Component, component, Chart, chart;
    beforeEach(function() {
      fixture = setFixtures('<div id="chart"></div>');
      selection = d3.select('#chart')
        .append('svg');

      Component = d3.chart('Component').extend('SimpleComponent', {
        initialize: function() {
          this.base.append('rect')
            .attr('width', 50)
            .attr('height', 100);
        }
      });
      Chart = d3.chart('Container').extend('SimpleChart', {
        initialize: function() {
          component = new Component(this.base.append('g'));
          this.attachComponent('component', component);
        }
      });

      chart = selection.chart('SimpleChart');
    });

    it('should get bounding box width/height by default', function() {
      expect(component.width()).toEqual(50);
      expect(component.height()).toEqual(100);
    });
  });

})(d3, _, d3.chart.mixins, d3.chart.helpers);
