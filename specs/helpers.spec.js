/* global describe, it, expect, beforeEach, spyOn, jasmine, setFixtures, d3 */
(function(d3, helpers) {

  describe('helpers', function() {
    describe('property', function() {
      var property = helpers.property;
      var instance;
      beforeEach(function() {
        instance = {name: 'Chart'};
      });

      it('should get and set value', function() {
        instance.message = property('message');

        expect(instance.message()).toBeUndefined();
        instance.message('Hello');
        expect(instance.message()).toEqual('Hello');
      });

      it('should use default values', function() {
        instance.message = property('message', {
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

      it('should expose default_value on property', function() {
        instance.message = property('message', {
          default_value: 'Howdy!'
        });

        expect(instance.message.default_value).toEqual('Howdy!');
        instance.message.default_value = 'Goodbye!';
        expect(instance.message()).toEqual('Goodbye!');
      });

      it('should evaluate get if type is not function', function() {
        instance.message = property('message');

        instance.message(function() { return 'Howdy!'; });
        expect(instance.message()).toEqual('Howdy!');

        instance.message = property('message', {type: 'Function'});
        instance.message(function() { return 'Howdy!'; });
        expect(typeof instance.message()).toEqual('function');
        expect(instance.message()()).toEqual('Howdy!');
      });

      it('should evaluate get with context of object', function() {
        instance.message = property('message');
        instance.message(function() { return 'Howdy from ' + this.name; });
        expect(instance.message()).toEqual('Howdy from Chart');
      });

      it('should store set values on object at prop_key', function() {
        instance.message = property('message', {prop_key: 'properties'});
        instance.message('Howdy!');
        expect(instance.properties.message).toEqual('Howdy!');
      });

      it('should expose is_property and set_from_options on property', function() {
        instance.message = property('message', {set_from_options: false});
        expect(instance.message.is_property).toEqual(true);
        expect(instance.message.set_from_options).toEqual(false);
      });

      describe('get()', function() {
        it('should be used for return value', function() {
          instance.message = property('message', {
            get: function(value) {
              return value + '!';
            }
          });

          instance.message('Howdy');
          expect(instance.message()).toEqual('Howdy!');
        });

        it('should use context of object by default', function() {
          instance.message = property('message', {
            get: function(value) {
              return value + ' from ' + this.name + '!';
            }
          });

          instance.message('Howdy');
          expect(instance.message()).toEqual('Howdy from Chart!');
        });

        it('should use context if set', function() {
          instance.message = property('message', {
            get: function(value) {
              return value + ' from ' + this.name + '!';
            },
            context: {name: 'Context'}
          });

          instance.message('Howdy');
          expect(instance.message()).toEqual('Howdy from Context!');
        });
      });

      describe('set()', function() {
        it('should pass previous to set', function() {
          var args;
          instance.message = property('message', {
            set: function(value, previous) {
              args = [value, previous];
            }
          });

          instance.message('Hello');
          expect(args).toEqual(['Hello', undefined]);
          instance.message('Howdy');
          expect(args).toEqual(['Howdy', 'Hello']);
        });

        it('should override set', function() {
          instance.message = property('message', {
            set: function(value) {
              if (value === 'Hate')
                return {override: 'Love'};
            }
          });

          instance.message('Hello');
          expect(instance.message()).toEqual('Hello');
          instance.message('Hate');
          expect(instance.message()).toEqual('Love');
        });

        it('should use undefined value in override on set', function() {
          instance.message = property('message', {
            set: function(value) {
              if (value == 'Unknown')
                return {override: undefined};
            }
          });

          instance.message('Initial');
          expect(instance.message()).toEqual('Initial');
          instance.message('Unknown');
          expect(instance.message()).toBeUndefined();
        });

        it('should call after() override', function() {
          var before, after;
          function getValue() {
            return instance.message();
          }
          instance.message = property('message', {
            set: function() {
              before = getValue();
              return {
                override: 'Overridden',
                after: function() {
                  after = getValue();
                }
              };
            }
          });

          instance.message('Message');
          expect(before).toEqual('Message');
          expect(after).toEqual('Overridden');
        });

        it('should use context of object by default', function() {
          instance.message = property('message', {
            set: function(value) {
              return {
                override: value + ' from ' + this.name + '!'
              };
            }
          });

          instance.message('Hello');
          expect(instance.message()).toEqual('Hello from Chart!');
        });

        it('should use context if set', function() {
          instance.message = property('message', {
            set: function(value) {
              return {
                override: value + ' from ' + this.name + '!'
              };
            },
            context: {name: 'Context'}
          });

          instance.message('Hello');
          expect(instance.message()).toEqual('Hello from Context!');
        });

        describe('validate', function() {
          beforeEach(function() {
            instance.message = property('message', {
              validate: function(value) {
                return value != 'INVALID';
              }
            });
          });

          it('should throw for invalid value', function() {
            expect(function() { instance.message('INVALID'); }).toThrow();
          });
        });
      });
    });

    describe('dimensions', function() {
      var selection;
      beforeEach(function() {
        setFixtures('<div id="chart"></div>');
        selection = d3.select('#chart')
          .append('svg')
          .attr('style', 'width: 20px; height: 20px');
      });

      function height() {
        return helpers.dimensions(selection).height;
      }
      function width() {
        return helpers.dimensions(selection).width;
      }

      it('should find width/height of selection', function() {
        expect(width()).toEqual(20);
        expect(height()).toEqual(20);

        selection
          .attr('style', '')
          .attr('width', 600)
          .attr('height', 300);
        expect(width()).toEqual(600);
        expect(height()).toEqual(300);

        selection
          .attr('style', 'width: 800px; height: 400px');
        expect(width()).toEqual(800);
        expect(height()).toEqual(400);
      });
    });

    describe('translate', function() {
      it('should create from separate arguments or object', function() {
        expect(helpers.translate(10, 15)).toEqual('translate(10, 15)');
        expect(helpers.translate({x: 12, y: 17})).toEqual('translate(12, 17)');
      });

      it('should default to (0, 0)', function() {
        expect(helpers.translate()).toEqual('translate(0, 0)');
        expect(helpers.translate(10)).toEqual('translate(10, 0)');
        expect(helpers.translate({y: 10})).toEqual('translate(0, 10)');
      });
    });

    describe('rotate', function() {
      it('should create rotation without center (default to 0)', function() {
        expect(helpers.rotate(10)).toEqual('rotate(10)');
        expect(helpers.rotate()).toEqual('rotate(0)');
      });

      it('should create rotation with center (default to 0,0)', function() {
        expect(helpers.rotate(10, {x: 5, y: 6})).toEqual('rotate(10 5,6)');
        expect(helpers.rotate(10, {z: 5, r: 10})).toEqual('rotate(10 0,0)');
      });
    });

    describe('createScale', function() {
      it('should create scale using type, domain, and range', function() {
        var options = {
          type: 'linear',
          range: [0, 500],
          domain: [0, 100]
        };

        var scale = helpers.createScale(options);
        expect(scale.domain()).toEqual([0, 100]);
        expect(scale.range()).toEqual([0, 500]);
      });

      it('should return original if scale is passed in (as function)', function() {
        var scale = function() {};
        expect(helpers.createScale(scale)).toBe(scale);
      });

      it('should use any special passed-in options (e.g. rangeBands) and pass in as arguments array', function() {
        var options = {
          type: 'ordinal',
          domain: ['a', 'b', 'c', 'd', 'e'],
          rangeRoundBands: [[0, 100], 0.1, 0.05]
        };

        var scale = helpers.createScale(options);
        expect(scale.domain()).toEqual(options.domain);
        expect(scale.range()).toEqual([1, 21, 41, 61, 81]);
      });

      it('should allow time scales', function() {
        var options = {
          type: 'time',
          domain: [new Date('1/1/2000 0:00'), new Date('1/1/2000 12:00')],
          range: [0, 100]
        };

        var scale = helpers.createScale(options);
        expect(scale(new Date('1/1/2000 6:00'))).toEqual(50);
        expect(scale.invert(50).getHours()).toEqual(6);
      });

      it('should create centered ordinal scale', function() {
        var options = {
          type: 'ordinal',
          centered: true,
          domain: ['a', 'b', 'c', 'd', 'e'],
          rangeBands: [[0, 100], 0, 0]
        };

        var scale = helpers.createScale(options);
        expect(scale('b')).toEqual(30);
      });

      it('should create adjacent ordinal scale (with series)', function() {
        var options = {
          type: 'ordinal',
          adjacent: true,
          series: 5,
          domain: ['a', 'b', 'c', 'd', 'e'],
          rangeBands: [[0, 100], 0, 0]
        };

        var scale = helpers.createScale(options);
        expect(scale('b', 1)).toEqual(26);
      });

      it('should create adjacent ordinal scale (with data)', function() {
        var options = {
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

        var scale = helpers.createScale(options);
        expect(scale('b', 1)).toEqual(26);
      });

      it('should create adjacent + padding ordinal scale', function() {
        var options = {
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

        var scale = helpers.createScale(options);
        expect(scale('b', 1)).toEqual(28);
        expect(scale('c', 3)).toEqual(56);
      });
    });

    describe('style', function() {
      it('should create style string from object', function() {
        var styles = {
          color: 'blue',
          border: 'solid 1px #ccc',
          'border-radius': '4px',
          'stroke-dasharray': '4,4'
        };
        var expected = 'color: blue; border: solid 1px #ccc; border-radius: 4px; stroke-dasharray: 4,4;';

        expect(helpers.style(styles)).toEqual(expected);
      });
    });

    describe('di', function() {
      var wrapped, spy, instance;
      beforeEach(function() {
        spy = jasmine.createSpy('callback');
        wrapped = helpers.di(spy);

        instance = {};
        instance.x = wrapped;
        helpers.bindAllDi(instance);
      });

      it('should call callback when bound di is called', function() {
        instance.x();
        expect(spy).toHaveBeenCalled();
      });

      it('should pass through d, i, and j to callback', function() {
        instance.x('data', 1, 2);
        var args = spy.calls.mostRecent().args;
        expect(args[1]).toEqual('data');
        expect(args[2]).toEqual(1);
        expect(args[3]).toEqual(2);
      });

      it('should expose isDi property', function() {
        expect(wrapped._is_di).toEqual(true);
      });

      it('should pass in chart instance to bound di', function() {
        instance.x('data', 1, 2);
        var args = spy.calls.mostRecent().args;
        expect(args[0]).toBe(instance);
      });
    });

    describe('getParentData', function() {
      it('should get data from parent', function() {
        var element = {
          parentNode: {
            data: function() {
              return [[1, 2, 3]];
            }
          }
        };
        spyOn(d3, 'select').and.callFake(function(selection) { return selection; });

        expect(helpers.getParentData(element)).toEqual([1, 2, 3]);
      });
    });
  });

})(d3, d3.compose.helpers);
