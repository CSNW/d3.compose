const tape = require('tape');
const mockSelection = require('./_helpers/mock-selection');
const d3c = require('../');
const Chart = d3c.Chart;

tape('Chart.extend() creates extension with prototype and static properties', t => {
  t.plan(4);

  const protoProps = {
    a: 1,
    b: function() {}
  };
  const staticProps = {
    c: {d: 4},
    e: function() {}
  };

  const A = Chart.extend(protoProps, staticProps);

  d3c.utils.objectEach(protoProps, (value, key) => {
    t.equal(A.prototype[key], value);
  });
  d3c.utils.objectEach(staticProps, (value, key) => {
    t.equal(A[key], value);
  });
});

tape('Chart.extend() maintains proper prototype chain', t => {
  const A = Chart.extend({
    a: 1
  });
  const B = A.extend({
    b: 2
  });
  const C = B.extend({
    c: 3
  });

  const c = new C(mockSelection());

  t.equal(c.a, 1);
  t.equal(c.b, 2);
  t.equal(c.c, 3);

  t.ok(c instanceof Chart);
  t.ok(c instanceof A);
  t.ok(c instanceof B);
  t.ok(c instanceof C);
  t.end();
});
