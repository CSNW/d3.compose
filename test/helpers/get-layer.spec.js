import expect from 'expect';
import mockSelection from '../_helpers/mock-selection';
import getLayer from '../../src/helpers/get-layer';

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
