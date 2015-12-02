import expect from 'expect';
import Base from '../src/Base';
import {property} from '../src/helpers';

describe('Base', function() {
  it('should set properties from options', function() {
    var HasProperties = Base.extend({
      a: property()
    });
    var base = new HasProperties();
    base.options({a: 123, b: 456});

    expect(base.a()).toEqual(123);
    expect(base.options().b).toEqual(456);
  });

  it('should clear existing properties for new options', function() {
    var HasProperties = Base.extend({
      a: property(),
      b: property()
    });
    var base = new HasProperties();
    base.options({a: 123, b: 456});

    expect(base.a()).toEqual(123);
    expect(base.b()).toEqual(456);

    base.options({a: 789});

    expect(base.a()).toEqual(789);
    expect(base.b()).toEqual(undefined);
  });

  it('should store fully-transformed data', function() {
    var A = Base.extend({
      transform: function(data) {
        return data.map(function(value) {
          value += 10;
          return value;
        });
      }
    });
    var B = A.extend({
      transform: function(data) {
        data = A.prototype.transform.call(this, data);
        return data.map(function(value) {
          value += 20;
          return value;
        });
      }
    });

    var base = new B();
    base.draw([1, 2, 3]);

    expect(base.data()).toEqual([31, 32, 33]);
  });

  it('should trigger before:draw and draw events on draw', function() {
    var base = new Base();
    var onBeforeDraw = expect.createSpy();
    var onDraw = expect.createSpy();

    base.on('before:draw', onBeforeDraw);
    base.on('draw', onDraw);
    base.draw([1, 2, 3]);

    expect(onBeforeDraw).toHaveBeenCalledWith([1, 2, 3]);
    expect(onDraw).toHaveBeenCalledWith([1, 2, 3]);
  });
});
