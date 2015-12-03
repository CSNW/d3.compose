import expect, {createSpy, spyOn, restoreSpies} from 'expect';
import {property, translate, dimensions} from '../src/helpers';
import Chart from '../src/Chart';
import Component from '../src/Component';
import Compose from '../src/Compose';

describe('Compose', () => {
  var context = {};
  const TestChart = Chart.extend({
    name: property()
  });
  const TestComponent = Component.extend({
    name: property()
  });
  const Container = Compose.extend();

  beforeEach(() => {
    const selection = d3.select('body').append('div').attr('id', 'chart');
    const container = new Container(selection);
    container
      .responsive(false)
      .margins(0);

    // Add items to context
    Object.assign(context, {
      selection,
      container
    });
  });
  afterEach(() => {
    context.selection.remove();
    context = {};
    restoreSpies();
  });

  it('should attach chart', () => {
    const container = context.container;
    const charts = [new TestChart(container.createChartLayer())];
    charts[0].id = 'chart-1';
    container.charts(charts);

    expect(container.charts()[0]).toBe(charts[0]);
    expect(container._attached['chart-1']).toBe(charts[0]);
  });

  it('should attach component', () => {
    const container = context.container;
    const components = [new TestComponent(container.createComponentLayer())];
    components[0].id = 'component-1';
    container.components(components);

    expect(container.components()[0]).toBe(components[0]);
    expect(container._attached['component-1']).toBe(components[0]);
  });

  describe('Layout', () => {
    beforeEach(() => {
      const container = context.container;

      const spy = createSpy();
      const ComponentA = Component.extend({
        draw: spy
      });

      const ComponentB = ComponentA.extend({
        getLayout() {
          return {
            position: this.position(),
            width: 60,
            height: 70
          };
        }
      });

      const createComponent = (C, position, z_index) => {
        return new C(container.createComponentLayer({z_index}), {position, width: 50, height: 100});
      };

      // Create and attach components
      const components = [
        createComponent(ComponentA, 'top', 101),
        createComponent(ComponentB, 'top', 50),
        createComponent(ComponentB, 'right', 50),
        createComponent(ComponentA, 'right', 100),
        createComponent(ComponentA, 'bottom', 1),
        createComponent(ComponentB, 'bottom', 50),
        createComponent(ComponentB, 'left', 50),
        createComponent(ComponentA, 'left', 200)
      ];
      components.forEach((component, index) => {
        component.id = 'component-' + (index + 1);
      });

      container.components(components);

      // Setup and attach chart
      const chartSpy = createSpy();
      const SimpleChart = Chart.extend({
        draw: chartSpy
      });

      const charts = [new SimpleChart(container.createChartLayer({z_index: 100}))];
      charts[0].id = 'chart-1';

      container.charts(charts);

      // Setup container
      container.width(600).height(400);
      container.layout();

      // Add items to context
      Object.assign(context, {
        components,
        charts
      });
    });

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

    it('should layout "top" components by offset and position', () => {
      expect(context.components[0].base.attr('transform')).toEqual(translate(110, 70));
      expect(context.components[1].base.attr('transform')).toEqual(translate(110, 0));
    });

    it('should layout "right" components by offset and position', () => {
      expect(context.components[2].base.attr('transform')).toEqual(translate(490, 170));
      expect(context.components[3].base.attr('transform')).toEqual(translate(550, 170));
    });

    it('should layout "bottom" components by offset and position', () => {
      expect(context.components[4].base.attr('transform')).toEqual(translate(110, 230));
      expect(context.components[5].base.attr('transform')).toEqual(translate(110, 330));
    });

    it('should layout "left" components by offset and position', () => {
      expect(context.components[6].base.attr('transform')).toEqual(translate(50, 170));
      expect(context.components[7].base.attr('transform')).toEqual(translate(0, 170));
    });

    it('should layout chart based on component layout', () => {
      const chart_base = context.charts[0].base;

      expect(chart_base.attr('transform')).toEqual(translate(110, 170));
      expect(dimensions(chart_base).width).toEqual(380);
      expect(dimensions(chart_base).height).toEqual(60);
    });

    it('should layout on draw', () => {
      spyOn(context.container, 'layout');

      context.container.draw([]);
      expect(context.container.layout).toHaveBeenCalled();
    });

    it('should set "z-index" with layering on draw', () => {
      const expected = [
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

      const layers = context.container.base.selectAll('g');
      expect(layers[0].length).toEqual(expected.length);
      layers.each(function(d, i) {
        const g = d3.select(this);
        expect(g.attr('class')).toContain(expected[i]['class']);
        expect(g.attr('data-id')).toEqual(expected[i].id);
        expect(parseInt(g.attr('data-zIndex'), 10)).toEqual(expected[i].z_index);
      });
    });
  });
});
