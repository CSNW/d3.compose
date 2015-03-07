(function(d3, _, helpers, mixins) {

  describe('Multi', function() {
    var fixture, selection, Container, container, Chart, charts, Component, components;
    beforeEach(function() {
      fixture = setFixtures('<svg id="chart"></svg>');
      selection = d3.select('#chart');

      Container = d3.chart('Multi').extend('TestContainer');
      container = new Container(selection);

      Chart = d3.chart('Chart').extend('TestChart');
      Component = d3.chart('Component').extend('TestComponent');

      charts = [];
      components = [];
    });

    it('should attach chart', function() {
      charts[0] = new Chart(container.createChartLayer());
      container.charts({
        'chart1': charts[0]
      });

      expect(container.charts()['chart1']).toBe(charts[0]);
      expect(container._attached['chart1']).toBe(charts[0]);
    });

    it('should attach component', function() {
      components[0] = new Component(container.createComponentLayer());
      container.components({
        component1: components[0]
      });

      expect(container.components()['component1']).toBe(components[0]);
      expect(container._attached['component1']).toBe(components[0]);
    });

    describe('Layout', function() {
      var OverridenComponent, spy, chartSpy;
      beforeEach(function() {
        // Setup components
        spy = jasmine.createSpy('component.draw');
        Component = d3.chart('Component').extend('SimpleComponent', {
          initialize: function() {
            this.base.append('rect')
              .attr('width', 50)
              .attr('height', 100);
          },
          draw: spy
        });
        OverridenComponent = d3.chart('Component').extend('OverridenComponent', {
          getLayout: function() {
            return {
              position: this.position(),
              width: 60,
              height: 70
            };
          },
          initialize: function() {
            this.base.append('rect')
              .attr('width', 50)
              .attr('height', 100);
          },
          draw: spy
        });

        // Create and attach components
        components = [
          new Component(container.createComponentLayer({z_index: 101}), {position: 'top'}),
          new OverridenComponent(container.createComponentLayer({z_index: 50}), {position: 'top'}),
          new OverridenComponent(container.createComponentLayer({z_index: 50}), {position: 'right'}),
          new Component(container.createComponentLayer({z_index: 100}), {position: 'right'}),
          new Component(container.createComponentLayer({z_index: 1}), {position: 'bottom'}),
          new OverridenComponent(container.createComponentLayer({z_index: 50}), {position: 'bottom'}),
          new OverridenComponent(container.createComponentLayer({z_index: 50}), {position: 'left'}),
          new Component(container.createComponentLayer({z_index: 200}), {position: 'left'})
        ];

        container.components({
          'component-0': components[0],
          'component-1': components[1],
          'component-2': components[2],
          'component-3': components[3],
          'component-4': components[4],
          'component-5': components[5],
          'component-6': components[6],
          'component-7': components[7]
        });

        // Setup and attach chart
        chartSpy = jasmine.createSpy('chart.draw');
        Chart = d3.chart('Chart').extend('SimpleChart', {
          draw: chartSpy
        });

        container.charts({
          'chart-1': new Chart(container.createChartLayer())
        });

        // Setup container
        container.width(600).height(400);
        container.layout();

        /*
          Expected:
          Chart: width x height = 600 x 400

          Top
          ---
          0: offset width x height = 50 x 100 -> offset 100 -> 170 - 100 = 70 -> (110, 70)
          1: 60 x 70 -> 70 -> 70 - 70 = 0 -> (110, 0)
          Chart: 0 + 100 + 70 = 170

          Right
          -----
          2: 60 x 70 -> 60 -> 490 + 0 = 490 -> (490, 170)
          3: 50 x 100 -> 50 -> 490 + 60 = 550 -> (550, 170)
          Chart: Width - 60 - 50 = 490

          Bottom
          ------
          4: 50 x 100 -> 100 -> 230 + 0 = 230 -> (110, 230)
          5: 60 x 70 -> 70 -> 230 + 100 = 330 -> (110, 330)
          Chart: Height - 100 - 70 = 230

          Left
          ----
          6: 60 x 70 -> 60 -> 110 - 60 = 50 -> (50, 170)
          7: 50 x 100 -> 50 -> 50 - 50 = 0 -> (0, 170)
          Chart: 0 + 60 + 50 = 110

          Chart: (110, 170), width = 380, height = 60
        */
      });

      var translate = helpers.translate;

      it('should layout "top" components by offset and position', function() {
        expect(components[0].base.attr('transform')).toEqual(translate(110, 70));
        expect(components[1].base.attr('transform')).toEqual(translate(110, 0));
      });

      it('should layout "right" components by offset and position', function() {
        expect(components[2].base.attr('transform')).toEqual(translate(490, 170));
        expect(components[3].base.attr('transform')).toEqual(translate(550, 170));
      });

      it('should layout "bottom" components by offset and position', function() {
        expect(components[4].base.attr('transform')).toEqual(translate(110, 230));
        expect(components[5].base.attr('transform')).toEqual(translate(110, 330));
      });

      it('should layout "left" components by offset and position', function() {
        expect(components[6].base.attr('transform')).toEqual(translate(50, 170));
        expect(components[7].base.attr('transform')).toEqual(translate(0, 170));
      });

      it('should layout chartBase by component layout', function() {
        var createChartLayer = container.base.select('.chart-layer');

        expect(createChartLayer.attr('transform')).toEqual(translate(110, 170));
        expect(createChartLayer.attr('transform')).toEqual(translate(110, 170));
        expect(helpers.dimensions(createChartLayer).width).toEqual(380);
        expect(helpers.dimensions(createChartLayer).height).toEqual(60);
      });

      // it('should pre-draw just components on draw', function() {
      //   spyOn(d3.chart().prototype, 'draw');

      //   container.draw([]);
      //   expect(spy.calls.count()).toEqual(8);
      //   expect(chartSpy.calls.count()).toEqual(0);
      // });

      it('should layout on draw', function() {
        spyOn(container, 'layout');
        spyOn(d3.chart().prototype, 'draw');

        container.draw([]);
        expect(container.layout).toHaveBeenCalled();
      });

      it('should set "z-index" with layering on draw', function() {
        var expected = [
          {'class': 'chart-component-layer', id: 'component-5', z_index: 1},
          {'class': 'chart-component-layer', id: 'component-2', z_index: 50},
          {'class': 'chart-component-layer', id: 'component-3', z_index: 50},
          {'class': 'chart-component-layer', id: 'component-6', z_index: 50},
          {'class': 'chart-component-layer', id: 'component-7', z_index: 50},
          {'class': 'chart-component-layer', id: 'component-4', z_index: 100},
          {'class': 'chart-layer', id: 'chart-1', z_index: 100},
          {'class': 'chart-component-layer', id: 'component-1', z_index: 101},
          {'class': 'chart-component-layer', id: 'component-8', z_index: 200}
        ];

        container.draw([]);

        d3.select('.chart').selectAll('g').each(function(d, i) {
          var selection = d3.select(this);
          expect(selection.classed(expected[i]['class'])).toEqual(true);
          expect(selection.attr('data-id')).toEqual(expected[i].id);
          expect(+selection.attr('data-zIndex')).toEqual(expected[i].z_index);
        });
      });
    });
  });

})(d3, _, d3.chart.helpers, d3.chart.mixins);
