import expect from 'expect';
import {Chart} from '../../src/chart';
import {Component} from '../../src/component';
import isChart from '../../src/helpers/is-chart';

describe('isChart', () => {
  it('should identify subclasses of Chart', () => {
    expect(isChart(Chart)).toEqual(true);
    expect(isChart(Component)).toEqual(true);
    expect(isChart(Chart.extend())).toEqual(true);
    expect(isChart(Component.extend())).toEqual(true);

    expect(isChart()).toEqual(false);
    expect(isChart(() => {})).toEqual(false);
    expect(isChart({})).toEqual(false);
  });
});
