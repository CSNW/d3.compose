import expect from 'expect';
import Base from '../src/Base';
import {property} from '../src/helpers';

describe('Base', () => {
  it('should set properties from options', () => {
    const HasProperties = Base.extend({
      a: property()
    });
    const base = new HasProperties();
    base.options({a: 123, b: 456});

    expect(base.a()).toEqual(123);
    expect(base.options().b).toEqual(456);
  });

  it('should clear existing properties for new options', () => {
    const HasProperties = Base.extend({
      a: property(),
      b: property()
    });
    const base = new HasProperties();
    base.options({a: 123, b: 456});

    expect(base.a()).toEqual(123);
    expect(base.b()).toEqual(456);

    base.options({a: 789});

    expect(base.a()).toEqual(789);
    expect(base.b()).toEqual(undefined);
  });

  it('should store fully-transformed data', () => {
    const A = Base.extend({
      transform: function(data) {
        return data.map(function(value) {
          value += 10;
          return value;
        });
      }
    });
    const B = A.extend({
      transform: function(data) {
        data = A.prototype.transform.call(this, data);
        return data.map(function(value) {
          value += 20;
          return value;
        });
      }
    });

    const base = new B();
    base.draw([1, 2, 3]);

    expect(base.data()).toEqual([31, 32, 33]);
  });

  it('should trigger before:draw and draw events on draw', () => {
    const base = new Base();
    const onBeforeDraw = expect.createSpy();
    const onDraw = expect.createSpy();

    base.on('before:draw', onBeforeDraw);
    base.on('draw', onDraw);
    base.draw([1, 2, 3]);

    expect(onBeforeDraw).toHaveBeenCalledWith([1, 2, 3]);
    expect(onDraw).toHaveBeenCalledWith([1, 2, 3]);
  });
});
