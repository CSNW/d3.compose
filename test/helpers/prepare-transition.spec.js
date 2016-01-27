import expect from 'expect';
import prepareTransition from '../../src/helpers/prepare-transition';

describe('prepareTransition', () => {
  function mockSelection() {
    return {
      transition: function() {
        return {
          call: function(fn) {
            const result = {};
            fn.call({
              duration: function(value) {
                result.duration = value;
              },
              delay: function(value) {
                result.delay = value;
              },
              ease: function(value) {
                result.ease = value;
              }
            });

            return result;
          }
        }
      }
    }
  }

  it('should prepare transition for given selection', () => {
    const result = mockSelection().transition().call(prepareTransition({
      duration: 1000,
      delay: 2000,
      ease: 'in'
    }));

    expect(result.duration).toEqual(1000);
    expect(result.delay).toEqual(2000);
    expect(result.ease).toEqual('in');
  });
});
