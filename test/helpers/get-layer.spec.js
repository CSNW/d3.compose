const expect = require('expect');
const mockSelection = require('../_helpers/mock-selection');
const getLayer = require('../../').helpers.getLayer;

describe('getLayer', () => {
  it('should get existing layer by id', () => {
    const child = mockSelection();
    const selection = mockSelection({
      children: {
        '[data-layer="abc"]': child
      }
    });
    expect(getLayer(selection, 'abc')).toEqual(child);
  });

  it('should append layer if not present', () => {
    const selection = mockSelection();
    const created = getLayer(selection, 'unknown');

    expect(selection.select('g')).toEqual(created);
    expect(created.attr('data-layer')).toEqual('unknown');
  });
});
