const tape = require('tape');
const getRotate = require('../../').helpers.getRotate;

tape('getRotate() creates rotation without center (default to 0)', t => {
  t.equal(getRotate(10), 'rotate(10)');
  t.equal(getRotate(), 'rotate(0)');
  t.end();
});

tape('getRotate() creates rotation with center (default to 0,0)', t => {
  t.equal(getRotate(10, {x: 5, y: 6}), 'rotate(10 5,6)');
  t.equal(getRotate(10, {x: 5}), 'rotate(10 5,0)');
  t.end();
});
