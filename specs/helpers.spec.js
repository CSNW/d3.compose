(function(d3, _, helpers) {

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
          defaultValue: 'Howdy!'
        });

        expect(instance.message()).toEqual('Howdy!');
        instance.message('Hello');
        expect(instance.message()).toEqual('Hello');
        instance.message(null);
        expect(instance.message()).toEqual(null);
        instance.message(undefined);
        expect(instance.message()).toEqual('Howdy!');
      });

      it('should expose defaultValue on property', function() {
        instance.message = property('message', {
          defaultValue: 'Howdy!'
        });

        expect(instance.message.defaultValue).toEqual('Howdy!');
        instance.message.defaultValue = 'Goodbye!';
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

      it('should store set values on object at propKey', function() {
        instance.message = property('message', {propKey: 'properties'});
        instance.message('Howdy!');
        expect(instance.properties.message).toEqual('Howdy!');
      });

      it('should expose isProperty and setFromOptions on property', function() {
        instance.message = property('message', {setFromOptions: false});
        expect(instance.message.isProperty).toEqual(true);
        expect(instance.message.setFromOptions).toEqual(false);
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
            set: function(value, previous) {
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
            set: function(value, previous) {
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
            set: function(value, previous) {
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
            set: function(value, previous) {
              return {
                override: value + ' from ' + this.name + '!'
              };
            },
            context: {name: 'Context'}
          });

          instance.message('Hello');
          expect(instance.message()).toEqual('Hello from Context!');
        });

        it('should trigger change (if changed)', function() {
          instance.message = property('message', {
            defaultValue: 'Hello'
          });
          instance.trigger = jasmine.createSpy();

          instance.message('Hello');
          expect(instance.trigger.calls.count()).toEqual(2);
          expect(instance.trigger.calls.argsFor(0)).toEqual(['change:message', 'Hello']);
          expect(instance.trigger.calls.argsFor(1)).toEqual(['change', 'message', 'Hello']);

          instance.message('Howdy');
          expect(instance.trigger.calls.count()).toEqual(4);
          expect(instance.trigger.calls.argsFor(2)).toEqual(['change:message', 'Howdy']);
          expect(instance.trigger.calls.argsFor(3)).toEqual(['change', 'message', 'Howdy']);

          instance.message('Howdy');
          expect(instance.trigger.calls.count()).toEqual(4);

          instance.message({key: 'value', complex: [1,2,3]});
          instance.message({key: 'value', complex: [1,2,3]});
          expect(instance.trigger.calls.count()).toEqual(6);
        });

        it('should not trigger change if silent', function() {
          instance.message = property('message', {
            defaultValue: 'Hello'
          });
          instance.trigger = jasmine.createSpy();

          instance.message('Hello', {silent: true});
          expect(instance.trigger.calls.count()).toEqual(0);

          instance.message('Howdy', {silent: true});
          expect(instance.trigger.calls.count()).toEqual(0);

          instance.message('Howdy', {silent: true});
          expect(instance.trigger.calls.count()).toEqual(0);

          instance.message({key: 'value', complex: [1,2,3]}, {silent: true});
          instance.message({key: 'value', complex: [1,2,3]}, {silent: true});
          expect(instance.trigger.calls.count()).toEqual(0);
        });

        it('should use changed from set response', function() {
          instance.message = property('message', {
            set: function() {
              return {
                changed: true
              };
            }
          });
          instance.trigger = jasmine.createSpy();

          instance.message('Matches', {silent: true});
          expect(instance.trigger.calls.count()).toEqual(0);

          instance.message('Matches');
          expect(instance.trigger.calls.count()).toEqual(2);
        });

        describe('validate', function() {
          var spy;
          beforeEach(function() {
            spy = jasmine.createSpy('set');
            instance.message = property('message', {
              validate: function(value) {
                return value != 'INVALID';
              },
              set: spy,
              defaultValue: 'Default'
            });
          });

          it('should reset to previous value when invalid and not call set', function() {
            instance.message('Valid');
            expect(spy.calls.argsFor(0)).toEqual(['Valid', undefined, {}]);

            instance.message('INVALID');
            expect(instance.message()).toEqual('Valid');
            expect(spy.calls.count()).toEqual(1);
          });

          it('should reset to default value if no previous value when invalid', function() {
            instance.message('INVALID');
            expect(spy.calls.argsFor(0)).toEqual(['Default', undefined, {}]);
            expect(instance.message()).toEqual('Default');
          });

          it('should trigger invalid event', function() {
            instance.trigger = jasmine.createSpy();
            instance.message('INVALID');

            expect(instance.trigger).toHaveBeenCalled();
            expect(instance.trigger).toHaveBeenCalledWith('invalid:message', 'INVALID');
          });
        });
      });

      describe('extensions', function() {
        beforeEach(function() {
          instance.obj = property('obj');
          instance.arr = property('arr');

          instance.obj({a: 1, b: 2});
          instance.arr([1, 2, 3]);

          instance.trigger = jasmine.createSpy();
        });

        it('should extend', function() {
          property.extend(instance, 'obj', {b: 'two', c: 'three'});
          expect(instance.obj()).toEqual({a: 1, b: 'two', c: 'three'});
          expect(instance.trigger).toHaveBeenCalled();
        });

        it('should push', function() {
          property.push(instance, 'arr', 4);
          var result = property.push(instance, 'arr', 5);
          expect(instance.arr()).toEqual([1, 2, 3, 4, 5]);
          expect(result).toEqual(5);
          expect(instance.trigger.calls.count()).toEqual(4);
        });

        it('should concat', function() {
          property.concat(instance, 'arr', [4, 5]);
          expect(instance.arr()).toEqual([1, 2, 3, 4, 5]);
          expect(instance.trigger).toHaveBeenCalled();
        });

        it('should splice', function() {
          var result = property.splice(instance, 'arr', 1, 1, 4);
          expect(instance.arr()).toEqual([1, 4, 3]);
          expect(result).toEqual([2]);
          expect(instance.trigger).toHaveBeenCalled();
        });

        it('should pop', function() {
          var result = property.pop(instance, 'arr');
          expect(instance.arr()).toEqual([1, 2]);
          expect(result).toEqual(3);
          expect(instance.trigger).toHaveBeenCalled();
        });

        it('should shift', function() {
          var result = property.shift(instance, 'arr');
          expect(instance.arr()).toEqual([2, 3]);
          expect(result).toEqual(1);
          expect(instance.trigger).toHaveBeenCalled();
        });

        it('should unshift', function() {
          var result = property.unshift(instance, 'arr', 0);
          expect(instance.arr()).toEqual([0, 1, 2, 3]);
          expect(result).toEqual(4);
          expect(instance.trigger).toHaveBeenCalled();
        });

        it('should reverse', function() {
          property.reverse(instance, 'arr');
          expect(instance.arr()).toEqual([3, 2, 1]);
          expect(instance.trigger).toHaveBeenCalled();
        });

        it('should sort', function() {
          instance.arr(['b', 'd', 'c', 'a']);
          property.sort(instance, 'arr');
          expect(instance.arr()).toEqual(['a', 'b', 'c', 'd']);
          expect(instance.trigger.calls.count()).toEqual(4);
        });
      });
    });

    describe('dimensions', function() {
      var fixture, selection, dimensions;
      beforeEach(function() {
        fixture = setFixtures('<div id="chart"></div>');
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

        selection.append('rect').attr('width', 50).attr('height', 100);
        expect(width()).toEqual(50);
        expect(height()).toEqual(100);

        selection.attr('width', 600).attr('height', 300);
        expect(width()).toEqual(600);
        expect(height()).toEqual(300);

        selection.attr('style', 'width: 800px; height: 400px');
        expect(width()).toEqual(800);
        expect(height()).toEqual(400);
      });
    });

    describe('transform', function() {
      describe('translate', function() {
        it('should create from separate arguments or object', function() {
          expect(helpers.transform.translate(10, 15)).toEqual('translate(10, 15)');
          expect(helpers.transform.translate({x: 12, y: 17})).toEqual('translate(12, 17)');
        });

        it('should default to (0, 0)', function() {
          expect(helpers.transform.translate()).toEqual('translate(0, 0)');
          expect(helpers.transform.translate(10)).toEqual('translate(10, 0)');
          expect(helpers.transform.translate({y: 10})).toEqual('translate(0, 10)');
        });
      });

      describe('rotate', function() {
        it('should create rotation without center (default to 0)', function() {
          expect(helpers.transform.rotate(10)).toEqual('rotate(10)');
          expect(helpers.transform.rotate()).toEqual('rotate(0)');
        });

        it('should create rotation with center (default to 0,0)', function() {
          expect(helpers.transform.rotate(10, {x: 5, y: 6})).toEqual('rotate(10 5,6)');
          expect(helpers.transform.rotate(10, {z: 5, r: 10})).toEqual('rotate(10 0,0)');
        });
      });
    });

    describe('createScaleFromOptions', function() {
      it('should create scale using type, domain, and range', function() {
        var options = {
          type: 'linear',
          range: [0, 500],
          domain: [0, 100]
        };

        var scale = helpers.createScaleFromOptions(options);
        expect(scale.domain()).toEqual([0, 100]);
        expect(scale.range()).toEqual([0, 500]);
      });

      it('should return original if scale is passed in (as function)', function() {
        var scale = function() {};
        expect(helpers.createScaleFromOptions(scale)).toBe(scale);
      });

      it('should use any special passed-in options (e.g. rangeBands) and pass in as arguments array', function() {
        var options = {
          type: 'ordinal',
          domain: ['a', 'b', 'c', 'd', 'e'],
          rangeRoundBands: [[0, 100], 0.1, 0.05]
        };

        var scale = helpers.createScaleFromOptions(options);
        expect(scale.domain()).toEqual(options.domain);
        expect(scale.range()).toEqual([1, 21, 41, 61, 81]);
      });

      it('should allow time scales', function() {
        var options = {
          type: 'time',
          domain: [new Date('1/1/2000 0:00'), new Date('1/1/2000 12:00')],
          range: [0, 100]
        };

        var scale = helpers.createScaleFromOptions(options);
        expect(scale(new Date('1/1/2000 6:00'))).toEqual(50);
        expect(scale.invert(50).getHours()).toEqual(6);
      });
    });

    describe('stack', function() {

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

    describe('getValue', function() {
      it('should get search for keys in objects, finding first key in first object', function() {
        var obj1 = {a: 'b', c: 'd'};
        var obj2 = {c: 4, e: 6, g: null};

        expect(helpers.getValue(['a', 'b'], obj1, obj2)).toEqual('b');
        expect(helpers.getValue(['b', 'c'], obj1, obj2)).toEqual('d');
        expect(helpers.getValue(['e', 'f'], obj1, obj2)).toEqual(6);
        expect(helpers.getValue('g', obj2)).toEqual(null);
        expect(helpers.getValue(['y', 'z'], obj1, obj2)).toEqual(undefined);
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
        expect(wrapped._isDi).toEqual(true);
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
              return [[1,2,3]];
            }
          }
        };
        spyOn(d3, 'select').and.callFake(function(element) { return element; });

        expect(helpers.getParentData(element)).toEqual([1,2,3]);
      });
    });

    describe('resolveChart', function() {
      d3.chart('TEST-AxisSpecial', {});
      
      // chart type - type - component
      // 1. Values - Line - Chart -> LineValues
      // 2. XY - Line - Chart -> Line
      // 3. XY - Special - Axis -> AxisSpecial
      // 4. Values - Inset - Legend -> InsetLegend
      // 5. Values - Unknown - Axis -> AxisValues

      it('should find by type + chart type first', function() {
        expect(helpers.resolveChart('Line', 'Chart', 'Values')).toBe(d3.chart('LineValues'));
      });

      it('should then find by type', function() {
        expect(helpers.resolveChart('Line', 'Chart', 'XY')).toBe(d3.chart('Line'));
      });

      it('should then find by type + component', function() {
        expect(helpers.resolveChart('Special', 'TEST-Axis', 'XY')).toBe(d3.chart('TEST-AxisSpecial'));
      });

      it('should then find by component + type', function() {
        expect(helpers.resolveChart('Inset', 'Legend', 'Values')).toBe(d3.chart('InsetLegend'));
      });

      it('should then find by chart type + component', function() {
        expect(helpers.resolveChart('Unknown', 'Axis', 'Values')).toBe(d3.chart('AxisValues'));
      });

      it('should throw if not chart is found', function() {
        expect(helpers.resolveChart).toThrow();
      });
    });
  });

})(d3, _, d3.chart.helpers);
