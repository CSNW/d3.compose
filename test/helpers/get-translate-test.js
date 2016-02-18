const expect = require('expect');
const getTranslate = require('../../').helpers.getTranslate;

describe('getTranslate', () => {
  it('should create from separate arguments or object', () => {
    expect(getTranslate(10, 15)).toEqual('translate(10, 15)');
    expect(getTranslate({x: 12, y: 17})).toEqual('translate(12, 17)');
  });

  it('should default to (0, 0)', () => {
    expect(getTranslate()).toEqual('translate(0, 0)');
    expect(getTranslate(10)).toEqual('translate(10, 0)');
    expect(getTranslate({y: 10})).toEqual('translate(0, 10)');
  });
});
