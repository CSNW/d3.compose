(function(d3, _, RSVP, data) {

  describe('data', function() {
    describe('Store', function() {
      var store, _loadCsv;
      beforeEach(function() {
        store = new data.Store();

        _loadCsv = spyOn(store, '_loadCsv').and.callFake(function(path) {
          return new RSVP.Promise(function(resolve, reject) {
            resolve([{value: path}]);
          });
        });
      });

      describe('normalize', function() {
        beforeEach(function() {
          store._raw = [
            {year: '2000', b: '14', c: '3.14', d: 'Hello'},
            {year: '2010', b: '24', c: '13.14', d: 'Goodbye'}
          ];
        });

        it('should call normalized for each row', function() {
          store.normalize(function(row, index, rows) {
            return {
              year: new Date(+row.year, 1, 0),
              b: +row.b,
              c: +row.c
            };
          });

          var rows = store.rows();
          expect(rows.length).toEqual(2);
          expect(rows[0].year.getFullYear()).toEqual(2000);
          expect(rows[0].b).toEqual(14);
          expect(rows[0].c).toEqual(3.14);
          expect(rows[0].d).toBeUndefined();
          expect(rows[1].year.getFullYear()).toEqual(2010);
          expect(rows[1].b).toEqual(24);
          expect(rows[1].c).toEqual(13.14);
          expect(rows[1].d).toBeUndefined();
        });
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

        it('should map single x', function() {
          store.denormalize({x: 'a'});

          var rows = store.rows();
          expect(rows.length).toEqual(4);
          expect(rows[0].x).toEqual(1);
          expect(rows[0].a).toBeUndefined();
        });

        it('should map single y', function() {
          store.denormalize({y: 'b'});

          var rows = store.rows();
          expect(rows.length).toEqual(4);
          expect(rows[0].y).toEqual(2);
          expect(rows[0].b).toBeUndefined();
        });

        it('should map single x and y', function() {
          store.denormalize({x: 'a', y: 'b'});

          var rows = store.rows();
          expect(rows.length).toEqual(4);
          expect(rows[0].x).toEqual(1);
          expect(rows[0].y).toEqual(2);
          expect(rows[0].a).toBeUndefined();
          expect(rows[0].b).toBeUndefined();
        });

        it('should map multiple y to single category', function() {
          store.denormalize({
            y: {
              columns: ['b', 'c'],
              category: 'type'
            }
          });

          var rows = store.rows();
          expect(rows.length).toEqual(8);
          expect(rows[0].y).toEqual(2);
          expect(rows[0].type).toEqual('b');
          expect(rows[1].y).toEqual(3);
          expect(rows[1].type).toEqual('c');
          expect(rows[0].b).toBeUndefined();
          expect(rows[0].c).toBeUndefined();
        });

        it('should map values to categories', function() {
          store.denormalize({
            y: {
              columns: ['b', 'c'],
              categories: {
                b: {isB: true},
                c: {isB: false}
              }
            }
          });

          var rows = store.rows();
          expect(rows.length).toEqual(8);
          expect(rows[0].y).toEqual(2);
          expect(rows[1].y).toEqual(3);
          expect(rows[0].isB).toEqual(true);
          expect(rows[1].isB).toEqual(false);
          expect(rows[0].b).toBeUndefined();
          expect(rows[0].c).toBeUndefined();
        });

        it('should map multiple y to multiple categories', function() {
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

          var rows = store.rows();
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
        });
      });

      describe('values', function() {
        it('should get values for everything loaded/loading up to that point', function(done) {
          store.load('a.csv');
          store.load('b.csv');
          store.values(function(rows) {
            expect(rows.length).toEqual(2);
            done();
          });
        });

        it('should not wait for subsequent loads', function(done) {
          store.load('a.csv');
          store.values(function(rows) {
            expect(rows.length).toEqual(1);
          });

          _.defer(function() {
            store.load('b.csv');
            store.values(function(rows) {
              expect(rows.length).toEqual(2);
              done();
            });  
          });
        });
      });

      describe('subscribe', function() {
        it('should notify subscribers on each load', function(done) {
          var spy = jasmine.createSpy();

          store.subscribe(spy);

          RSVP.all([store.load('a.csv'), store.load('b.csv'), store.load('c.csv')]).then(function() {
            expect(spy.calls.count()).toEqual(3);
            done();
          });
        });

        it('should notify initially if not loading (unless options.existing == false)', function(done) {
          var spies = [
            jasmine.createSpy('existing'),
            jasmine.createSpy('not existing')
          ];

          store.load('a.csv').then(function() {
            store.subscribe(spies[0]);
            store.subscribe(spies[1], null, {existing: false});

            store.ready().then(function() {
              expect(spies[0]).toHaveBeenCalled();
              expect(spies[1]).not.toHaveBeenCalled();
              done();
            });
          });
        });
      });

      describe('caching', function() {
        it('should cache loaded values', function(done) {
          store.cache['a.csv'] = [{__filename: 'a.csv'}];

          store.load(['a.csv', 'b.csv']).then(function() {
            expect(_loadCsv.calls.count()).toEqual(1);

            expect(store.rows().length).toEqual(2);
            expect(store.cache['b.csv']).not.toBeUndefined();
            expect(store.cache['b.csv'].length).toEqual(1);
            done();
          });
        });

        it('should not load again if currently loading', function(done) {
          store.load(['a.csv', 'b.csv']);
          store.load('a.csv');
          store.load('b.csv');

          store.ready().then(function() {
            expect(_loadCsv.calls.count()).toEqual(2);
            done();
          });
        });
      });
    });

    describe('Query', function() {

    });
  });

})(d3, _, RSVP, data);
