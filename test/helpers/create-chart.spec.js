const expect = require('expect');
const mockSelection = require('../_helpers/mock-selection');
const d3c = require('../../');

const createSpy = expect.createSpy;
const Chart = d3c.Chart;
const createChart = d3c.helpers.createChart;

describe('createChart', () => {
  it('should pass through chart class', () => {
    const Custom = Chart.extend({});

    expect(createChart(Custom)).toBe(Custom);
  });

  it('should wrap chart function in Chart', () => {
    const Draw = createSpy();
    Draw.properties = {};

    const Wrapped = createChart(Draw, Chart);

    const selection = mockSelection();
    const props = {};
    const instance = new Wrapped(selection, props);

    expect(Wrapped.properties).toBe(Draw.properties);

    instance.render();
    expect(Draw).toHaveBeenCalled();
    expect(Draw.calls[0].arguments[0]).toBe(selection);
    expect(Draw.calls[0].arguments[1]).toEqual(props);
  });
});
