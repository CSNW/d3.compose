import expect from 'expect';
import {isFunction} from '../../src/utils';
import getTranslate from '../../src/helpers/get-translate';
import mockElement from '../_helpers/mock-element';
import stack from '../../src/helpers/stack';

describe('stack', () => {
  var context = {};
  beforeEach(() => {
    const children = [
      mockElement({
        bbox: {width: 100, height: 20}
      }),
      mockElement({
        bbox: {width: 50, height: 50}
      })
    ];
    const attr = {};

    context.elements = {
      attr: function(key, value) {
        if (isFunction(value)) {
          attr[key] = children.map((child, i) => {
            return value.call(child, {}, i, 0);
          });
          return;
        }

        return attr[key];
      }
    }
  });
  afterEach(() => {
    context = {};
  });

  function getTransform(options, elements) {
    stack(options)(elements);
    return elements.attr('transform');
  }

  it('should stack vertically (with origin = top)', () => {
    const transform = getTransform({}, context.elements);

    expect(transform[0]).toEqual(getTranslate(0, 0));
    expect(transform[1]).toEqual(getTranslate(0, 20));
  });

  it('should stack vertically (with origin = bottom)', () => {
    const transform = getTransform({origin: 'bottom'}, context.elements);

    expect(transform[0]).toEqual(getTranslate(0, 20));
    expect(transform[1]).toEqual(getTranslate(0, 70));
  });

  it('should stack horizontally (with origin = left)', () => {
    const transform = getTransform({direction: 'horizontal'}, context.elements);

    expect(transform[0]).toEqual(getTranslate(0, 0));
    expect(transform[1]).toEqual(getTranslate(100, 0));
  });

  it('should stack horizontally (with origin = right)', () => {
    const transform = getTransform({direction: 'horizontal', origin: 'right'}, context.elements);

    expect(transform[0]).toEqual(getTranslate(100, 0));
    expect(transform[1]).toEqual(getTranslate(150, 0));
  });

  it('should use padding', () => {
    const transform = getTransform({padding: 10}, context.elements);

    expect(transform[0]).toEqual(getTranslate(0, 0));
    expect(transform[1]).toEqual(getTranslate(0, 30));
  });

  it('should use minHeight', () => {
    const transform = getTransform({minHeight: 40}, context.elements);

    expect(transform[0]).toEqual(getTranslate(0, 0));
    expect(transform[1]).toEqual(getTranslate(0, 40));
  });

  it('should use minWidth', () => {
    const transform = getTransform({direction: 'horizontal', minWidth: 150}, context.elements);

    expect(transform[0]).toEqual(getTranslate(0, 0));
    expect(transform[1]).toEqual(getTranslate(150, 0));
  });
});
