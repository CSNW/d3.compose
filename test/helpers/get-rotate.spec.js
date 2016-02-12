import expect from 'expect';
import getRotate from '../../src/helpers/get-rotate';

describe('getRotate', () => {
  it('should create rotation without center (default to 0)', () => {
    expect(getRotate(10)).toEqual('rotate(10)');
    expect(getRotate()).toEqual('rotate(0)');
  });

  it('should create rotation with center (default to 0,0)', () => {
    expect(getRotate(10, {x: 5, y: 6})).toEqual('rotate(10 5,6)');
    expect(getRotate(10, {x: 5})).toEqual('rotate(10 5,0)');
  });
});
