import expect from 'expect';
import {objectEach} from '../src/utils';
import {Chart} from '../src/Chart';

describe('Chart', () => {
  describe('extend', () => {
    it('should create extension with prototype and static properties', () => {
      const protoProps = {
        a: 1,
        b: function() {}
      };
      const staticProps = {
        c: {d: 4},
        e: function() {}
      };

      const A = Chart.extend(protoProps, staticProps);

      objectEach(protoProps, (value, key) => {
        expect(A.prototype[key]).toBe(value);
      });
      objectEach(staticProps, (value, key) => {
        expect(A[key]).toBe(value);
      });
    });

    it('should maintain proper prototype chain', () => {
      const A = Chart.extend({
        a: 1
      });
      const B = A.extend({
        b: 2
      });
      const C = B.extend({
        c: 3
      });

      const c = new C();

      expect(c.a).toEqual(1);
      expect(c.b).toEqual(2);
      expect(c.c).toEqual(3);

      expect(c instanceof Chart).toEqual(true);
      expect(c instanceof A).toEqual(true);
      expect(c instanceof B).toEqual(true);
      expect(c instanceof C).toEqual(true);
    });
  });
});
