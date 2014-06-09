(function(d3, _, helpers, extensions) {

  describe('base', function() {
    describe('Container', function() {
      var fixture, selection, Container, container, Chart, charts, Component, components;
      beforeEach(function() {
        fixture = setFixtures('<div id="chart"></div>');
        selection = d3.select('#chart')
          .append('svg');

        Container = d3.chart('Container').extend('TestContainer');
        container = new Container(selection);

        Chart = d3.chart('Chart').extend('TestChart');
        Component = d3.chart('Component').extend('TestComponent');

        charts = [];
        components = [];
      });

      it('should attach chart', function() {
        charts[0] = new Chart(container.chartBase());
        container.attachChart('chart1', charts[0]);

        expect(container.chartsById['chart1']).toBe(charts[0]);
        expect(container._attached['chart1']).toBe(charts[0]);
      });

      it('should attach component', function() {
        components[0] = new Component(container.componentBase());
        container.attachComponent('component1', components[0]);
        
        expect(container.componentsById['component1']).toBe(components[0]);
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
            layoutWidth: function() {
              return 60;
            },
            layoutHeight: function() {
              return 70;
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
            new Component(container.componentBase(), {position: 'top'}),
            new OverridenComponent(container.componentBase(), {position: 'top'}),
            new OverridenComponent(container.componentBase(), {position: 'right'}),
            new Component(container.componentBase(), {position: 'right'}),
            new Component(container.componentBase(), {position: 'bottom'}),
            new OverridenComponent(container.componentBase(), {position: 'bottom'}),
            new OverridenComponent(container.componentBase(), {position: 'left'}),
            new Component(container.componentBase(), {position: 'left'})
          ];
          _.each(components, function(component, index) {
            container.attachComponent('component-' + index, component);
          });

          // Setup and attach chart
          chartSpy = jasmine.createSpy('chart.draw');
          Chart = d3.chart('Chart').extend('SimpleChart', {
            draw: chartSpy
          });
          container.attachChart('chart-1', new Chart(container.chartBase()));

          // Setup container
          container.width(600).height(400);
          container.updateLayout();

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

        var translate = helpers.transform.translate;

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
          expect(container.chartBase().attr('transform')).toEqual(translate(110, 170));
          expect(container.chartBase().attr('transform')).toEqual(translate(110, 170));
          expect(helpers.dimensions(container.chartBase()).width).toEqual(380);
          expect(helpers.dimensions(container.chartBase()).height).toEqual(60);
        });

        it('should pre-draw just components on draw', function() {
          spyOn(d3.chart().prototype, 'draw');

          container.draw([]);
          expect(spy.calls.count()).toEqual(8);
          expect(chartSpy.calls.count()).toEqual(0);
        });

        it('should layout on draw', function() {
          spyOn(container, 'updateLayout');
          spyOn(d3.chart().prototype, 'draw');

          container.draw([]);
          expect(container.updateLayout).toHaveBeenCalled();
        });
      });
    });
  });

})(d3, _, d3.chart.helpers, d3.chart.extensions);
