(function(d3, _, data) {

  describe('data', function() {
    describe('Store', function() {
      var store;
      beforeEach(function() {
        store = new data.Store();
      });

      describe('denormalize', function() {
        beforeEach(function() {
          store._raw = [
            {a: 1, b: 2, c: 3, d: 4, e: 5},
            {a: 6, b: 7, c: 8, d: 9, e: 10},
            {a: 11, b: 12, c: 13, d: 14, e: 15},
            {a: 16, b: 17, c: 18, d: 19, e: 20}
          ];
        });

        it('should map single x', function(done) {
          store.denormalize({x: 'a'});
          store.values(function(rows) {
            expect(rows.length).toEqual(4);
            expect(rows[0].x).toEqual(1);
            expect(rows[0].a).toBeUndefined();
            done();
          });
        });

        it('should map single y', function(done) {
          store.denormalize({y: 'b'});
          store.values(function(rows) {
            expect(rows.length).toEqual(4);
            expect(rows[0].y).toEqual(2);
            expect(rows[0].b).toBeUndefined();
            done();
          });
        });

        it('should map single x and y', function(done) {
          store.denormalize({x: 'a', y: 'b'});
          store.values(function(rows) {
            expect(rows.length).toEqual(4);
            expect(rows[0].x).toEqual(1);
            expect(rows[0].y).toEqual(2);
            expect(rows[0].a).toBeUndefined();
            expect(rows[0].b).toBeUndefined();
            done();
          });
        });

        it('should map multiple y to single category', function(done) {
          store.denormalize({
            y: {
              columns: ['b', 'c'],
              category: 'type'
            }
          });
          store.values(function(rows) {
            expect(rows.length).toEqual(8);
            expect(rows[0].y).toEqual(2);
            expect(rows[0].type).toEqual('b');
            expect(rows[1].y).toEqual(3);
            expect(rows[1].type).toEqual('c');
            expect(rows[0].b).toBeUndefined();
            expect(rows[0].c).toBeUndefined();
            done();
          });
        });

        it('should map values to categories', function(done) {
          store.denormalize({
            y: {
              columns: ['b', 'c'],
              categories: {
                b: {isB: true},
                c: {isB: false}
              }
            }
          });
          store.values(function(rows) {
            expect(rows.length).toEqual(8);
            expect(rows[0].y).toEqual(2);
            expect(rows[1].y).toEqual(3);
            expect(rows[0].isB).toEqual(true);
            expect(rows[1].isB).toEqual(false);
            expect(rows[0].b).toBeUndefined();
            expect(rows[0].c).toBeUndefined();
            done();
          });
        });

        it('should map multiple y to multiple categories', function(done) {
          store.denormalize({
            y: {
              columns: ['b', 'c', 'd'],
              categories: {
                b: {category: 'b', categoryId: 1},
                c: {category: 'c', categoryId: 2},
                d: {category: 'd', categoryId: 3}
              }
            }
          });
          store.values(function(rows) {
            expect(rows.length).toEqual(12);
            expect(rows[0].y).toEqual(2);
            expect(rows[1].y).toEqual(3);
            expect(rows[2].y).toEqual(4);
            expect(rows[0].category).toEqual('b');
            expect(rows[1].category).toEqual('c');
            expect(rows[2].category).toEqual('d');
            expect(rows[0].categoryId).toEqual(1);
            expect(rows[1].categoryId).toEqual(2);
            expect(rows[2].categoryId).toEqual(3);
            expect(rows[0].b).toBeUndefined();
            expect(rows[0].c).toBeUndefined();
            expect(rows[0].d).toBeUndefined();
            done();
          });
        });
      });

      describe('values', function() {
        beforeEach(function() {
          spyOn(store, 'load').and.callFake(function(csv, rows) {
            this._load(csv, function(csv, callback) {
              _.defer(function() {
                callback(null, rows)
              });
            });

            return this;
          });
        })

        it('should get values for everything loaded/loading up to that point', function(done) {
          store
            .load('a.csv', [{a: 1}])
            .load('b.csv', [{a: 2}])
            .values(function(rows) {
              expect(rows.length).toEqual(2);
              done();
            });
        });

        it('should not wait for subsequent loads', function() {
          store
            .load('a.csv', [{a: 1}])
            .values(function(rows) {
              expect(rows.length).toEqual(1);
            })
            .load('b.csv', [{a: 2}])
            .values(function(rows) {
              expect(rows.length).toEqual(2);
              done();
            });
        });
      });

      describe('subscribe', function() {
        it('should notify subscribers on each load', function() {

        })
      });
    });

    describe('Query', function() {

    });

    describe('Subscription', function() {
      var Target = function() {};
      _.extend(Target.prototype, data.Events);

      var target, subscription, callback, context;

      beforeEach(function() {
        target = new Target();
        callback = jasmine.createSpy('callback');
        context = {message: 'Howdy!'};

        subscription = new data.Subscription(target, ['a', 'b'], callback, context);
      });

      it('should listen to events on target', function() {
        target.trigger('a', 1);
        target.trigger('b', 2);
        target.trigger('not listening', 3);
        expect(callback.calls.count()).toEqual(2);
      });

      it('should pass values from event', function() {
        target.trigger('a', 1, 2, 3);
        expect(callback.calls.argsFor(0)).toEqual([1, 2, 3]);
      });

      it('should callback with context', function() {
        target.trigger('a', 1);
        expect(callback.calls.mostRecent()).toEqual({'object': context, args: [1]});
      });

      it('should dispose of listeners', function() {
        subscription.dispose();

        target.trigger('a', 1);
        target.trigger('b', 2);
        expect(callback).not.toHaveBeenCalled();
      });

      it('should trigger subscription directly', function() {
        subscription.trigger(1, 2, 3);

        expect(callback.calls.mostRecent()).toEqual({'object': context, args: [1, 2, 3]});
      });
    });

    describe('EventedStack', function() {
      var stack, Element;
      beforeEach(function() {
        stack = new data.EventedStack();

        Element = function() {};
        _.extend(Element.prototype, data.Events);
      });

      it('should add items to stack', function() {
        stack.add(new Element());
        stack.add(new Element());

        expect(stack.items().length).toEqual(2);
        expect(stack.count()).toEqual(2);
      })

      it('should trigger all() once all items that were in stack trigger', function() {
        var a = new Element();
        var b = new Element();
        var c = new Element();
        var d = new Element();

        stack.add(a);
        stack.add(b);

        var spy = jasmine.createSpy();
        stack.all('done', spy);

        // c and d added after all() and aren't listened to
        stack.add(c);
        stack.add(d);

        c.trigger('done');
        expect(spy).not.toHaveBeenCalled();

        b.trigger('done');
        expect(spy).not.toHaveBeenCalled();

        a.trigger('done');
        expect(spy).toHaveBeenCalled();
      });

      it('should pass responses (in order of stack) to all()', function() {
        var a = new Element();
        var b = new Element();

        stack.add(a);
        stack.add(b);

        var spy = jasmine.createSpy();
        stack.all('done', spy);

        b.trigger('done', 'b', 4, 5, 6);
        a.trigger('done', 'a', 1, 2, 3);

        expect(spy.calls.argsFor(0)[0]).toEqual([['a', 1, 2, 3], ['b', 4, 5, 6]]);
      });

      it('should automatically remove elements on event', function() {
        var a = new Element();
        var b = new Element();

        stack.add(a);
        stack.add(b);

        stack.removeOn('done');

        b.trigger('done');

        expect(stack.items()).toEqual([a]);

        a.trigger('done');

        expect(stack.items().length).toEqual(0);
      });

      it('should bubble events from elements', function() {
        var a = new Element();
        var b = new Element();

        stack.add(a);
        stack.add(b);

        var spy = jasmine.createSpy();
        stack.on('message', spy);

        a.trigger('message', 'Howdy!');
        b.trigger('message', 'Goodbye');

        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(0)).toEqual(['Howdy!']);
        expect(spy.calls.argsFor(1)).toEqual(['Goodbye']);
      })
    });
  });

})(d3, _, data);
