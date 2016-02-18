const expect = require('expect');
const createPrepare = require('../../').helpers.createPrepare;

const createSpy = expect.createSpy;

describe('createPrepare', () => {
  it('should call each step', () => {
    const selection = {};
    const props = {};

    const a = {};
    const b = {};
    const c = {};
    const aFn = createSpy().andCall(() => a);
    const bFn = createSpy().andCall(() => b);
    const cFn = createSpy().andCall(() => c);

    const prepared = createPrepare(aFn, bFn, cFn);
    const result = prepared(selection, props);

    expect(aFn).toHaveBeenCalledWith(selection, props);
    expect(bFn).toHaveBeenCalledWith(selection, a);
    expect(bFn).toHaveBeenCalledWith(selection, b);
    expect(result).toBe(c);
  });
});
