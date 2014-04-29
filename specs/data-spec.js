(function(d3, _, RSVP, data) {

  /**
    Goal:
    // Initialize global data.Store
    d3.data = new data.Store();
    
    // Can register custom types (for cast)
    d3.data.types = {
      'Date': function(date) { return ... },
      'Date.year': function(year) { return ... },
      ...
    }

    // Set overall cast and map
    d3.data.cast({
      // ...
    }).map({
      // ...
    });

    d3.data.load('a.csv', {
      cast: {
        year: 'Date',
        b: 'Number',
        c: 'Number',
        d: 'String'
      },
      map: {
        x: 'year',
        y: {
          columns: ['b', 'c'],
          category: 'type'
        },
        message: 'd'
      }
    }).then(function() {
      
    });

    d3.data.query({
      from: 'a.csv',
      groupBy: 'type',
      filter: {message: 'Howdy'},
    }).series([
      {meta: {type: 'a', ...}, key, name, class, etc},
      // ... map groups to series by meta
    ]).values(function(series) {
      series: [
        {key, name, class, etc., values: [...]},
        {key, name, class, etc., values: [...]}
      ]
    })
  */

  describe('data', function() {
    describe('Store', function() {
      var store, _loadCsv;
      beforeEach(function() {
        store = new data.Store();

        _loadCsv = spyOn(store, '_loadCsv').and.callFake(function(path) {
          return new RSVP.Promise(function(resolve, reject) {
            resolve([{file: path, a: 1.23, b: 4.56}]);
          });
        });
      });

      describe('cast', function() {
        beforeEach(function() {
          store.cache('a.csv').raw = [
            {a: '10', b: '1.23', c: 'false', d: 'Hello', e: 'Jan. 1, 2014', f: '2014'},
            {a: '10', b: '1.23', c: 'false', d: 'Hello', e: 'Jan. 1, 2014', f: '2014'}
          ];
        });

        it('should cast by iterator', function() {
          store.cast(function(row, index, rows) {
            return {
              a: +row.a,
              b: row.b|0,
              c: row.c === 'true',
              d: row.d,
              e: new Date(row.e),
              f: new Date(+row.f, 0, 1)
            };
          });

          var rows = store.cache('a.csv').values;
          expect(rows.length).toEqual(2);
          expect(rows[0].a).toEqual(10);
          expect(rows[1].b).toEqual(1);
          expect(rows[0].c).toEqual(false);
          expect(rows[1].d).toEqual('Hello');
          expect(rows[0].e).toEqual(new Date('Jan. 1, 2014'));
          expect(rows[1].f.getFullYear()).toEqual(2014);
        });

        it('should cast by options', function() {
          store.cast({
            a: 'Number',
            b: 'Number',
            c: 'Boolean',
            d: 'String',
            e: 'Date',
            f: function(value) {
              return new Date(+value, 0, 1);
            }
          });

          var rows = store.cache('a.csv').values;
          expect(rows.length).toEqual(2);
          expect(rows[0].a).toEqual(10);
          expect(rows[1].b).toEqual(1.23);
          expect(rows[0].c).toEqual(false);
          expect(rows[1].d).toEqual('Hello');
          expect(rows[0].e).toEqual(new Date('Jan. 1, 2014'));
          expect(rows[1].f.getFullYear()).toEqual(2014);
        });

        it('should use type extensions', function() {
          store.types['Date.year'] = function(value) {
            return new Date(+value, 0, 1);
          };
          store.cast({
            f: 'Date.year'
          });

          var rows = store.cache('a.csv').values;
          expect(rows[1].f.getFullYear()).toEqual(2014);
        });
      });

      describe('map', function() {
        beforeEach(function() {
          store.cache('a.csv').raw = [
            {a: 1, b: 2, c: 3, d: 4, e: 5},
            {a: 6, b: 7, c: 8, d: 9, e: 10},
            {a: 11, b: 12, c: 13, d: 14, e: 15},
            {a: 16, b: 17, c: 18, d: 19, e: 20}
          ];
        });

        it('should map single x', function() {
          store.map({x: 'a'});

          var rows = store.cache('a.csv').values;
          expect(rows.length).toEqual(4);
          expect(rows[0].x).toEqual(1);
          expect(rows[0].a).toBeUndefined();
        });

        it('should map single y', function() {
          store.map({y: 'b'});

          var rows = store.cache('a.csv').values;
          expect(rows.length).toEqual(4);
          expect(rows[0].y).toEqual(2);
          expect(rows[0].b).toBeUndefined();
        });

        it('should map single x and y', function() {
          store.map({x: 'a', y: 'b'});

          var rows = store.cache('a.csv').values;
          expect(rows.length).toEqual(4);
          expect(rows[0].x).toEqual(1);
          expect(rows[0].y).toEqual(2);
          expect(rows[0].a).toBeUndefined();
          expect(rows[0].b).toBeUndefined();
        });

        it('should map multiple y to single category', function() {
          store.map({
            y: {
              columns: ['b', 'c'],
              category: 'type'
            }
          });

          var rows = store.cache('a.csv').values;
          expect(rows.length).toEqual(8);
          expect(rows[0].y).toEqual(2);
          expect(rows[0].type).toEqual('b');
          expect(rows[1].y).toEqual(3);
          expect(rows[1].type).toEqual('c');
          expect(rows[0].b).toBeUndefined();
          expect(rows[0].c).toBeUndefined();
        });

        it('should map values to categories', function() {
          store.map({
            y: {
              columns: ['b', 'c'],
              categories: {
                b: {isB: true},
                c: {isB: false}
              }
            }
          });

          var rows = store.cache('a.csv').values;
          expect(rows.length).toEqual(8);
          expect(rows[0].y).toEqual(2);
          expect(rows[1].y).toEqual(3);
          expect(rows[0].isB).toEqual(true);
          expect(rows[1].isB).toEqual(false);
          expect(rows[0].b).toBeUndefined();
          expect(rows[0].c).toBeUndefined();
        });

        it('should map multiple y to multiple categories', function() {
          store.map({
            y: {
              columns: ['b', 'c', 'd'],
              categories: {
                b: {category: 'b', categoryId: 1},
                c: {category: 'c', categoryId: 2},
                d: {category: 'd', categoryId: 3}
              }
            }
          });

          var rows = store.cache('a.csv').values;
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
          store.values().then(function(data) {
            expect(data['a.csv']).not.toBeUndefined();
            expect(data['a.csv'].values.length).toEqual(1);
            expect(data['b.csv']).not.toBeUndefined();
            expect(data['b.csv'].values.length).toEqual(1);
            done();
          });
        });

        it('should not wait for subsequent loads', function(done) {
          store.load('a.csv');
          store.values().then(function(data) {
            expect(data['b.csv']).toBeUndefined();
          });

          _.defer(function() {
            store.load('b.csv');
            store.values().then(function(data) {
              expect(data['b.csv']).not.toBeUndefined();
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
      });

      describe('loading', function(done) {
        it('should use cast/map given with load or registered cast/map', function() {
          store.cast({a: 'Number', b: 'Number'}).map({x: 'a', y: 'b'});

          store.load('a.csv');
          store.load('b.csv', {
            cast: {a: 'String', b: 'String'},
            map: {x: 'b', y: 'a'}
          });

          store.values().then(function(data) {
            expect(data['a.csv'].meta.cast).toBeUndefined();
            expect(data['b.csv'].meta.cast).not.toBeUndefined();

            expect(data['a.csv'].values[0].x).toEqual(1.23);
            expect(data['a.csv'].values[0].y).toEqual(4.56);
            expect(data['b.csv'].values[0].x).toEqual('4.56');
            expect(data['b.csv'].values[0].y).toEqual('1.23');
            done();
          });
        });
      });

      describe('caching', function() {
        it('should cache loaded values', function(done) {
          store.cache()['a.csv'] = {meta: {loaded: true}, raw: [], values: []};

          store.load(['a.csv', 'b.csv']).then(function() {
            expect(_loadCsv.calls.count()).toEqual(1);

            expect(store.cache()['b.csv']).not.toBeUndefined();
            expect(store.cache()['b.csv'].raw.length).toEqual(1);
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

    describe('matcher', function() {
      var row, test;
      beforeEach(function() {
        row = {
          a: 10, b: -10, c: 3.14, d: -3.14, e: true, f: false, g: 'testing', h: new Date(2000, 0, 1) 
        };

        jasmine.addMatchers({
          matches: function(util) {
            return {
              compare: function(actual, expected) {
                return {
                  pass: data.matcher(actual, expected || row),
                  message: 'Expected ' + JSON.stringify(actual) + ' to match ' + JSON.stringify(expected || row)
                };
              }
            }
          }
        });
      })

      describe('keys', function() {
        it('simple key comparison', function() {
          expect({a: 10}).matches();
          expect({b: -10}).matches();
          expect({c: 3.14}).matches();
          expect({d: -3.14}).matches();
          expect({e: true}).matches();
          expect({f: false}).matches();
          expect({g: 'testing'}).matches();
          expect({h: new Date(2000, 0, 1)}).matches();
        });

        it('deep key comparison', function() {
          expect({a: {$gt: 5, $and: {$lt: 15, $lte: 10}}}).matches();
          expect({a: {$gt: 5, $gte: 15}}).not.matches();
          expect({$or: {a: {$lt: 15, $gt: 5}}}).matches();
        });
      });

      describe('comparison', function() {
        it('$gt', function() {
          expect({a: {$gt: 5}}).matches();
          expect({a: {$gt: 10}}).not.matches();
          expect({a: {$gt: 15}}).not.matches();
        });
        it('$gte', function() {
          expect({a: {$gte: 5}}).matches();
          expect({a: {$gte: 10}}).matches();
          expect({a: {$gte: 15}}).not.matches();
        });
        it('$lt', function() {
          expect({a: {$lt: 15}}).matches();
          expect({a: {$lt: 10}}).not.matches();
          expect({a: {$lt: 5}}).not.matches();
        });
        it('$lte', function() {
          expect({a: {$lte: 15}}).matches();
          expect({a: {$lte: 10}}).matches();
          expect({a: {$lte: 5}}).not.matches();
        });
        it('$in', function() {
          expect({a: {$in: [9, 10, 11]}}).matches();
          expect({a: {$in: [9, 11]}}).not.matches();
        });
        it('$ne', function() {
          expect({a: {$ne: 11}}).matches();
          expect({a: {$ne: 10}}).not.matches();
        });
        it('$nin', function() {
          expect({a: {$nin: [9, 11]}}).matches();
          expect({a: {$nin: [9, 10, 11]}}).not.matches();
        });
      });

      describe('logical', function() {
        it('$and', function() {
          expect({$and: {a: 10, b: -10}}).matches();
          expect({$and: {a: 10, b: 5}}).not.matches();
        });

        it('$or', function() {
          expect({$or: {a: -10, b: -10}}).matches();
          expect({$or: {a: -10, b: 10}}).not.matches();
        });

        it('$not', function() {
          expect({$not: {a: -10}}).matches();
          expect({$not: {a: 10}}).not.matches();
        });

        it('$nor', function() {
          expect({$nor: {a: -10, b: 10}}).matches();
          expect({$nor: {a: 10, b: -10}}).not.matches();
        });
      });
    });
  });

})(d3, _, RSVP, data);
