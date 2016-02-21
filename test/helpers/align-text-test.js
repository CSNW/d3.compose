const tape = require('tape');
const mockElement = require('../_helpers/mock-element');
const alignText = require('../../').helpers.alignText;

tape('alignText() determines offset by y', t => {
  const element = mockElement({
    bbox: {x: 0, y: -17, height: 20, width: 100}
  });

  t.equal(alignText(element), 17);
  t.end();
});

tape('alighText() determines offset by y and given line-height', t => {
  const element = mockElement({
    bbox: {x: 0, y: -17, height: 20, width: 100}
  });

  t.equal(alignText(element, 50), 17 + (50 - 20)/2);
  t.end();
});
