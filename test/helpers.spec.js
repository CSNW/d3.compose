import expect, {createSpy, spyOn, restoreSpies} from 'expect';
import {
  property,
  dimensions,
  translate,
  rotate,
  createScale,
  style,
  di,
  bindAllDi,
  getParentData
} from '../src/helpers';

describe('helpers', () => {
  var context = {};

  afterEach(() => {
    context = {};
    restoreSpies();
  });

  describe('property', () => {
    beforeEach(() => {
      context.instance = {name: 'Chart'};
    });

    it('should get and set value', () => {
      const instance = context.instance;
      instance.message = property();

      expect(instance.message()).toEqual(undefined);
      instance.message('Hello');
      expect(instance.message()).toEqual('Hello');
    });

    it('should use default values', () => {
      const instance = context.instance;
      instance.message = property({
        default_value: 'Howdy!'
      });

      expect(instance.message()).toEqual('Howdy!');
      instance.message('Hello');
      expect(instance.message()).toEqual('Hello');
      instance.message(null);
      expect(instance.message()).toEqual(null);
      instance.message(undefined);
      expect(instance.message()).toEqual('Howdy!');
    });

    it('should expose default_value on property', () => {
      const instance = context.instance;
      instance.message = property({
        default_value: 'Howdy!'
      });

      expect(instance.message.default_value).toEqual('Howdy!');
      instance.message.default_value = 'Goodbye!';
      expect(instance.message()).toEqual('Goodbye!');
    });

    it('should expose is_property and set_from_options on property', () => {
      const instance = context.instance;
      instance.message = property({set_from_options: false});
      expect(instance.message.is_property).toEqual(true);
      expect(instance.message.set_from_options).toEqual(false);
    });

    describe('get()', () => {
      it('should be used for return value', () => {
        const instance = context.instance;
        instance.message = property({
          get(value) {
            return value + '!';
          }
        });

        instance.message('Howdy');
        expect(instance.message()).toEqual('Howdy!');
      });

      it('should use context of object by default', () => {
        const instance = context.instance;
        instance.message = property({
          get(value) {
            return value + ' from ' + this.name + '!';
          }
        });

        instance.message('Howdy');
        expect(instance.message()).toEqual('Howdy from Chart!');
      });

      it('should use context if set', () => {
        const instance = context.instance;
        instance.message = property({
          get(value) {
            return value + ' from ' + this.name + '!';
          },
          context: {name: 'Context'}
        });

        instance.message('Howdy');
        expect(instance.message()).toEqual('Howdy from Context!');
      });
    });

    describe('set()', () => {
      it('should pass previous to set', () => {
        const instance = context.instance;
        var args;
        instance.message = property({
          set(value, previous) {
            args = [value, previous];
          }
        });

        instance.message('Hello');
        expect(args).toEqual(['Hello', undefined]);
        instance.message('Howdy');
        expect(args).toEqual(['Howdy', 'Hello']);
      });

      it('should override set', () => {
        const instance = context.instance;
        instance.message = property({
          set(value) {
            if (value === 'Hate')
              return {override: 'Love'};
          }
        });

        instance.message('Hello');
        expect(instance.message()).toEqual('Hello');
        instance.message('Hate');
        expect(instance.message()).toEqual('Love');
      });

      it('should use undefined value in override on set', () => {
        const instance = context.instance;
        instance.message = property({
          set(value) {
            if (value == 'Unknown')
              return {override: undefined};
          }
        });

        instance.message('Initial');
        expect(instance.message()).toEqual('Initial');
        instance.message('Unknown');
        expect(instance.message()).toEqual(undefined);
      });

      it('should call after() override', () => {
        const instance = context.instance;
        const getValue = () => instance.message();
        var before, after;

        instance.message = property({
          set: () => {
            before = getValue();
            return {
              override: 'Overridden',
              after: () => {
                after = getValue();
              }
            };
          }
        });

        instance.message('Message');
        expect(before).toEqual('Message');
        expect(after).toEqual('Overridden');
      });

      it('should use context of object by default', () => {
        const instance = context.instance;
        instance.message = property({
          set(value) {
            return {
              override: value + ' from ' + this.name + '!'
            };
          }
        });

        instance.message('Hello');
        expect(instance.message()).toEqual('Hello from Chart!');
      });

      it('should use context if set', () => {
        const instance = context.instance;
        instance.message = property({
          set(value) {
            return {
              override: value + ' from ' + this.name + '!'
            };
          },
          context: {name: 'Context'}
        });

        instance.message('Hello');
        expect(instance.message()).toEqual('Hello from Context!');
      });

      describe('validate', () => {
        beforeEach(() => {
          const instance = context.instance;
          instance.message = property({
            validate(value) {
              return value != 'INVALID';
            }
          });
        });

        it('should throw for invalid value', () => {
          const instance = context.instance;
          expect(() => { instance.message('INVALID'); }).toThrow();
        });
      });
    });
  });

  describe('dimensions', () => {
    beforeEach(() => {
      const selection = d3.select('body').append('svg').attr('id', 'chart');
      const getSize = (clientWidth, clientHeight) => {
        // Mock clientWidth and clientHeight on node
        const node = selection.node();
        selection.node = () => {
          return Object.assign(node, {
            clientWidth,
            clientHeight
          });
        };

        return dimensions(selection);
      };

      Object.assign(context, {
        selection,
        getSize
      });
    });
    afterEach(() => {
      context.selection.remove();
    });

    it('should find width/height of svg', () => {
      // width/height = max(client, attr)

      // 1. No attr (client > attr)
      var size = context.getSize(20, 20);
      expect(size.width).toEqual(20);
      expect(size.height).toEqual(20);

      // 2. attr > client
      context.selection
        .attr('width', 600)
        .attr('height', 300);
      size = context.getSize();
      expect(size.width).toEqual(600);
      expect(size.height).toEqual(300);

      // 3. client > attr
      size = context.getSize(800, 400);
      expect(size.width).toEqual(800);
      expect(size.height).toEqual(400);
    });
  });

  describe('translate', () => {
    it('should create from separate arguments or object', () => {
      expect(translate(10, 15)).toEqual('translate(10, 15)');
      expect(translate({x: 12, y: 17})).toEqual('translate(12, 17)');
    });

    it('should default to (0, 0)', () => {
      expect(translate()).toEqual('translate(0, 0)');
      expect(translate(10)).toEqual('translate(10, 0)');
      expect(translate({y: 10})).toEqual('translate(0, 10)');
    });
  });

  describe('rotate', () => {
    it('should create rotation without center (default to 0)', () => {
      expect(rotate(10)).toEqual('rotate(10)');
      expect(rotate()).toEqual('rotate(0)');
    });

    it('should create rotation with center (default to 0,0)', () => {
      expect(rotate(10, {x: 5, y: 6})).toEqual('rotate(10 5,6)');
      expect(rotate(10, {z: 5, r: 10})).toEqual('rotate(10 0,0)');
    });
  });

  describe('createScale', () => {
    it('should create scale using type, domain, and range', () => {
      const options = {
        type: 'linear',
        range: [0, 500],
        domain: [0, 100]
      };

      const scale = createScale(options);
      expect(scale.domain()).toEqual([0, 100]);
      expect(scale.range()).toEqual([0, 500]);
    });

    it('should return original if scale is passed in (as function)', () => {
      const scale = () => {};
      expect(createScale(scale)).toBe(scale);
    });

    it('should use any special passed-in options (e.g. rangeBands) and pass in as arguments array', () => {
      const options = {
        type: 'ordinal',
        domain: ['a', 'b', 'c', 'd', 'e'],
        rangeRoundBands: [[0, 100], 0.1, 0.05]
      };

      const scale = createScale(options);
      expect(scale.domain()).toEqual(options.domain);
      expect(scale.range()).toEqual([1, 21, 41, 61, 81]);
    });

    it('should allow time scales', () => {
      const options = {
        type: 'time',
        domain: [new Date('1/1/2000 0:00'), new Date('1/1/2000 12:00')],
        range: [0, 100]
      };

      const scale = createScale(options);
      expect(scale(new Date('1/1/2000 6:00'))).toEqual(50);
      expect(scale.invert(50).getHours()).toEqual(6);
    });

    it('should create centered ordinal scale', () => {
      const options = {
        type: 'ordinal',
        centered: true,
        domain: ['a', 'b', 'c', 'd', 'e'],
        rangeBands: [[0, 100], 0, 0]
      };

      const scale = createScale(options);
      expect(scale('b')).toEqual(30);
    });

    it('should create adjacent ordinal scale (with series)', () => {
      const options = {
        type: 'ordinal',
        adjacent: true,
        series: 5,
        domain: ['a', 'b', 'c', 'd', 'e'],
        rangeBands: [[0, 100], 0, 0]
      };

      const scale = createScale(options);
      expect(scale('b', 1)).toEqual(26);
    });

    it('should create adjacent ordinal scale (with data)', () => {
      const options = {
        type: 'ordinal',
        adjacent: true,
        data: [
          {values: [{x: 'a'}, {x: 'b'}, {x: 'c'}, {x: 'd'}, {x: 'e'}]},
          {values: [{x: 'a'}, {x: 'b'}, {x: 'c'}, {x: 'd'}, {x: 'e'}]},
          {values: [{x: 'a'}, {x: 'b'}, {x: 'c'}, {x: 'd'}, {x: 'e'}]},
          {values: [{x: 'a'}, {x: 'b'}, {x: 'c'}, {x: 'd'}, {x: 'e'}]},
          {values: [{x: 'a'}, {x: 'b'}, {x: 'c'}, {x: 'd'}, {x: 'e'}]}
        ],
        key: 'x',
        rangeBands: [[0, 100], 0, 0]
      };

      // b -> 20-40: 22, 26, 30, 34, 48

      const scale = createScale(options);
      expect(scale('b', 1)).toEqual(26);
    });

    it('should create adjacent + padding ordinal scale', () => {
      const options = {
        type: 'ordinal',
        adjacent: true,
        series: 4,
        domain: ['a', 'b', 'c', 'd', 'e'],
        padding: 0.2,
        range: [0, 100]
      };

      // 20 * (1 - 0.2) = 16 / 4 = 4
      // b -> 22-38: 24, 28, 32, 36
      // c -> 42-58: 44, 48, 52, 56

      const scale = createScale(options);
      expect(scale('b', 1)).toEqual(28);
      expect(scale('c', 3)).toEqual(56);
    });
  });

  describe('style', () => {
    it('should create style string from object', function() {
      const styles = {
        color: 'blue',
        border: 'solid 1px #ccc',
        'border-radius': '4px',
        'stroke-dasharray': '4,4'
      };
      const expected = 'color: blue; border: solid 1px #ccc; border-radius: 4px; stroke-dasharray: 4,4;';

      expect(style(styles)).toEqual(expected);
    });
  });

  describe('di', () => {
    beforeEach(function() {
      const spy = createSpy();
      const wrapped = di(spy);

      const instance = {
        x: wrapped
      };
      bindAllDi(instance);

      Object.assign(context, {
        spy,
        wrapped,
        instance
      });
    });

    it('should call callback when bound di is called', function() {
      context.instance.x();
      expect(context.spy).toHaveBeenCalled();
    });

    it('should pass through d, i, and j to callback', function() {
      context.instance.x('data', 1, 2);
      const args = context.spy.calls[0].arguments;
      expect(args.slice(1)).toEqual(['data', 1, 2]);
    });

    it('should expose isDi property', function() {
      expect(context.wrapped._is_di).toEqual(true);
    });

    it('should pass in chart instance to bound di', function() {
      context.instance.x('data', 1, 2);
      const args = context.spy.calls[0].arguments;
      expect(args[0]).toBe(context.instance);
    });
  });

  describe('getParentData', () => {
    it('should get data from parent', function() {
      const element = {
        parentNode: {
          data() {
            return [[1, 2, 3]];
          }
        }
      };
      spyOn(d3, 'select').andCall(selection => selection);

      expect(getParentData(element)).toEqual([1, 2, 3]);
    });
  });
});
