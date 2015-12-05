import expect from 'expect';
import Chart from '../src/Chart';

describe('Chart', () => {
  it('should set options from constructor', () => {
    const chart = new Chart(null, {a: 123, b: 456});

    expect(chart.options()).toEqual({a: 123, b: 456});
  });
});
