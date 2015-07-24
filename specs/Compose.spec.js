/* global describe, it, expect, beforeEach, spyOn, jasmine, setFixtures, d3 */
(function(d3, helpers) {

  describe('Compose', function() {
    var layered = d3.compose.layered;
    var selection, Container, container, Chart, Component;

    beforeEach(function() {
      setFixtures('<div id="chart"></div>');
      selection = d3.select('#chart');

      Container = d3.chart('Compose').extend('TestContainer');
      container = new Container(selection);
      container.responsive(false);
      container.margins(0);

      Chart = d3.chart('Chart').extend('TestChart', {
        name: helpers.property('name')
      });
      Component = d3.chart('Component').extend('TestComponent', {
        name: helpers.property('name')
      });
    });

    it('should attach chart', function() {
      var charts = [new Chart(container.createChartLayer())];
      charts[0].id = 'chart-1';
      container.charts(charts);

      expect(container.charts()[0]).toBe(charts[0]);
      expect(container._attached['chart-1']).toBe(charts[0]);
    });

    it('should attach component', function() {
      var components = [new Component(container.createComponentLayer())];
      components[0].id = 'component-1';
      container.components(components);

      expect(container.components()[0]).toBe(components[0]);
      expect(container._attached['component-1']).toBe(components[0]);
    });

    describe('Layout', function() {
      var OverridenComponent, spy, chartSpy, components;
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
        components.forEach(function(component, index) {
          component.id = 'component-' + (index + 1);
        });

        container.components(components);

        // Setup and attach chart
        chartSpy = jasmine.createSpy('chart.draw');
        Chart = d3.chart('Chart').extend('SimpleChart', {
          draw: chartSpy
        });

        var charts = [new Chart(container.createChartLayer({z_index: 100}))];
        charts[0].id = 'chart-1';

        container.charts(charts);

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

        expect(d3.select('#chart').selectAll('g')[0].length).toEqual(expected.length);
        d3.select('#chart').selectAll('g').each(function(d, i) {
          var group = d3.select(this);
          expect(group.attr('class')).toMatch(expected[i]['class']);
          expect(group.attr('data-id')).toEqual(expected[i].id);
          expect(parseInt(group.attr('data-zIndex'), 10)).toEqual(expected[i].z_index);
        });
      });
    });

    describe('options', function() {
      describe('object (DEPRECATED)', function() {
        beforeEach(function() {
          container.options(function() {
            return {
              charts: {
                a: {type: 'TestChart'},
                b: {type: 'TestChart'}
              },
              components: {
                c: {type: 'TestComponent', position: 'top'},
                d: {type: 'TestComponent', position: 'top'},
                e: {type: 'TestComponent', position: 'left'},
                f: {type: 'TestComponent', position: 'left'},
                g: {type: 'TestComponent', position: 'right'},
                h: {type: 'TestComponent', position: 'right'},
                i: {type: 'TestComponent', position: 'bottom'},
                j: {type: 'TestComponent', position: 'bottom'}
              }
            };
          });

          container.draw([]);
        });

        it('should load charts + order + ids from options', function() {
          expect(container.charts().length).toEqual(2);
          expect(container.charts()[0].id).toEqual('a');
          expect(container.charts()[1] instanceof Chart).toEqual(true);
        });

        it('should load components + order + keys from options', function() {
          expect(container.components().length).toEqual(8);
          expect(container.components()[0].id).toEqual('c');
          expect(container.components()[7].id).toEqual('j');

          var layout = container._extractLayout([]);

          expect(layout.top[0].component.id).toEqual('c');
          expect(layout.top[1].component.id).toEqual('d');
          expect(layout.left[0].component.id).toEqual('e');
          expect(layout.left[1].component.id).toEqual('f');
          expect(layout.right[0].component.id).toEqual('g');
          expect(layout.right[1].component.id).toEqual('h');
          expect(layout.bottom[0].component.id).toEqual('i');
          expect(layout.bottom[1].component.id).toEqual('j');
        });
      });

      describe('array', function() {
        beforeEach(function() {
          container.options(function() {
            var charts = [
              {id: 'a', type: 'TestChart'},
              {id: 'b', type: 'TestChart'}
            ];

            return [
              {id: 'd', type: 'TestComponent'},
              {id: 'c', type: 'TestComponent'},
              [
                {id: 'f', type: 'TestComponent'},
                {id: 'e', type: 'TestComponent'},
                layered(charts),
                {id: 'g', type: 'TestComponent'},
                {id: 'h', type: 'TestComponent'}
              ],
              {id: 'i', type: 'TestComponent'},
              {id: 'j', type: 'TestComponent'}
            ];
          });

          container.draw([]);
        });

        it('should load charts from options', function() {
          expect(container.charts().length).toEqual(2);
          expect(container.charts()[0].id).toEqual('a');
          expect(container.charts()[1] instanceof Chart).toEqual(true);
        });

        it('should load components from options', function() {
          expect(container.components().length).toEqual(8);
          expect(container.components()[0].id).toEqual('c');
          expect(container.components()[7].id).toEqual('j');

          var layout = container._extractLayout([]);

          expect(layout.top[0].component.id).toEqual('c');
          expect(layout.top[1].component.id).toEqual('d');
          expect(layout.left[0].component.id).toEqual('e');
          expect(layout.left[1].component.id).toEqual('f');
          expect(layout.right[0].component.id).toEqual('g');
          expect(layout.right[1].component.id).toEqual('h');
          expect(layout.bottom[0].component.id).toEqual('i');
          expect(layout.bottom[1].component.id).toEqual('j');
        });

        it('should automatically assign ids by type + position', function() {
          container.options(function() {
            var charts = [
              {name: 'a', type: 'TestChart'},
              {name: 'b', type: 'TestChart'}
            ];

            return [
              {name: 'd', type: 'TestComponent'},
              {name: 'c', type: 'TestComponent'},
              [
                {name: 'f', type: 'TestComponent'},
                {name: 'e', type: 'TestComponent'},
                layered(charts),
                {name: 'g', type: 'TestComponent'},
                {name: 'h', type: 'TestComponent'}
              ],
              {name: 'i', type: 'TestComponent'},
              {name: 'j', type: 'TestComponent'}
            ];
          });

          container.draw([]);

          expect(container.charts()[0].name()).toEqual('a');
          expect(container.charts()[0].id).toEqual('item-3-3-1');
          expect(container.charts()[1].name()).toEqual('b');
          expect(container.charts()[1].id).toEqual('item-3-3-2');

          expect(container.components()[0].name()).toEqual('c');
          expect(container.components()[0].id).toEqual('item-2-1');
          expect(container.components()[1].name()).toEqual('d');
          expect(container.components()[1].id).toEqual('item-1-1');
          expect(container.components()[2].name()).toEqual('e');
          expect(container.components()[2].id).toEqual('item-3-2');
          expect(container.components()[3].name()).toEqual('f');
          expect(container.components()[3].id).toEqual('item-3-1');
          expect(container.components()[4].name()).toEqual('g');
          expect(container.components()[4].id).toEqual('item-3-4');
          expect(container.components()[5].name()).toEqual('h');
          expect(container.components()[5].id).toEqual('item-3-5');
          expect(container.components()[6].name()).toEqual('i');
          expect(container.components()[6].id).toEqual('item-4-1');
          expect(container.components()[7].name()).toEqual('j');
          expect(container.components()[7].id).toEqual('item-5-1');
        });
      });
    });
  });

})(d3, d3.compose.helpers);
