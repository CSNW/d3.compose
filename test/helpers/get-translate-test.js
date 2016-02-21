const tape = require('tape');
const getTranslate = require('../../').helpers.getTranslate;

tape('getTranslate() creates from separate arguments or object', t => {
  t.equal(getTranslate(10, 15), 'translate(10, 15)');
  t.equal(getTranslate({x: 12, y: 17}), 'translate(12, 17)');
  t.end();
});

tape('getTranslate() defaults to (0, 0)', t => {
  t.equal(getTranslate(), 'translate(0, 0)');
  t.equal(getTranslate(10), 'translate(10, 0)');
  t.equal(getTranslate({y: 10}), 'translate(0, 10)');
  t.end();
});
