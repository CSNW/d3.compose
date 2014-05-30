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
    var store, _loadCsv;
    beforeEach(function() {
      store = new data.Store();

      _loadCsv = spyOn(store, '_loadCsv').and.callFake(function(path) {
        return new RSVP.Promise(function(resolve, reject) {
          resolve([{file: path, a: 1.23, b: 4.56}]);
        });
      });
    });

    function addRows(filename, rows) {
      store.cache()[filename] = {
        meta: {loaded: true},
        raw: rows,
        values: rows
      };
    }

    describe('Store', function() {
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

        it('should pass through any columns not listed in map', function() {
          store.map({
            x: 'a',
            y: 'b'
          });

          var rows = store.cache('a.csv').values;
          expect(rows.length).toEqual(4);
          expect(rows[0].a).toBeUndefined();
          expect(rows[0].b).toBeUndefined();
          expect(rows[0].c).toEqual(3);
          expect(rows[1].d).toEqual(9);
          expect(rows[2].e).toEqual(15);
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
        it('should notify subscribers initially and on each load', function(done) {
          var spy = jasmine.createSpy();

          store.subscribe(spy);

          RSVP.all([store.load('a.csv'), store.load('b.csv'), store.load('c.csv')]).then(function() {
            expect(spy.calls.count()).toEqual(4);
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
          addRows('a.csv', []);

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
      beforeEach(function() {
        addRows('a.csv', [
          {x: -5, y: -50, type: 'negative', file: 'a'},
          {x: -4, y: -40, type: 'negative', file: 'a'},
          {x: -3, y: -30, type: 'negative', file: 'a'},
          {x: -2, y: -20, type: 'negative', file: 'a'},
          {x: -1, y: -10, type: 'negative', file: 'a'},
          {x: 0, y: 0, type: 'zero', file: 'a'},
          {x: 1, y: 10, type: 'positive', file: 'a'},
          {x: 2, y: 20, type: 'positive', file: 'a'},
          {x: 3, y: 30, type: 'positive', file: 'a'},
          {x: 4, y: 40, type: 'positive', file: 'a'},
          {x: 5, y: 50, type: 'positive', file: 'a'},
        ]);
        addRows('b.csv', [
          {x: -10, y: -100, type: 'negative', file: 'b'}, 
          {x: 10, y: 100, type: 'positive', file: 'b'}
        ]);
      });

      function query(options) {
        return new data.Query(store, options);
      }

      describe('from', function() {
        it('should download files', function(done) {
          spyOn(store, 'load').and.callThrough();
          query({from: ['a.csv', 'b.csv']}).values().then(function(results) {
            expect(store.load).toHaveBeenCalledWith(['a.csv', 'b.csv']);
            done();
          });
        });

        it('should filter store data by from', function(done) {
          query({from: 'b.csv'}).values().then(function(results) {
            expect(results.length).toEqual(1);
            expect(results[0].values.length).toEqual(2);
            done();
          });
        });
      });

      describe('preprocess', function() {
        it('should call with all rows and use returned rows', function(done) {
          query({
            from: 'b.csv',
            preprocess: function(rows) {
              rows.unshift({x: -20, y: -200, type: 'negative'});
              rows[1].x = -10.1;
              rows[2].y = 101;
              rows.push({x: 20, y: 200, type: 'positive'});

              return rows;
            }
          }).values().then(function(results) {
            expect(results[0].values.length).toEqual(4);
            expect(results[0].values[0].y).toEqual(-200);
            expect(results[0].values[1].x).toEqual(-10.1);
            expect(results[0].values[2].y).toEqual(101);
            done();
          });
        });
      });

      describe('filter', function() {
        it('should filter by matcher', function(done) {
          query({
            from: 'a.csv',
            filter: {x: {$lt: 0}}
          }).values().then(function(results) {
            expect(results[0].values.length).toEqual(5);
            done();
          });
        });

        it('should filter by function or matcher', function(done) {
          query({
            from: 'a.csv',
            filter: function(row) {
              return row.type == 'positive';
            }
          }).values().then(function(results) {
            expect(results[0].values.length).toEqual(5);
            done();
          });
        });
      });

      describe('groupBy', function() {
        it('should group by key', function(done) {
          query({
            from: 'a.csv',
            groupBy: 'type'
          }).values().then(function(results) {
            expect(results.length).toEqual(3);
            expect(results[0].values.length).toEqual(5);
            expect(results[1].values.length).toEqual(1);
            expect(results[2].values.length).toEqual(5);
            done();
          });
        });

        it('should group by keys', function(done) {
          query({
            from: ['a.csv', 'b.csv'],
            groupBy: ['file', 'type']
          }).values().then(function(results) {
            expect(results.length).toEqual(5);

            // a, negative
            // a, zero
            // a, positive
            // b, negative
            // b, positive
            expect(results[0].values.length).toEqual(5);
            expect(results[1].values.length).toEqual(1);
            expect(results[2].values.length).toEqual(5);
            expect(results[3].values.length).toEqual(1);
            expect(results[4].values.length).toEqual(1);
            done();
          });
        });

        it('should group by function', function(done) {
          query({
            from: 'a.csv',
            groupBy: {
              type: function(row) {
                return row.type;
              }
            }
          }).values().then(function(results) {
            expect(results.length).toEqual(3);
            expect(results[0].values.length).toEqual(5);
            expect(results[1].values.length).toEqual(1);
            expect(results[2].values.length).toEqual(5);
            done();
          });
        });

        it('should add group meta to grouped values', function(done) {
          query({
            from: ['a.csv', 'b.csv'],
            groupBy: ['file', 'type']
          }).values().then(function(results) {
            expect(results.length).toEqual(5);

            // a, negative
            // a, zero
            // a, positive
            // b, negative
            // b, positive
            expect(results[0].meta).toEqual({file: 'a', type: 'negative'});
            expect(results[1].meta).toEqual({file: 'a', type: 'zero'});
            expect(results[2].meta).toEqual({file: 'a', type: 'positive'});
            expect(results[3].meta).toEqual({file: 'b', type: 'negative'});
            expect(results[4].meta).toEqual({file: 'b', type: 'positive'});

            done();
          });
        });
      });

      describe('reduce', function() {
        it('should perform reduce iterator', function(done) {
          query({
            from: ['a.csv'],
            filter: {y: {$gte: 0}},
            reduce: {
              iterator: function(memo, row) {
                memo.y += row.y;
                if (!_.contains(memo.types, row.type)) {
                  memo.types.push(row.type);
                }

                return memo;
              },
              memo: {y: 0, types: []}
            }
          }).values().then(function(results) {
            expect(results[0].values[0]).toEqual({y: 150, types: ['zero', 'positive']});

            done();
          });
        });

        it('should reduce with "sum" approach', function(done) {
          query({
            from: ['a.csv'],
            filter: {y: {$gt: 0}},
            reduce: {
              columns: ['y'],
              approach: 'sum'
            }
          }).values().then(function(results) {
            expect(results[0].values[0]).toEqual({y: 150});

            done();
          });
        });

        it('should reduce with "avg" approach', function(done) {
          query({
            from: 'a.csv',
            filter: {y: {$gt: 0}},
            reduce: {
              columns: ['y'],
              approach: 'avg'
            }
          }).values().then(function(results) {
            expect(results[0].values[0]).toEqual({y: 30});

            done();
          });
        });

        it('should reduce byColumn with approach', function(done) {
          query({
            from: 'a.csv',
            filter: {y: {$gt: 0}},
            reduce: {
              byColumn: {
                x: 'sum',
                y: 'avg'
              }
            }
          }).values().then(function(results) {
            expect(results[0].values[0]).toEqual({x: 15, y: 30});

            done();
          });
        });
      });

      describe('postprocess', function() {
        it('should postprocess by given meta and values', function(done) {
          query({
            from: ['a.csv', 'b.csv'],
            groupBy: ['file', 'type'],
            postprocess: function(values, meta) {
              _.each(values, function(value) {
                value.fileAndType = meta.file + '+' + meta.type;
              });
              return values;
            }
          }).values().then(function(results) {
            expect(results.length).toEqual(5);

            // a, negative
            // a, zero
            // a, positive
            // b, negative
            // b, positive
            expect(results[0].values[0].fileAndType).toEqual('a+negative');
            expect(results[1].values[0].fileAndType).toEqual('a+zero');
            expect(results[2].values[0].fileAndType).toEqual('a+positive');
            expect(results[3].values[0].fileAndType).toEqual('b+negative');
            expect(results[4].values[0].fileAndType).toEqual('b+positive');

            done();
          }).catch(function(err) {
            expect(err).toBeUndefined();
            done();
          });
        });

        it('should allow implicit return of values', function(done) {
          query({
            from: ['a.csv', 'b.csv'],
            groupBy: ['file', 'type'],
            postprocess: function(values, meta) {
              _.each(values, function(value) {
                value.fileAndType = meta.file + '+' + meta.type;
              });

              // Values are changed directly without return -> implicit
              // return values;
            }
          }).values().then(function(results) {
            expect(results.length).toEqual(5);

            // a, negative
            // a, zero
            // a, positive
            // b, negative
            // b, positive
            expect(results[0].values[0].fileAndType).toEqual('a+negative');
            expect(results[1].values[0].fileAndType).toEqual('a+zero');
            expect(results[2].values[0].fileAndType).toEqual('a+positive');
            expect(results[3].values[0].fileAndType).toEqual('b+negative');
            expect(results[4].values[0].fileAndType).toEqual('b+positive');

            done();
          }).catch(function(err) {
            expect(err).toBeUndefined();
            done();
          });
        });

        it('should handle promises returned from postprocess', function(done) {
          query({
            from: ['a.csv', 'b.csv'],
            groupBy: ['file', 'type'],
            postprocess: function(values, meta) {
              return new RSVP.Promise(function(resolve, reject) {
                _.each(values, function(value) {
                  value.fileAndType = meta.file + '+' + meta.type;
                });
                resolve(values);
              });
            }
          }).values().then(function(results) {
            expect(results.length).toEqual(5);

            // a, negative
            // a, zero
            // a, positive
            // b, negative
            // b, positive
            expect(results[0].values[0].fileAndType).toEqual('a+negative');
            expect(results[1].values[0].fileAndType).toEqual('a+zero');
            expect(results[2].values[0].fileAndType).toEqual('a+positive');
            expect(results[3].values[0].fileAndType).toEqual('b+negative');
            expect(results[4].values[0].fileAndType).toEqual('b+positive');

            done();
          }).catch(function(err) {
            expect(err).toBeUndefined();
            done();
          });
        });
      });
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
            };
          }
        });
      });

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

    describe('resolve', function() {
      var fixture, resolve;
      beforeEach(function() {
        fixture = {
          a: 1,
          'key.with.periods': 2,
          b: {
            c: 3,
            d: {
              e: 4,
              f: {
                g: 5
              }
            }
          }
        };
        resolve = function(key) {
          return data.resolve(fixture, key);
        };
      });

      it('should resolve simple key', function() {
        expect(resolve('a')).toEqual(1);
        expect(resolve('key.with.periods')).toEqual(2);
        expect(resolve('unknown')).toBeUndefined();
      });

      it('should resolve nested key', function() {
        expect(resolve('b.c')).toEqual(3);
        expect(resolve('b.d.e')).toEqual(4);
        expect(resolve('b.d.f.g')).toEqual(5);
        expect(resolve('b.unknown')).toBeUndefined();
        expect(resolve('b.d.unknown')).toBeUndefined();
        expect(resolve('b.d.f.unknown')).toBeUndefined();
      });
    });
  });

})(d3, _, RSVP, data);
