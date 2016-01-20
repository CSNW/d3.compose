import expect, {createSpy} from 'expect';
import {
  _assign,
  curry,
  defaults,
  objectEach
} from '../src/utils';

describe('utils', () => {
  describe('assign', () => {
    it('should assign own properties to target object', () => {
      const target = {};
      const a = {a: 1};

      const B = function() {
        this.b = 2;
      };
      B.prototype.c = 3;
      const b = new B();

      // Test internal assign since Object.assign is used if present
      expect(_assign(target, [a, b])).toEqual({a: 1, b: 2});
    });
  });

  describe('curry', () => {
    it('should prepend arguments to function while maintaining context', () => {
      const original = createSpy();
      const curried = curry(original, 3, 2);
      const context = {};

      curried.call(context, 1);

      expect(original).toHaveBeenCalledWith(3, 2, 1);
      expect(original.calls[0].context).toBe(context);
    });
  });

  describe('defaults', () => {
    it('should assign own + undefined properties to target object', () => {
      const target = {
        a: undefined,
        b: null,
        c: false
      };
      const a = {a: 1};
      const b = {b: 2, c: 3};

      expect(defaults(target, a, b)).toEqual({a: 1, b: null, c: false});
    });
  });

  describe('objectEach', () => {
    it('should loop through value, key for object', () => {
      const args = [];
      const obj = {
        a: 1,
        b: 3.14,
        c: true
      };

      objectEach(obj, (value, key, ref) => args.push([value, key, ref]));

      expect(args[0]).toEqual([1, 'a', obj]);
      expect(args[1]).toEqual([3.14, 'b', obj]);
      expect(args[2]).toEqual([true, 'c', obj]);
    });
  });
});
