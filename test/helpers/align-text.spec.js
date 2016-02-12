import expect, {spyOn, restoreSpies} from 'expect';
import mockElement from '../_helpers/mock-element';
import alignText from '../../src/helpers/align-text';

describe('alignText', () => {
  afterEach(restoreSpies);

  it('should determine offset by height', () => {
    spyOn(window, 'getComputedStyle').andReturn({
      'font-size': 0,
      'line-height': 0
    });
    const element = mockElement({
      bbox: {height: 20, width: 100}
    });

    expect(alignText(element)).toEqual(20);
  });

  it('should determine offset by height and css', () => {
    spyOn(window, 'getComputedStyle').andReturn({
      'font-size': '10',
      'line-height': '20'
    });
    const element = mockElement({
      bbox: {height: 20, width: 100}
    });

    expect(alignText(element)).toEqual(15);
  });

  it('should determine offset by height, css, and given line-height', () => {
    spyOn(window, 'getComputedStyle').andReturn({
      'font-size': '10',
      'line-height': '20'
    });
    const element = mockElement({
      bbox: {height: 20, width: 100}
    });

    expect(alignText(element, 50)).toEqual(30);
  });

  it('should estimate line-height for offset calculations', () => {
    spyOn(window, 'getComputedStyle').andReturn({
      'font-size': '10',
      'line-height': 'normal'
    });
    const element = mockElement({
      bbox: {height: 20, width: 100}
    });

    expect(alignText(element)).toEqual(20 - (0.14 * 10) / 2);
  });
});
