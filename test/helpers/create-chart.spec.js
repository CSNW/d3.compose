import expect, {createSpy} from 'expect';
import {Chart} from '../../src/chart';
import createChart from '../../src/helpers/create-chart';

describe('createChart', () => {
  it('should pass through chart class', () => {
    const Custom = Chart.extend({});

    expect(createChart(Custom)).toBe(Custom);
  });

  it('should wrap chart function in Chart', () => {
    const Draw = createSpy();
    Draw.properties = {};

    const Wrapped = createChart(Draw);

    const selection = {};
    const props = {};
    const instance = new Wrapped(selection, props);

    expect(Wrapped.properties).toBe(Draw.properties);

    instance.render();
    expect(Draw).toHaveBeenCalled();
    expect(Draw).toHaveBeenCalledWith(selection, props);
  });
});
