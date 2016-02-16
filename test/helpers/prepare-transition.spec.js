const expect = require('expect');
const mockSelection = require('../_helpers/mock-selection');
const prepareTransition = require('../..').helpers.prepareTransition;

describe('prepareTransition', () => {
  function addMockTransition(selection) {
    selection.transition = function() {
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
      };
    }

    return selection;
  }

  it('should prepare transition for given selection', () => {
    const selection = addMockTransition(mockSelection());
    const result = selection.transition().call(prepareTransition({
      duration: 1000,
      delay: 2000,
      ease: 'in'
    }));

    expect(result.duration).toEqual(1000);
    expect(result.delay).toEqual(2000);
    expect(result.ease).toEqual('in');
  });
});
