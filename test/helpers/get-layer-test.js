const tape = require('tape');
const mockSelection = require('../_helpers/mock-selection');
const getLayer = require('../../').helpers.getLayer;

tape('getLayer() gets existing layer by id', t => {
  const child = mockSelection();
  const selection = mockSelection({
    children: {
      '[data-layer="abc"]': child
    }
  });
  t.equal(getLayer(selection, 'abc'), child);
  t.end();
});

tape('getLayer() appends layer if not present', t => {
  const selection = mockSelection();
  const created = getLayer(selection, 'unknown');

  t.equal(selection.select('g'), created);
  t.equal(created.attr('data-layer'), 'unknown');
  t.end();
});
